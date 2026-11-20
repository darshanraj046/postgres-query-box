
export const LAT_A = 'metadata.responseTimestamp'
export const LAT_B = 'metadata.requestTimestamp'
export const LATENCY = `(${LAT_A} - ${LAT_B})`
export const VALUE_FIELDS = ['data.request.verb', 'data.response.statusCode']
export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT', 'QUERY']
export const STATUS_CODES = [100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511].map(String)
const CATALOG = { 'data.request.verb': METHODS, 'data.response.statusCode': STATUS_CODES }
export const COMMON = ['data.request.verb', 'data.response.statusCode', 'data.request.path', 'data.request.hostname']

const KW = new Set(['AND', 'OR', 'NOT', 'CONTAINS', 'PRESENT', 'ABSENT', 'BETWEEN', 'ANYONE', 'NONEOF', 'IP', 'IN_RANGE', 'NOT_IN_RANGE', 'COUNT', 'WITHIN', 'GROUP', 'BY', 'LATENCY'])
const OPS = ['!~*', '!~', '~*', '==', '!=', '<=', '>=', '~', '<', '>', '=']
const CMP = new Set(['<', '<=', '>', '>='])
const REGEX = new Set(['~', '~*', '!~', '!~*'])
const TEXT_OPS = new Set(['~', '~*', '!~', '!~*', 'CONTAINS', 'NOT CONTAINS'])
const UNIT = { s: 1000, m: 60000, h: 3600000, d: 86400000 }

export const OP_INFO = {
  '==': 'equals',
  '!=': 'not equal',
  '~': 'matches regex',
  '~*': 'matches regex, any case',
  '!~': 'does not match regex',
  '!~*': 'does not match regex, any case',
  '<': 'less than',
  '<=': 'at most',
  '>': 'greater than',
  '>=': 'at least',
  CONTAINS: 'contains text',
  'NOT CONTAINS': 'does not contain text',
  PRESENT: 'has this field',
  ABSENT: 'missing this field',
  BETWEEN: 'between, both ends included',
  ANYONE: 'any one of',
  NONEOF: 'none of',
  'IP IN_RANGE': 'IP in range',
  'IP NOT_IN_RANGE': 'IP not in range'
}

export const TYPE_LABEL = { string: 'text', number: 'number', boolean: 'boolean', ip: 'ip', numtext: 'text', latency: 'ms' }

export function opsFor(f) {
  if (!f) return []
  if (f.type === 'latency') return ['>', '<', '>=', '<=']
  if (f.type === 'number') return ['==', '!=', '<', '<=', '>', '>=', 'BETWEEN', 'ANYONE', 'NONEOF', 'PRESENT', 'ABSENT']
  if (f.type === 'boolean') return ['==', '!=', 'PRESENT', 'ABSENT']
  if (f.type === 'ip') return ['IP IN_RANGE', 'IP NOT_IN_RANGE', '==', '!=', 'CONTAINS', 'NOT CONTAINS', '~', '~*', '!~', '!~*', 'ANYONE', 'NONEOF', 'PRESENT', 'ABSENT']
  if (f.type === 'numtext') return ['==', '!=', '>=', '>', '<', '<=', 'BETWEEN', 'ANYONE', 'NONEOF', '~', '!~', 'CONTAINS', 'NOT CONTAINS', 'PRESENT', 'ABSENT']
  return ['==', '!=', 'CONTAINS', 'NOT CONTAINS', '~', '~*', '!~', '!~*', 'ANYONE', 'NONEOF', 'PRESENT', 'ABSENT']
}

const GROUPS = [
  ['data.request.headerParams.', 'Request headers'],
  ['data.request.queryParams.', 'Query params'],
  ['data.request.', 'Request'],
  ['data.response.headerParams.', 'Response headers'],
  ['data.response.', 'Response'],
  ['metadata.additionalMetadata.', 'Additional metadata'],
  ['metadata.', 'Metadata']
]

export function buildSchema(rows) {
  const map = new Map()
  const visit = (o, segs) => {
    for (const k of Object.keys(o)) {
      const v = o[k]
      const ks = [...segs, k]
      const p = ks.join('.')
      if (v && typeof v === 'object' && !Array.isArray(v)) visit(v, ks)
      else {
        let f = map.get(p)
        if (!f) map.set(p, (f = { path: p, segs: ks, count: 0, kinds: new Set(), numeric: true, ip: true, values: new Map() }))
        f.count++
        f.kinds.add(typeof v)
        if (typeof v === 'string') {
          if (!/^-?\d+(\.\d+)?$/.test(v)) f.numeric = false
          if (!ipToBig(v)) f.ip = false
        }
        if (VALUE_FIELDS.includes(p)) f.values.set(v, (f.values.get(v) || 0) + 1)
      }
    }
  }
  for (const r of rows) visit({ data: r.data, metadata: r.metadata }, [])
  return schemaFromFields(
    [...map.values()].map((f) => {
      const kind = f.kinds.size === 1 ? [...f.kinds][0] : 'string'
      const type = kind === 'number' ? 'number' : kind === 'boolean' ? 'boolean' : f.ip ? 'ip' : f.numeric ? 'numtext' : 'string'
      const values = [...f.values.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ v, n }))
      return { path: f.path, segs: f.segs, count: f.count, type, values }
    }),
    rows.length
  )
}

export function schemaFromFields(list, total = 0) {
  const fields = list.map((f) => ({
    ...f,
    segs: f.segs || f.path.split('.'),
    type: f.type || 'string',
    count: f.count ?? total,
    group: f.group || (COMMON.includes(f.path) ? 'Common' : (GROUPS.find(([p]) => f.path.startsWith(p)) || [, 'Other'])[1]),
    values: f.values || []
  }))
  const order = ['Common', ...GROUPS.map((g) => g[1]), 'Other']
  fields.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || (a.group === 'Common' ? COMMON.indexOf(a.path) - COMMON.indexOf(b.path) : a.path.localeCompare(b.path)))
  const byPath = Object.fromEntries(fields.map((f) => [f.path, f]))
  const short = {}
  for (const f of fields) {
    for (let n = 1; n <= f.segs.length; n++) {
      const tail = f.segs.slice(-n).join('.')
      if (fields.filter((g) => g.segs.length >= n && g.segs.slice(-n).join('.') === tail).length === 1) {
        short[f.path] = tail
        break
      }
    }
  }
  return { fields, byPath, short, total }
}

