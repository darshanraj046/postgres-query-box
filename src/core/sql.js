import { LAT_A, LAT_B } from './engine.js'

const OCT = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)'
const V4 = `(${OCT}\\.){3}${OCT}`
const H = '[0-9a-f]{1,4}'
const V6 = [
  `(${H}:){7}${H}`,
  `(${H}:){1,7}:`,
  `(${H}:){1,6}:${H}`,
  `(${H}:){1,5}(:${H}){1,2}`,
  `(${H}:){1,4}(:${H}){1,3}`,
  `(${H}:){1,3}(:${H}){1,4}`,
  `(${H}:){1,2}(:${H}){1,5}`,
  `${H}:(:${H}){1,6}`,
  `:((:${H}){1,7}|:)`,
  `(${H}:){6}${V4}`,
  `(${H}:){1,5}:${V4}`,
  `::(${H}:){0,5}${V4}`
]
const IP_RE = `^(${V4}|${V6.join('|')})$`
const NUM_RE = '^-?\\d+(\\.\\d+)?$'
const SQL_OP = { '==': '=', '!=': '<>', '<': '<', '<=': '<=', '>': '>', '>=': '>=' }

const str = (s) => {
  if (s.includes('\0')) throw new Error('Text values cannot contain a NUL character')
  return "'" + s.replace(/'/g, "''") + "'"
}

export function toSql(ast, schema) {
  const segs = (field) => schema?.byPath?.[field]?.segs || field.split('.')
  const path = (field, last) => {
    const s = segs(field).map(str)
    return `data${s.slice(0, -1).map((k) => `->${k}`).join('')}${last}${s[s.length - 1]}`
  }
  const json = (field) => `NULLIF(${path(field, '->')},'null'::jsonb)`
  const text = (field) => path(field, '->>')
  const num = (field) => {
    if (field === '@latency') {
      const a = path(LAT_A, '->')
      const b = path(LAT_B, '->')
      return `(CASE WHEN jsonb_typeof(${a}) = 'number' AND jsonb_typeof(${b}) = 'number' THEN (${a})::numeric - (${b})::numeric END)`
    }
    const t = text(field)
    return `(CASE WHEN ${t} ~ '${NUM_RE}' THEN (${t})::numeric END)`
  }
  const numLit = (x) => (/^-?\d+(\.\d+)?$/.test(x.raw) ? x.raw : String(Number(x.v)))
  const jv = (x) => `to_jsonb(${typeof x.v === 'string' ? str(x.v) + '::text' : typeof x.v === 'boolean' ? String(x.v) : numLit(x)})`
  const ipCond = (field, vals) => {
    const t = text(field)
    const v = `(${t})::inet`
    const m = `(CASE WHEN ${v}<<='::ffff:0.0.0.0/96' THEN '0.0.0.0'::inet+(${v}-'::ffff:0.0.0.0'::inet) ELSE ${v} END)`
    const nets = vals.filter((x) => !x.includes('-'))
    const tests = vals.filter((x) => x.includes('-')).map((x) => `${m} BETWEEN ${str(x.split('-')[0])}::inet AND ${str(x.split('-')[1])}::inet`)
    if (nets.length) tests.unshift(`${m}<<=ANY(ARRAY[${nets.map(str).join(',')}]::inet[])`)
    return `(CASE WHEN ${t}~*'${IP_RE}' THEN ${tests.join(' OR ')} END)`
  }

  const cond = (n) => {
    const { field, op } = n
    if (op === 'PRESENT') return `${text(field)} IS NOT NULL`
    if (op === 'ABSENT') return `${text(field)} IS NULL`
    if (op === 'BETWEEN') return `${num(field)} BETWEEN ${numLit(n.lo)} AND ${numLit(n.hi)}`
    if (op === 'ANYONE' || op === 'NONEOF') return `${json(field)} ${op === 'NONEOF' ? 'NOT IN' : 'IN'} (${n.vals.map(jv).join(', ')})`
    if (op.startsWith('IP')) return `${op === 'IP NOT_IN_RANGE' ? 'NOT ' : ''}${ipCond(field, n.vals.map((x) => x.v))}`
    const v = n.val.v
    if (op === 'CONTAINS') return `strpos(${text(field)}, ${str(v)}) > 0`
    if (op === 'NOT CONTAINS') return `strpos(${text(field)}, ${str(v)}) = 0`
    if (op.includes('~')) return `${text(field)} ${op} ${str(v)}`
    if (op === '==' || op === '!=') return `${json(field)} ${SQL_OP[op]} ${jv(n.val)}`
    return `${num(field)} ${SQL_OP[op]} ${numLit(n.val)}`
  }

  const one = (n) => {
    if (n.k === 'cond') return cond(n)
    if (n.k === 'group') return `(${one(n.x)})`
    if (n.k === 'not') return `NOT (${one(n.x)})`
    return n.items.map(one).join(` ${n.k.toUpperCase()} `)
  }

  if (!ast) return { where: '', count: null }
  const items = ast.k === 'and' ? ast.items : [ast]
  const last = items[items.length - 1]
  const c = last.k === 'count' ? last : null
  const rest = c ? items.slice(0, -1) : items
  const where = rest.length ? `(${one(rest.length === 1 ? rest[0] : { k: 'and', items: rest })})` : ''
  const count = c && { op: SQL_OP[c.op], value: c.n, window: c.ms || 0, by: c.by ? segs(c.by) : null }
  return { where, count }
}
