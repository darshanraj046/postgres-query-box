import { readFileSync } from 'fs'
import { execFileSync } from 'child_process'
import { buildSchema, parse, evaluate, format, lit } from '../src/core/engine.js'
import { toSql } from '../src/core/sql.js'
import { makeRows, SAVED } from './rows.js'

const rows = makeRows()
const schema = buildSchema(rows)
const X = 'data.request.headerParams.x-envoy-external-address'
const src = readFileSync(new URL('./qcheck.mjs', import.meta.url), 'utf8')
const good = new Function('X', 'SAVED', 'return ' + src.slice(src.indexOf('const good = [') + 13, src.indexOf('\n]\n') + 2))(X, SAVED)

const base = rows[0]
const odd = (id, request, response, metadata) => ({ ...base, id, data: { ...base.data, request: { ...base.data.request, ...request }, response: { ...base.data.response, ...response } }, metadata: { ...base.metadata, ...metadata } })
const hdr = (v) => ({ headerParams: { ...base.data.request.headerParams, 'x-envoy-external-address': v } })
const adv = [
  odd('adv-quote', { path: "/it's/a\\b?%_", ...hdr('not-an-ip') }, { statusCode: null }, {}),
  odd('adv-types', { port: '443', verb: null, ...hdr('999.1.1.1') }, { statusCode: 500 }, { requestTimestamp: '1', responseTimestamp: '5000' }),
  odd('adv-v6', { ...hdr('2001:db8::1') }, {}, { security: 'true' }),
  odd('adv-badv6', { ...hdr('1:2:3:4:5:6:7:8:9') }, {}, {}),
  odd('adv-mapped', { ...hdr('::ffff:10.0.0.1') }, {}, {}),
  odd('adv-mapped-hex', { ...hdr('::FFFF:c0a8:0101') }, {}, {}),
  odd('adv-obj', { verb: { a: 1 }, ...hdr(null) }, {}, { requestTimestamp: null })
]
const all = [...rows, ...adv]

const extra = [
  `data.request.path CONTAINS "it's"`,
  `data.request.path == "/it's/a\\\\b?%_"`,
  `data.request.path ~ "\\\\\\\\b\\\\?"`,
  `data.request.path NOT CONTAINS "%"`,
  'data.response.statusCode PRESENT',
  'data.response.statusCode ABSENT',
  'data.response.statusCode != "200"',
  'data.response.statusCode >= 500',
  'data.request.port == 443',
  'data.request.port != 443',
  'data.request.port > 400',
  'data.request.verb != "GET"',
  'data.request.verb NONEOF ["GET", "POST"]',
  'NOT data.request.verb ANYONE ["GET"]',
  'metadata.security == true',
  'metadata.security != true',
  'LATENCY > 1000',
  `${X} IP IN_RANGE "2001:db8::/32"`,
  `${X} IP NOT_IN_RANGE ["10.0.0.0/8", "2001:db8::/32"]`,
  `${X} IP IN_RANGE "2001:db8::0-2001:db8::ff"`,
  `${X} == "not-an-ip"`,
  `${X} ABSENT`,
  `data.request.port < ${'9'.repeat(400)}`
]