export function ipToBig(s) {
  if (typeof s !== 'string') return null
  const v4 = (x) => {
    const p = x.split('.')
    if (p.length !== 4 || p.some((n) => !/^\d{1,3}$/.test(n) || +n > 255)) return null
    return p.reduce((a, n) => a * 256n + BigInt(n), 0n)
  }
  if (s.includes('.') && !s.includes(':')) {
    const n = v4(s)
    return n === null ? null : { v: 4, n }
  }
  if (!/^[0-9a-fA-F:.]+$/.test(s) || !s.includes(':')) return null
  let tail = null
  let x = s
  const m = s.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/)
  if (m) {
    tail = v4(m[2])
    if (tail === null) return null
    x = m[1] + '0:0'
  }
  const halves = x.split('::')
  if (halves.length > 2) return null
  const a = halves[0] ? halves[0].split(':') : []
  const b = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const fill = halves.length === 2 ? 8 - a.length - b.length : 0
  const parts = [...a, ...Array(fill).fill('0'), ...b]
  if (parts.length !== 8 || parts.some((p) => !/^[0-9a-fA-F]{1,4}$/.test(p))) return null
  let n = parts.reduce((acc, p) => acc * 65536n + BigInt(parseInt(p, 16)), 0n)
  if (tail !== null) n = (n >> 32n << 32n) + tail
  if (n >> 32n === 0xffffn) return { v: 4, n: n & 0xffffffffn }
  return { v: 6, n }
}

export function parseRange(s) {
  if (typeof s !== 'string') return null
  if (s.includes('/')) {
    const [base, bits] = s.split('/')
    const ip = ipToBig(base)
    const max = ip && ip.v === 4 ? 32 : 128
    if (!ip || !/^\d+$/.test(bits) || +bits > max) return null
    const host = BigInt(max - +bits)
    const lo = (ip.n >> host) << host
    return { v: ip.v, lo, hi: lo + (1n << host) - 1n }
  }
  const [a, b] = s.split('-')
  const x = ipToBig(a)
  const y = ipToBig(b)
  if (!x || !y || x.v !== y.v || x.n > y.n) return null
  return { v: x.v, lo: x.n, hi: y.n }
}

export const LAT_FIELD = { path: '@latency', type: 'latency' }

export function tokenize(src) {
  const out = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    const s = i
    if (c === '"') {
      i++
      let v = ''
      let closed = false
      while (i < src.length) {
        if (src[i] === '\\' && (src[i + 1] === '"' || src[i + 1] === '\\')) {
          v += src[i + 1]
          i += 2
          continue
        }
        if (src[i] === '"') {
          closed = true
          i++
          break
        }
        v += src[i++]
      }
      out.push({ t: 'str', v, s, e: i, closed, raw: src.slice(s, i) })
      continue
    }
    const prev = out[out.length - 1]
    const neg = c === '-' && /\d/.test(src[i + 1] || '') && prev && (prev.t === 'op' || (prev.t === 'punct' && prev.v !== ')') || (prev.t === 'kw' && prev.v !== 'COUNT'))
    if (/\d/.test(c) || neg) {
      const m = src.slice(i).match(/^-?\d+(?:\.\d+)?/)[0]
      i += m.length
      if (/[smhd]/.test(src[i] || '') && !/[A-Za-z0-9_]/.test(src[i + 1] || '')) {
        i++
        out.push({ t: 'dur', v: m + src[i - 1], ms: Number(m) * UNIT[src[i - 1]], s, e: i, raw: src.slice(s, i) })
      } else out.push({ t: 'num', v: Number(m), s, e: i, raw: m })
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_](?:[A-Za-z0-9_.-]|\\\.)*/)[0]
      i += m.length
      const up = m.toUpperCase()
      if (KW.has(up)) out.push({ t: 'kw', v: up, s, e: i, raw: m })
      else if (up === 'TRUE' || up === 'FALSE') out.push({ t: 'bool', v: up === 'TRUE', s, e: i, raw: m })
      else out.push({ t: 'word', v: m, s, e: i, raw: m })
      continue
    }
    const op = OPS.find((o) => src.startsWith(o, i))
    if (op) {
      i += op.length
      out.push({ t: 'op', v: op, s, e: i, raw: op })
      continue
    }
    i++
    if (c === '-') out.push({ t: 'minus', v: '-', s, e: i, raw: '-' })
    else if ('()[],'.includes(c)) out.push({ t: 'punct', v: c, s, e: i, raw: c })
    else out.push({ t: 'bad', v: c, s, e: i, raw: c })
  }
  return out
}

const near = (word, schema) => {
  const w = word.toLowerCase()
  const leaf = w.split('.').pop()
  const hits = schema.fields.filter((f) => f.path.toLowerCase().includes(leaf) || leaf.includes(f.path.split('.').pop().toLowerCase()))
  return hits.slice(0, 4).map((f) => f.path)
}

export const lit = (v) => (typeof v === 'string' ? '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"' : String(v))

export function parse(src, schema) {
  const toks = tokenize(src)
  const errors = []
  let p = 0
  const peek = (o = 0) => toks[p + o]
  const isKw = (t, k) => t && t.t === 'kw' && t.v === k
  const isP = (t, v) => t && t.t === 'punct' && t.v === v
  const role = (t, r) => t && (t.role = r)
  const fail = (t, msg, extra) => {
    throw { s: t ? t.s : src.length, e: t ? t.e : src.length, msg, eof: !t, ...extra }
  }
  const word = (t) => (t ? t.raw : '')

  const latencyAhead = () => isP(peek(), '(') && peek(1)?.t === 'word' && peek(2)?.t === 'minus' && peek(3)?.t === 'word' && isP(peek(4), ')')

  const value = (allowBool = true) => {
    const t = peek()
    if (!t) fail(null, 'Add a value')
    if (t.t === 'str') {
      if (!t.closed) fail(t, 'Close the quote', { at: t.e, fix: { s: t.e, e: t.e, text: '"', verb: 'Add', label: '"' } })
      role(t, 'str')
    } else if (t.t === 'num') role(t, 'num')
    else if (t.t === 'bool' && allowBool) role(t, 'bool')
    else fail(t, `Expected a value, found ${word(t)}`)
    p++
    return { v: t.v, raw: t.t === 'str' ? t.raw : t.t === 'bool' ? String(t.v) : t.raw, tok: t }
  }

  const list = (allowBool = true) => {
    const o = peek()
    if (!isP(o, '[')) fail(o, 'Expected a list like ["a", "b"]')
    p++
    const vals = []
    if (isP(peek(), ']')) fail(peek(), 'Add at least one value to the list')
    for (;;) {
      vals.push(value(allowBool))
      if (isP(peek(), ',')) {
        p++
        continue
      }
      if (isP(peek(), ']')) {
        const c = peek()
        p++
        return { vals, e: c.e }
      }
      const c = peek()
      const prev = peek(-1)
      const ins = (text, verb, label) => ({ s: prev.e, e: prev.e, text, verb, label })
      if (c && ['str', 'num', 'bool'].includes(c.t)) fail(c, `Separate list values with a comma, between ${prev.raw} and ${c.raw}`, { s: prev.s, at: prev.e, fix: ins(',', 'Add', ',') })
      fail(c, `Close the list with ] after ${prev.raw}`, { s: o.s, e: o.e, at: prev.e, fix: ins(']', 'Add', ']') })
    }
  }

  const typeFix = (f, val, display) => {
    if (!f) return
    const t = val.tok
    const isNumText = typeof val.v === 'string' && /^-?\d+(\.\d+)?$/.test(val.v)
    if ((f.type === 'string' || f.type === 'numtext' || f.type === 'ip') && t.t !== 'str') {
      errors.push({ s: t.s, e: t.e, msg: `${display} is stored as text, so ${t.raw} never matches. Use "${t.raw}".`, fix: { s: t.s, e: t.e, text: `"${t.raw}"`, label: `"${t.raw}"` } })
    } else if (f.type === 'number' && t.t !== 'num') {
      if (isNumText) errors.push({ s: t.s, e: t.e, msg: `${display} is stored as a number, so ${t.raw} never matches. Use ${val.v}.`, fix: { s: t.s, e: t.e, text: val.v, label: val.v } })
      else errors.push({ s: t.s, e: t.e, msg: `${display} holds numbers, ${t.raw} is not one` })
    } else if (f.type === 'boolean' && t.t !== 'bool') {
      if (t.t === 'str' && /^(true|false)$/i.test(val.v)) errors.push({ s: t.s, e: t.e, msg: `${display} is a boolean, write ${val.v.toLowerCase()} without quotes`, fix: { s: t.s, e: t.e, text: val.v.toLowerCase(), label: val.v.toLowerCase() } })
      else errors.push({ s: t.s, e: t.e, msg: `${display} is a boolean, use true or false` })
    }
  }

  const numFix = (val, display) => {
    const t = val.tok
    if (t.t === 'num') return
    if (t.t === 'str' && /^-?\d+(\.\d+)?$/.test(val.v)) errors.push({ s: t.s, e: t.e, msg: `Numeric operators take a bare number. Use ${val.v}.`, fix: { s: t.s, e: t.e, text: val.v, label: val.v } })
    else errors.push({ s: t.s, e: t.e, msg: `${display} needs a number here, found ${t.raw}` })
  }

  const condition = () => {
    const t = peek()
    let field
    let fs = t.s
    let fe
    if (isP(t, '(')) {
      const a = peek(1)
      const b = peek(3)
      ;[t, a, peek(2), b, peek(4)].forEach((x) => role(x, 'field'))
      if (a.v !== LAT_A || b.v !== LAT_B) errors.push({ s: t.s, e: peek(4).e, msg: `Latency is written ${LATENCY}`, fix: { s: t.s, e: peek(4).e, text: LATENCY, label: LATENCY } })
      field = '@latency'
      fe = peek(4).e
      p += 5
    } else if (isKw(t, 'LATENCY')) {
      role(t, 'field')
      field = '@latency'
      fe = t.e
      p++
    } else if (t.t === 'word') {
      role(t, 'field')
      field = t.v.replace(/\\\./g, '.')
      fe = t.e
      p++
      if (!schema.byPath[field]) {
        const n = near(field, schema)
        errors.push({ s: t.s, e: t.e, msg: `${field} is not a field in this index`, near: n })
      }
    } else fail(t, t.t === 'kw' ? `${t.raw} needs a condition before it` : `Expected a field, found ${word(t)}`)
    const f = field === '@latency' ? LAT_FIELD : schema.byPath[field]
    const display = field === '@latency' ? 'Latency' : field
    const o = peek()
    if (!o) fail(null, `Add an operator after ${display}`)
    let op
    if (o.t === 'op') {
      op = o.v === '=' ? '==' : o.v
      role(o, 'op')
      p++
    } else if (o.t === 'kw' && ['CONTAINS', 'PRESENT', 'ABSENT', 'BETWEEN', 'ANYONE', 'NONEOF'].includes(o.v)) {
      op = o.v
      role(o, 'op')
      p++
    } else if (isKw(o, 'NOT') && isKw(peek(1), 'CONTAINS')) {
      op = 'NOT CONTAINS'
      role(o, 'op')
      role(peek(1), 'op')
      p += 2
    } else if (isKw(o, 'IP') && (isKw(peek(1), 'IN_RANGE') || isKw(peek(1), 'NOT_IN_RANGE'))) {
      op = 'IP ' + peek(1).v
      role(o, 'op')
      role(peek(1), 'op')
      p += 2
    } else if (isKw(o, 'IP')) fail(peek(1) || o, 'After IP write IN_RANGE or NOT_IN_RANGE')
    else if (o.t === 'minus') {
      const b = peek(1)
      const open = peek(-2)
      if (b?.t === 'word' && isP(open, '(')) fail(o, `Missing ) after ${b.raw}`, { s: open.s, e: open.e, at: b.e, fix: { s: b.e, e: b.e, text: ')', verb: 'Add', label: ')' } })
      if (b?.t === 'word') fail(o, `Latency is written ${LATENCY}`, { s: t.s, e: b.e, at: b.e, fix: { s: t.s, e: b.e, text: LATENCY, verb: 'Wrap in', label: '( )' } })
      fail(o, `Latency is written ${LATENCY}`)
    }
    else fail(o, `Expected an operator after ${display}, found ${word(o)}`)
    const node = { k: 'cond', field, op, s: fs }
    if (f && !opsFor(f).includes(op)) {
      const why = f.type === 'latency' ? 'Latency takes >, <, >= or <=' : op.startsWith('IP') ? 'IP operators work only on fields that hold IP addresses' : CMP.has(op) || op === 'BETWEEN' ? `${op} needs a number field, ${display} holds ${TYPE_LABEL[f.type]}` : `${op} does not apply to ${display} (${TYPE_LABEL[f.type]})`
      errors.push({ s: o.s, e: (peek(-1) || o).e, msg: why })
    }
    if (op === 'PRESENT' || op === 'ABSENT') {
      node.e = o.e
      return node
    }
    if (op === 'BETWEEN') {
      const lo = value(false)
      const a = peek()
      if (!isKw(a, 'AND')) fail(a, 'BETWEEN needs AND, like BETWEEN 200 AND 299')
      role(a, 'op')
      p++
      const hi = value(false)
      numFix(lo, display)
      numFix(hi, display)
      if (Number(lo.v) > Number(hi.v)) errors.push({ s: lo.tok.s, e: hi.tok.e, msg: 'The first number must be the smaller one' })
      Object.assign(node, { lo, hi, e: hi.tok.e })
      return node
    }
    if (op === 'ANYONE' || op === 'NONEOF') {
      const l = list()
      for (const v of l.vals) typeFix(f, v, display)
      Object.assign(node, { vals: l.vals, e: l.e })
      return node
    }
    if (op.startsWith('IP')) {
      let vals
      if (isP(peek(), '[')) {
        const l = list(false)
        vals = l.vals
        node.e = l.e
        node.list = true
      } else {
        const v = value(false)
        vals = [v]
        node.e = v.tok.e
      }
      for (const v of vals) {
        if (v.tok.t !== 'str') errors.push({ s: v.tok.s, e: v.tok.e, msg: 'Write the range in quotes, like "10.0.0.0/8"' })
        else if (!v.v.trim()) errors.push({ s: v.tok.s, e: v.tok.e, msg: 'Add a range, like "10.0.0.0/8" or "10.0.0.1-10.0.0.50"' })
        else if (!parseRange(v.v.includes('/') || v.v.includes('-') ? v.v : v.v + (v.v.includes(':') ? '/128' : '/32'))) errors.push({ s: v.tok.s, e: v.tok.e, msg: `${v.raw} is not a valid CIDR or range. Use "10.0.0.0/8" or "10.0.0.1-10.0.0.50".` })
      }
      node.vals = vals
      return node
    }
    const v = value(!TEXT_OPS.has(op))
    node.val = v
    node.e = v.tok.e
    if (TEXT_OPS.has(op) && v.tok.t !== 'str') errors.push({ s: v.tok.s, e: v.tok.e, msg: `${op} takes text in quotes`, fix: { s: v.tok.s, e: v.tok.e, text: `"${v.tok.raw}"`, label: `"${v.tok.raw}"` } })
    else if (REGEX.has(op)) {
      try {
        new RegExp(v.v)
      } catch (err) {
        errors.push({ s: v.tok.s, e: v.tok.e, msg: `Invalid regex: ${String(err.message).replace(/^Invalid regular expression: /, '')}` })
      }
    } else if (CMP.has(op)) numFix(v, display)
    else if (op === '==' || op === '!=') typeFix(f, v, display)
    return node
  }

  const countClause = () => {
    const t = peek()
    role(t, 'fn')
    p++
    if (!isP(peek(), '(') || !isP(peek(1), ')')) fail(peek(), 'Write COUNT()')
    role(peek(), 'fn')
    role(peek(1), 'fn')
    p += 2
    const o = peek()
    if (!o || o.t !== 'op' || REGEX.has(o.v) || o.v === '!=') fail(o, 'COUNT() takes >, <, >=, <= or ==')
    role(o, 'op')
    p++
    const n = peek()
    if (!n || n.t !== 'num') fail(n, 'COUNT() needs a number, like COUNT() > 50')
    role(n, 'num')
    p++
    const node = { k: 'count', op: o.v === '=' ? '==' : o.v, n: n.v, s: t.s, e: n.e }
    if (isKw(peek(), 'WITHIN')) {
      role(peek(), 'kw')
      p++
      const d = peek()
      if (d && d.t === 'num') fail(d, `Add a unit: ${d.raw}s, ${d.raw}m, ${d.raw}h or ${d.raw}d`)
      if (!d || d.t !== 'dur') fail(d, 'WITHIN takes a window like 5m')
      role(d, 'num')
      p++
      node.within = d.v
      node.ms = d.ms
      node.e = d.e
    }
    if (isKw(peek(), 'GROUP')) {
      role(peek(), 'kw')
      p++
      if (!isKw(peek(), 'BY')) fail(peek(), 'Write GROUP BY')
      role(peek(), 'kw')
      p++
      const g = peek()
      if (!g || g.t !== 'word') fail(g, 'GROUP BY needs a field')
      role(g, 'field')
      p++
      const by = g.v.replace(/\\\./g, '.')
      if (!schema.byPath[by]) errors.push({ s: g.s, e: g.e, msg: `${g.v} is not a field in this index`, near: near(g.v, schema) })
      node.by = by
      node.e = g.e
    }
    return node
  }

  const primary = () => {
    const t = peek()
    if (!t) fail(null, 'Add a condition')
    if (isP(t, '(') && !latencyAhead()) {
      role(t, 'punct')
      p++
      const x = orExpr()
      const c = peek()
      if (!isP(c, ')')) {
        const end = peek(-1).e
        const ins = (text, label) => ({ s: end, e: end, text, verb: 'Add', label })
        if (c) fail(c, `Expected ) or AND/OR before ${word(c)}`, { at: end, fix: [...(toks.slice(p).some((x) => isP(x, ')')) ? [] : [ins(')', ')')]), ins(' AND', 'AND'), ins(' OR', 'OR')] })
        fail(c, 'Close the group with ). The highlighted ( is never closed.', { s: t.s, e: t.e, at: end, fix: [ins(')', ')'), { s: t.s, e: t.e, text: '', verb: 'Remove', label: 'this (' }] })
      }
      role(c, 'punct')
      p++
      return { k: 'group', x, s: t.s, e: c.e }
    }
    if (isKw(t, 'COUNT')) return countClause()
    return condition()
  }

  const notExpr = () => {
    const t = peek()
    if (isKw(t, 'NOT')) {
      role(t, 'kw')
      p++
      const x = notExpr()
      return { k: 'not', x, s: t.s, e: x.e }
    }
    return primary()
  }

  const join = (k, next) => () => {
    const items = [next()]
    while (isKw(peek(), k)) {
      role(peek(), 'kw')
      p++
      items.push(next())
    }
    return items.length === 1 ? items[0] : { k: k.toLowerCase(), items, s: items[0].s, e: items[items.length - 1].e }
  }
  const andExpr = join('AND', notExpr)
  const orExpr = join('OR', andExpr)

  let ast = null
  let syntax = null
  if (toks.length) {
    try {
      ast = orExpr()
      if (p < toks.length) {
        const t = peek()
        const end = peek(-1).e
        if (isP(t, ')')) fail(t, 'This ) has no matching (', { fix: { s: t.s, e: t.e, text: '', verb: 'Remove', label: 'this )' } })
        fail(t, `Join conditions with AND or OR before ${word(t)}`, { at: end, fix: [' AND', ' OR'].map((x) => ({ s: end, e: end, text: x, verb: 'Add', label: x.trim() })) })
      }
    } catch (err) {
      if (!err || err.msg === undefined) throw err
      syntax = err
      ast = null
    }
  }
  if (ast) {
    const counts = []
    const walk = (n, top) => {
      if (n.k === 'count') counts.push({ n, top })
      if (n.items) n.items.forEach((x, i) => walk(x, n === ast && n.k === 'and' && i === n.items.length - 1))
      if (n.x) walk(n.x, false)
    }
    walk(ast, ast.k === 'count')
    if (counts.length > 1) counts.slice(1).forEach(({ n }) => errors.push({ s: n.s, e: n.e, msg: 'Only one COUNT() per query' }))
    else if (counts.length === 1 && !counts[0].top) errors.push({ s: counts[0].n.s, e: counts[0].n.e, msg: 'COUNT() goes last, joined with AND' })
  }
  const all = syntax ? [syntax, ...errors] : errors
  all.sort((a, b) => a.s - b.s)
  return { ast, errors: all, toks }
}