const q = (s) => "'" + s.replace(/'/g, "''") + "'"
const cases = []
let sql = 'CREATE TEMP TABLE t (id text, data jsonb);\n'
for (const r of all) sql += `INSERT INTO t VALUES (${q(r.id)}, ${q(JSON.stringify({ data: r.data, metadata: r.metadata }))});\n`
for (const text of [...good, ...extra]) {
  const a = parse(text, schema)
  if (a.errors.length) {
    console.log('SKIP (does not parse)', text, a.errors[0].msg)
    continue
  }
  const { where } = toSql(a.ast, schema)
  const want = evaluate(a.ast, all).rows.map((r) => r.id).sort()
  cases.push({ text, where, want })
  sql += `\\echo @@${cases.length - 1}\nSELECT coalesce(string_agg(id, ',' ORDER BY id COLLATE "C"), '') FROM t WHERE ${where || 'TRUE'};\n`
}

const parts = ['a', '1', '.', '*', '+', '?', '|', '(', ')', '(?:', '(?=', '(?<=', '(?<n>', '[', ']', '[^', '-', '^', '$', '{', '}', '{2}', '{1,3}', '{300}', '{100}', '{255}', '(a{99})', '(\\w|[a-z]){90}', ',', '\\', '\\\\', '\\d', '\\w', '\\s', '\\D', '\\b', '\\B', '\\y', '\\1', '\\2', '\\0', '\\x4', '\\x41', '\\u0041', '\\cA', '\\c', '\\e', '\\p{L}', '\\.', '\\]', '[:alpha:]', "'", '%']
let seed = 2024
const rnd = (n) => (seed = (seed * 48271) % 2147483647) % n
const regexes = []
while (regexes.length < 5000) {
  let r = ''
  for (let k = 1 + rnd(7); k > 0; k--) r += parts[rnd(parts.length)]
  try {
    new RegExp(r)
  } catch {
    continue
  }
  if (parse(`data.request.path ~ ${lit(r)}`, schema).errors.length) continue
  sql += `\\echo @@r${regexes.length}\nSELECT 'ok' WHERE '' ~ ${q(r)} OR TRUE;\n`
  regexes.push(r)
}

const ipParts = ['1', '0', '00', '010', '255', '256', '.', ':', '::', 'ffff', 'abc', 'g', '/', '/8', '/08', '/32', '/33', '/128', '-', '1.2.3.4', '::1', '2001:db8::', '1:2:3:4:5:6:7:8', '%eth0']
const ranges = []
for (let n = 0; n < 20000; n++) {
  let r = ''
  for (let k = 1 + rnd(6); k > 0; k--) r += ipParts[rnd(ipParts.length)]
  const a = parse(`${X} IP IN_RANGE ${lit(r)}`, schema)
  if (a.errors.length) continue
  sql += `\\echo @@i${ranges.length}\nSELECT 'ok' FROM t WHERE ${toSql(a.ast, schema).where} OR id = 'tx-1149';\n`
  ranges.push(r)
}

const out = execFileSync(process.env.PSQL || 'psql', ['-X', '-At', '-v', 'ON_ERROR_STOP=0'], { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
const got = {}
let cur = null
for (const line of out.split('\n')) {
  const m = line.match(/^@@([ri]?\d+)$/)
  if (m) cur = m[1]
  else if (cur !== null && got[cur] === undefined) got[cur] = line
}
let bad = 0
cases.forEach((c, i) => {
  const ids = got[i] ? got[i].split(',').sort() : []
  const want = [...c.want].sort()
  if (got[i] === undefined || ids.join() !== want.join()) {
    bad++
    const extraIds = ids.filter((x) => !want.includes(x))
    const missing = want.filter((x) => !ids.includes(x))
    console.log('FAIL', format(parse(c.text, schema).ast), '\n  sql:', c.where, '\n  sql only:', extraIds.slice(0, 5), 'js only:', missing.slice(0, 5), got[i] === undefined ? '(query errored)' : '')
  }
})
regexes.forEach((r, i) => {
  if (got['r' + i] !== 'ok') {
    bad++
    console.log('FAIL the box accepts this regex but Postgres rejects it:', r)
  }
})
ranges.forEach((r, i) => {
  if (got['i' + i] !== 'ok') {
    bad++
    console.log('FAIL the box accepts this IP range but Postgres rejects it:', r)
  }
})
console.log(bad ? `${bad} failed` : 'all passed', `(${cases.length} queries on ${all.length} rows, ${regexes.length} regexes and ${ranges.length} IP ranges the box accepts)`)
process.exit(bad ? 1 : 0)