export function format(ast, name, pretty) {
  const f = (x) => (x === '@latency' ? (name ? name(x) : LATENCY) : name ? name(x) : x)
  const one = (n, d = 0) => {
    if (n.k === 'cond') {
      const head = `${f(n.field)} ${n.op}`
      if (n.op === 'PRESENT' || n.op === 'ABSENT') return head
      if (n.op === 'BETWEEN') return `${head} ${n.lo.raw} AND ${n.hi.raw}`
      if (n.vals && (n.list || !n.op.startsWith('IP'))) return `${head} [${n.vals.map((v) => v.raw).join(', ')}]`
      if (n.vals) return `${head} ${n.vals[0].raw}`
      return `${head} ${n.val.raw}`
    }
    if (n.k === 'count') return `COUNT() ${n.op} ${n.n}${n.within ? ' WITHIN ' + n.within : ''}${n.by ? ' GROUP BY ' + f(n.by) : ''}`
    const ind = (k) => '\n' + '  '.repeat(k)
    if (n.k === 'group') return pretty && n.x.items ? `(${ind(d + 1)}${one(n.x, d + 1)}${ind(d)})` : `(${one(n.x, d)})`
    if (n.k === 'not') return `NOT ${one(n.x, d)}`
    if (pretty) return n.items.map((x, i) => (i ? `${ind(d)}${n.k.toUpperCase()} ` : '') + one(x, d)).join('')
    return n.items.map((x) => one(x)).join(` ${n.k.toUpperCase()} `)
  }
  return ast ? one(ast) : ''
}

export const get = (row, path) => {
  const segs = path.replace(/\\\./g, '.').split('.')
  let o = row
  let i = 0
  while (i < segs.length) {
    if (o == null || typeof o !== 'object') return undefined
    let j = segs.length
    while (j > i && !(segs.slice(i, j).join('.') in o)) j--
    if (j === i) return undefined
    o = o[segs.slice(i, j).join('.')]
    i = j
  }
  return o
}

const asNum = (v) => (typeof v === 'number' ? v : typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null)

const inRanges = (v, vals) => {
  const ip = ipToBig(v)
  if (!ip) return null
  return vals.some((x) => {
    const r = parseRange(x.v.includes('/') || x.v.includes('-') ? x.v : x.v + (x.v.includes(':') ? '/128' : '/32'))
    return r && r.v === ip.v && ip.n >= r.lo && ip.n <= r.hi
  })
}

function test(n, row) {
  if (n.k === 'group') return test(n.x, row)
  if (n.k === 'not') {
    const r = test(n.x, row)
    return r === null ? null : !r
  }
  if (n.k === 'and') {
    let unknown = false
    for (const x of n.items) {
      const r = test(x, row)
      if (r === false) return false
      if (r === null) unknown = true
    }
    return unknown ? null : true
  }
  if (n.k === 'or') {
    let unknown = false
    for (const x of n.items) {
      const r = test(x, row)
      if (r === true) return true
      if (r === null) unknown = true
    }
    return unknown ? null : false
  }
  if (n.k === 'count') return true
  let v
  if (n.field === '@latency') {
    const a = get(row, LAT_A)
    const b = get(row, LAT_B)
    v = typeof a === 'number' && typeof b === 'number' ? a - b : undefined
  } else v = get(row, n.field)
  if (n.op === 'PRESENT') return v !== undefined && v !== null
  if (n.op === 'ABSENT') return v === undefined || v === null
  if (v === undefined || v === null) return null
  switch (n.op) {
    case '==':
      return v === n.val.v
    case '!=':
      return v !== n.val.v
    case '~':
    case '~*':
    case '!~':
    case '!~*': {
      const hit = new RegExp(n.val.v, n.op.endsWith('*') ? 'i' : '').test(String(v))
      return n.op.startsWith('!') ? !hit : hit
    }
    case 'CONTAINS':
      return String(v).includes(n.val.v)
    case 'NOT CONTAINS':
      return !String(v).includes(n.val.v)
    case 'ANYONE':
      return n.vals.some((x) => x.v === v)
    case 'NONEOF':
      return !n.vals.some((x) => x.v === v)
    case 'IP IN_RANGE':
      return inRanges(v, n.vals)
    case 'IP NOT_IN_RANGE': {
      const r = inRanges(v, n.vals)
      return r === null ? null : !r
    }
  }
  const x = asNum(v)
  if (x === null) return null
  if (n.op === 'BETWEEN') return x >= Number(n.lo.v) && x <= Number(n.hi.v)
  const y = Number(n.val.v)
  return n.op === '<' ? x < y : n.op === '<=' ? x <= y : n.op === '>' ? x > y : x >= y
}

const cmp = (a, op, b) => (op === '>' ? a > b : op === '<' ? a < b : op === '>=' ? a >= b : op === '<=' ? a <= b : a === b)

export function evaluate(ast, rows) {
  if (!ast) return { rows, count: null }
  const count = ast.k === 'count' ? ast : ast.k === 'and' && ast.items[ast.items.length - 1].k === 'count' ? ast.items[ast.items.length - 1] : null
  const hit = rows.filter((r) => test(ast, r) === true)
  if (!count) return { rows: hit, count: null }
  const buckets = new Map()
  for (const r of hit) {
    const key = count.by ? get(r, count.by) : '*'
    if (key === undefined || key === null) continue
    const win = count.ms ? Math.floor(r.metadata.requestTimestamp / count.ms) * count.ms : 0
    const id = key + '\u0000' + win
    let b = buckets.get(id)
    if (!b) buckets.set(id, (b = { key, win, rows: [] }))
    b.rows.push(r)
  }
  const pass = [...buckets.values()].filter((b) => cmp(b.rows.length, count.op, count.n)).sort((a, b) => b.rows.length - a.rows.length)
  return { rows: pass.flatMap((b) => b.rows).sort((a, b) => b.metadata.requestTimestamp - a.metadata.requestTimestamp), count: { node: count, groups: pass, buckets: buckets.size, filtered: hit.length } }
}

export function context(src, caret, schema) {
  const toks = tokenize(src.slice(0, caret))
  let part = null
  const last = toks[toks.length - 1]
  if (last && last.e === caret && ['word', 'kw', 'bool', 'op', 'num', 'dur'].includes(last.t)) part = toks.pop()
  else if (last && last.t === 'str' && !last.closed) part = toks.pop()
  let st = 'term'
  let depth = 0
  let field = null
  let op = null
  let between = false
  let hasCount = /\bCOUNT\s*\(/i.test(src.slice(caret))
  let used = []
  let inList = false
  let opTok = null
  let eq = null
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    const kw = t.t === 'kw' ? t.v : null
    if (kw === 'COUNT') hasCount = true
    if (st === 'term') {
      if (kw === 'NOT') continue
      if (t.v === '(' && t.t === 'punct') depth++
      else if (kw === 'COUNT') st = 'countParen'
      else if (kw === 'LATENCY') (field = LAT_FIELD), (st = 'op')
      else if (t.t === 'word') (field = schema.byPath[t.v.replace(/\\\./g, '.')] || { path: t.v, type: null }), (st = 'op')
      else st = 'bad'
    } else if (st === 'op') {
      if (t.t === 'minus') st = 'lat2'
      else if (t.t === 'op') (op = t.v === '=' ? '==' : t.v), (opTok = t), (st = 'value')
      else if (kw === 'PRESENT' || kw === 'ABSENT') st = 'joiner'
      else if (kw === 'CONTAINS') (op = kw), (st = 'value')
      else if (kw === 'NOT') st = 'notc'
      else if (kw === 'IP') st = 'ipop'
      else if (kw === 'BETWEEN') (op = kw), (between = true), (st = 'value')
      else if (kw === 'ANYONE' || kw === 'NONEOF') (op = kw), (opTok = t), (st = 'listStart')
      else st = 'bad'
    } else if (st === 'lat2') st = t.t === 'word' ? 'latClose' : 'bad'
    else if (st === 'latClose') {
      if (t.v === ')') (depth = Math.max(0, depth - 1)), (field = LAT_FIELD), (st = 'op')
      else st = 'bad'
    } else if (st === 'notc') st = kw === 'CONTAINS' ? ((op = 'NOT CONTAINS'), 'value') : 'bad'
    else if (st === 'ipop') st = kw === 'IN_RANGE' || kw === 'NOT_IN_RANGE' ? ((op = 'IP ' + kw), 'value') : 'bad'
    else if (st === 'listStart') st = t.v === '[' ? ((used = []), (inList = true), 'list') : 'bad'
    else if (st === 'value') {
      if (t.v === '[' && t.t === 'punct') (used = []), (inList = true), (st = 'list')
      else if (t.t === 'str' || t.t === 'num' || t.t === 'bool') (st = between ? 'betAnd' : 'joiner'), (eq = (op === '==' || op === '!=') && opTok ? { op, from: opTok.s, to: t.e, vals: [t.v] } : null)
      else st = 'bad'
    } else if (st === 'list') {
      if (t.t === 'str' || t.t === 'num' || t.t === 'bool') used.push(t.v)
      else if (t.v === ']') (inList = false), (st = 'joiner'), (eq = (op === 'ANYONE' || op === 'NONEOF') && opTok ? { op, from: opTok.s, to: t.e, vals: [...used] } : null)
      else if (t.v !== ',') st = 'bad'
    } else if (st === 'betAnd') st = kw === 'AND' ? ((between = false), 'value') : 'bad'
    else if (st === 'joiner') {
      if (kw === 'AND' || kw === 'OR') (st = 'term'), (field = null), (op = null), (eq = null)
      else if (t.v === ')' && t.t === 'punct') depth = Math.max(0, depth - 1)
      else st = 'bad'
    } else if (st === 'countParen') st = t.v === '(' ? 'countParen2' : 'bad'
    else if (st === 'countParen2') st = t.v === ')' ? 'countOp' : 'bad'
    else if (st === 'countOp') st = t.t === 'op' ? 'countN' : 'bad'
    else if (st === 'countN') st = t.t === 'num' ? 'countAfter' : 'bad'
    else if (st === 'countAfter') st = kw === 'WITHIN' ? 'dur' : kw === 'GROUP' ? 'by' : 'bad'
    else if (st === 'dur') st = t.t === 'dur' ? 'countAfter2' : 'bad'
    else if (st === 'countAfter2') st = kw === 'GROUP' ? 'by' : 'bad'
    else if (st === 'by') st = kw === 'BY' ? 'groupField' : 'bad'
    else if (st === 'groupField') st = t.t === 'word' ? 'end' : 'bad'
  }
  let to = caret
  const tail = src.slice(caret).match(/^(?:[A-Za-z0-9_.-]|\\\.)+/)
  if (part && part.t !== 'str' && tail) to += tail[0].length
  if (part && part.t === 'str') {
    const m = src.slice(caret).match(/^(?:[^"\\\n]|\\.)*"/)
    if (m) to += m[0].length
  }
  const from = part ? part.s : caret
  const q = part ? (part.t === 'str' ? part.v : part.raw).toLowerCase() : ''
  const before = src.slice(0, from)
  const pad = before && !/[\s([]$/.test(before) ? ' ' : ''
  const res = (kind, title, items, extra) => ({ kind, title, items, from, to, q, ...extra })
  const kws = (list, title) => res('kw', title, list.filter((x) => !q || x.label.toLowerCase().startsWith(q) || x.label.toLowerCase().includes(' ' + q)))

  if (st === 'term' || st === 'groupField') {
    const items = []
    const match = (s) => !q || s.toLowerCase().includes(q)
    for (const f of schema.fields) if (match(f.path)) items.push({ kind: 'field', label: f.path, insert: f.path + ' ', type: f.type, count: f.count, group: f.group, reopen: st === 'term' })
    if (st === 'term') {
      const at = items.findIndex((x) => x.group !== 'Common')
      if (match('latency') || match(LATENCY)) items.splice(at < 0 ? items.length : at, 0, { kind: 'field', label: LATENCY, sub: 'latency in ms', insert: LATENCY + ' ', type: 'latency', group: 'Common', reopen: true })
      const prev = toks[toks.length - 1]
      if (!hasCount && depth === 0 && (!prev || (prev.t === 'kw' && prev.v === 'AND')) && match('count()')) items.push({ kind: 'fn', label: 'COUNT()', sub: 'threshold on matching calls, goes last', insert: 'COUNT() ', group: 'Functions', reopen: true, pin: true })
      if (match('not')) items.push({ kind: 'kw', label: 'NOT', sub: 'negate the next condition or group', insert: 'NOT ', group: 'Logic', reopen: true, pin: true })
      if (!q) items.push({ kind: 'kw', label: '(', sub: 'start a group', insert: '(', group: 'Logic', reopen: true, pin: true })
    }
    return res('fields', st === 'term' ? 'Fields' : 'Group by', items, { total: schema.fields.length })
  }
  if (st === 'op') {
    if (!field || !field.type) return null
    const ops = opsFor(field).filter((o) => !q || o.toLowerCase().startsWith(q) || OP_INFO[o].includes(q))
    const hasValues = VALUE_FIELDS.includes(field.path)
    const items = ops.map((o) => {
      let insert = o + ' '
      let caretAt = null
      let reopen = false
      if (o === 'PRESENT' || o === 'ABSENT') reopen = true
      else if (o === 'ANYONE' || o === 'NONEOF') (insert = o + ' []'), (caretAt = insert.length - 1), (reopen = hasValues || field.type === 'boolean')
      else if (o.startsWith('IP')) (insert = o + ' ""'), (caretAt = insert.length - 1), (reopen = true)
      else if (o === '==' || o === '!=') {
        if (hasValues || field.type === 'boolean') reopen = true
        else if (field.type !== 'number' && field.type !== 'latency') (insert = o + ' ""'), (caretAt = insert.length - 1)
      } else if (TEXT_OPS.has(o)) (insert = o + ' ""'), (caretAt = insert.length - 1)
      return { kind: 'op', label: o, sub: OP_INFO[o], insert, caretAt, reopen }
    })
    return res('ops', `Operators · ${field.path === '@latency' ? LATENCY : field.path}`, items, { field })
  }
  if (st === 'notc') return kws([{ kind: 'op', label: 'CONTAINS', sub: OP_INFO['NOT CONTAINS'], insert: 'CONTAINS ""', caretAt: 10 }], 'Operators')
  if (st === 'ipop') return kws(['IN_RANGE', 'NOT_IN_RANGE'].map((x) => ({ kind: 'op', label: x, sub: OP_INFO['IP ' + x], insert: x + ' ""', caretAt: x.length + 2, reopen: true })), 'Operators')
  const catalog = field && CATALOG[field.path]
  const another = (e) =>
    catalog
      .filter((v) => !e.vals.includes(v))
      .map((v) => ({ kind: 'value', label: lit(v), insert: `${e.op === '!=' || e.op === 'NONEOF' ? 'NONEOF' : 'ANYONE'} [${[...e.vals, v].map(lit).join(', ')}] `, from: e.from, to: e.to, reopen: true, group: 'Add another value' }))
  if (st === 'value' && catalog && opTok && (op === '==' || op === '!=') && part?.t === 'str' && catalog.includes(part.v)) return res('values', 'Add another value', another({ op, from: opTok.s, to, vals: [part.v] }))
  const ranges = {
    'data.response.statusCode': ['Informational', 'Success', 'Redirect', 'Client error', 'Server error'].map((n, i) => [`${i + 1}00 AND ${i + 1}99`, `${i + 1}XX · ${n}`]),
    'data.request.port': [['0 AND 1023', 'Well-known ports'], ['1024 AND 49151', 'Registered ports'], ['49152 AND 65535', 'Dynamic ports'], ['8000 AND 8999', '8xxx app ports']]
  }
  const nums = (list, title) => res('ops', title, list.map(([label, sub]) => ({ kind: 'op', label: String(label), sub, insert: label + ' ', num: true, reopen: true })).filter((x) => !q || x.label.startsWith(q)))
  if (st === 'value' && between && ranges[field?.path]) return nums(ranges[field.path], `Example ranges · ${field.path}`)
  if ((st === 'value' || st === 'list') && op?.startsWith('IP')) {
    const lastTok = toks[toks.length - 1]
    const lead = inList && !part && used.length && !(lastTok && lastTok.v === ',') ? ', ' : ''
    return res('ops', `Example ranges · ${field?.path}`, [['10.0.0.0/8', 'Private network, 10.x.x.x'], ['172.16.0.0/12', 'Private network, 172.16 to 172.31'], ['192.168.0.0/16', 'Private network, 192.168.x.x'], ['127.0.0.0/8', 'Loopback'], ['169.254.0.0/16', 'Link-local'], ['10.0.0.1-10.0.0.50', 'First to last address']].filter(([v]) => !used.includes(v)).map(([v, sub]) => ({ kind: 'op', label: `"${v}"`, sub, insert: lead + `"${v}"` + (inList ? '' : ' '), str: true, reopen: true })).filter((x) => !q || x.label.includes(q)), { list: inList })
  }
  if (st === 'value' && CMP.has(op) && field?.type === 'latency' && !q) return nums([[100, '100 ms'], [250, '250 ms'], [500, '500 ms'], [1000, '1 s'], [2000, '2 s'], [5000, '5 s'], [10000, '10 s']], 'Example thresholds · latency in ms')
  if ((st === 'value' && !between && !op?.startsWith('IP') && !CMP.has(op)) || st === 'list') {
    if (!field) return null
    const fresh = (v) => !used.includes(v)
    let vals = []
    if (catalog && (op === '==' || op === '!=' || inList)) vals = catalog.filter(fresh).map((v) => ({ v }))
    else if (field.type === 'boolean' && (op === '==' || op === '!=' || inList)) vals = [true, false].filter(fresh).map((v) => ({ v }))
    if (!vals.length) return null
    const lastTok = toks[toks.length - 1]
    const comma = inList && used.length && !(lastTok && lastTok.v === ',') ? ', ' : ''
    const items = vals
      .filter((x) => !q || String(x.v).toLowerCase().startsWith(q.replace(/^"/, '')))
      .map((x) => ({ kind: 'value', label: lit(x.v), insert: (part ? '' : comma) + lit(x.v) + (inList ? '' : ' '), reopen: true }))
    return res('values', inList && used.length ? `Add another · ${field.path}` : `Values · ${field.path}`, items, { list: inList })
  }
  if (st === 'betAnd') return kws([{ kind: 'kw', label: 'AND', sub: 'then the upper bound', insert: pad + 'AND ' }], 'Between')
  if (st === 'joiner' || st === 'end') {
    const items = []
    if (st === 'joiner') {
      items.push({ kind: 'kw', label: 'AND', sub: 'both must match', insert: pad + 'AND ', reopen: true })
      items.push({ kind: 'kw', label: 'OR', sub: 'either can match', insert: pad + 'OR ', reopen: true })
      items.push({ kind: 'kw', label: 'AND NOT', sub: 'exclude the next condition', insert: pad + 'AND NOT ', reopen: true })
      if (depth > 0) items.push({ kind: 'kw', label: ')', sub: 'close the group', insert: ') ', trim: true, reopen: true })
      if (!hasCount && depth === 0) items.push({ kind: 'fn', label: 'AND COUNT()', sub: 'threshold on matching calls', insert: pad + 'AND COUNT() ', reopen: true })
    }
    if (st === 'joiner' && eq && catalog && !q) return res('kw', 'Combine', [...another(eq), ...items.map((x) => ({ ...x, group: 'Join conditions', pin: true }))])
    return kws(items, 'Combine')
  }
  if (st === 'countOp') return kws(['>', '>=', '<', '<=', '=='].map((o) => ({ kind: 'op', label: o, sub: OP_INFO[o], insert: o + ' ' })), 'COUNT()')
  if (st === 'countAfter' || st === 'countAfter2') {
    const items = []
    if (st === 'countAfter') items.push({ kind: 'kw', label: 'WITHIN', sub: 'window, defaults to the time range', insert: pad + 'WITHIN ', reopen: true })
    items.push({ kind: 'kw', label: 'GROUP BY', sub: 'count each value on its own', insert: pad + 'GROUP BY ', reopen: true })
    return kws(items, 'COUNT()')
  }
  if (st === 'dur') return kws(['1m', '5m', '10m', '15m', '1h', '1d'].map((d) => ({ kind: 'value', label: d, insert: d + ' ', reopen: true })), 'Window')
  if (st === 'by') return kws([{ kind: 'kw', label: 'BY', insert: 'BY ', reopen: true }], 'COUNT()')
  return null
}

let uid = 0
const nid = () => 'b' + ++uid
const RE_META = /[.*+?^${}()|[\]\\]/
const escRe = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const unescRe = (p) => {
  let out = ''
  for (let i = 0; i < p.length; i++) {
    if (p[i] === '\\' && i + 1 < p.length && RE_META.test(p[i + 1])) out += p[++i]
    else if (RE_META.test(p[i])) return null
    else out += p[i]
  }
  return out
}

export const BUILD_OPS = [
  ['Equality', ['==', '!=', 'ANYONE', 'NONEOF']],
  ['Compare', ['<', '<=', '>', '>=', 'BETWEEN']],
  ['Text', ['CONTAINS', 'NOT CONTAINS', '~', '!~']],
  ['Existence', ['PRESENT', 'ABSENT']],
  ['Network', ['IP IN_RANGE', 'IP NOT_IN_RANGE']]
]

export const arity = (op) => (op === 'PRESENT' || op === 'ABSENT' ? 'none' : op === 'BETWEEN' ? 'two' : op === 'ANYONE' || op === 'NONEOF' ? 'list' : op.startsWith('IP') ? 'ip' : 'one')

export const isComplete = (c) => {
  if (!c.field) return false
  const a = arity(c.op)
  const vals = c.values.filter((v) => String(v).trim())
  return a === 'none' || (a === 'two' ? vals.length === 2 : vals.length > 0)
}

export const newCond = () => ({ kind: 'cond', id: nid(), field: '', op: '==', values: [], ci: false, not: false })

export function toTree(ast) {
  const root = { kind: 'group', id: nid(), join: 'AND', not: false, items: [], count: null }
  if (!ast) return root
  const node = (n, not = false) => {
    if (n.k === 'not') return node(n.x, !not)
    if (n.k === 'group') return node(n.x, not)
    if (n.k === 'and' || n.k === 'or') return { kind: 'group', id: nid(), join: n.k.toUpperCase(), not, items: n.items.map((x) => node(x)) }
    let op = n.op
    let ci = false
    if (op === '~*' || op === '!~*') (ci = true), (op = op.slice(0, -1))
    let values = n.op === 'BETWEEN' ? [String(n.lo.v), String(n.hi.v)] : n.vals ? n.vals.map((v) => String(v.v)) : n.val ? [String(n.val.v)] : []
    if (ci) {
      const plain = unescRe(values[0])
      if (plain !== null) (op = op === '~' ? 'CONTAINS' : 'NOT CONTAINS'), (values = [plain])
    }
    return { kind: 'cond', id: nid(), field: n.field, op, values, ci, not }
  }
  const top = ast.k === 'and' ? ast.items : [ast]
  const rest = []
  for (const n of top) {
    if (n.k === 'count') root.count = { op: n.op, n: String(n.n), within: n.within || '', by: n.by || '' }
    else rest.push(n)
  }
  if (ast.k === 'and') root.items = rest.map((x) => node(x))
  else if (rest.length) {
    const one = node(rest[0])
    if (one.kind === 'group' && !one.not) (root.join = one.join), (root.items = one.items)
    else root.items = [one]
  }
  return root
}

export function fromTree(root, schema) {
  const quoted = (field) => {
    const f = field === '@latency' ? LAT_FIELD : schema.byPath[field]
    return !f || (f.type !== 'number' && f.type !== 'boolean' && f.type !== 'latency')
  }
  const cond = (c) => {
    const head = c.field === '@latency' ? LATENCY : c.field
    const vals = c.values.map((v) => String(v).trim()).filter(Boolean)
    const val = (v) => (quoted(c.field) ? lit(v) : v)
    const a = arity(c.op)
    let s
    if (a === 'none') s = `${head} ${c.op}`
    else if (a === 'two') s = `${head} BETWEEN ${vals[0]} AND ${vals[1]}`
    else if (a === 'list') s = `${head} ${c.op} [${vals.map(val).join(', ')}]`
    else if (a === 'ip') s = `${head} ${c.op} ${vals.length > 1 ? `[${vals.map(lit).join(', ')}]` : lit(vals[0])}`
    else if (CMP.has(c.op)) s = `${head} ${c.op} ${vals[0]}`
    else if (c.op === 'CONTAINS' || c.op === 'NOT CONTAINS') s = c.ci ? `${head} ${c.op === 'CONTAINS' ? '~*' : '!~*'} ${lit(escRe(vals[0]))}` : `${head} ${c.op} ${lit(vals[0])}`
    else if (c.op === '~' || c.op === '!~') s = `${head} ${c.op}${c.ci ? '*' : ''} ${lit(vals[0])}`
    else s = `${head} ${c.op} ${val(vals[0])}`
    return c.not ? `NOT ${s}` : s
  }
  const group = (g, top) => {
    const parts = g.items.map((x) => [x.j || g.join, x.kind === 'group' ? group(x, false) : isComplete(x) ? cond(x) : '']).filter((x) => x[1])
    if (!parts.length) return ''
    const body = parts.map(([j, x], i) => (i ? ` ${j} ${x}` : x)).join('')
    if (top) return body
    if (parts.length === 1) return g.not ? `NOT ${body.startsWith('NOT ') ? `(${body})` : body}` : body
    return `${g.not ? 'NOT ' : ''}(${body})`
  }
  let t = group(root, true)
  const c = root.count
  if (c && String(c.n).trim()) {
    const cnt = `COUNT() ${c.op} ${String(c.n).trim()}${c.within.trim() ? ` WITHIN ${c.within.trim()}` : ''}${c.by ? ` GROUP BY ${c.by}` : ''}`
    t = t ? `${root.items.some((x, i) => i && (x.j || root.join) === 'OR') && root.items.filter((x) => x.kind === 'group' || isComplete(x)).length > 1 ? `(${t})` : t} AND ${cnt}` : cnt
  }
  return t
}
