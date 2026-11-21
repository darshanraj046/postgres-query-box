import { buildSchema, parse, format, evaluate, context, toTree, fromTree, tokenize, lit, opsFor, BUILD_OPS, LAT_FIELD } from '../src/core/engine.js'
import { makeRows, SAVED } from './rows.js'

const rows = makeRows()
const schema = buildSchema(rows)
const X = 'data.request.headerParams.x-envoy-external-address'
let bad = 0
const fail = (...a) => {
  bad++
  console.log('FAIL', ...a)
}

const good = [
  'data.request.path == "/api/v1/devices/agents/8/telemetry" AND data.response.statusCode == "201"',
  'data.request.verb == "GET"',
  'data.request.verb = "GET"',
  'data.response.statusCode != "200"',
  'data.request.path ~ "^/api/v1/devices/agents/[0-9]+/telemetry$"',
  'data.request.path ~* "^/API/V1/DEVICES"',
  'data.request.path !~ "/health$"',
  'data.request.port < 1024',
  'data.request.port <= 5000',
  'data.response.statusCode > 399',
  'data.response.statusCode >= 500',
  'data.request.path CONTAINS "devices"',
  'data.request.headerParams.user-agent NOT CONTAINS "node"',
  'data.request.headerParams.x-apikey PRESENT',
  'data.request.headerParams.x-apikey ABSENT',
  'data.request.port BETWEEN 1024 AND 9000',
  'data.request.port BETWEEN 443 AND 8443',
  'data.request.verb ANYONE ["POST", "PUT"]',
  'data.request.verb NONEOF ["GET", "HEAD"]',
  'data.request.verb ANYONE ["POST", "PUT", "DELETE"]',
  '(metadata.responseTimestamp - metadata.requestTimestamp) > 2000',
  '(metadata.responseTimestamp - metadata.requestTimestamp) < 100',
  'LATENCY >= 1000',
  '(metadata.responseTimestamp - metadata.requestTimestamp) <= 500',
  'metadata.security == true',
  'metadata.additionalMetadata.service.category == "MICROSERVICE" AND metadata.additionalMetadata.host.ip IP IN_RANGE "10.10.0.0/16"',
  'metadata.additionalMetadata.service\\.name == "checkout-app"',
  'metadata.monetization.enabled == false AND metadata.additionalMetadata.host\\.ip IP IN_RANGE "10.10.0.0/16"',
  `COUNT() > 50 WITHIN 5m GROUP BY ${X}`,
  `${X} IP IN_RANGE "10.0.0.0/8"`,
  `${X} IP NOT_IN_RANGE ["10.0.0.0/8", "192.168.0.0/16"]`,
  `${X} IP IN_RANGE "10.0.0.1-10.200.0.50"`,
  'NOT (data.request.verb == "GET" OR data.request.verb == "HEAD")',
  '((metadata.responseTimestamp - metadata.requestTimestamp) > 2000 OR data.response.statusCode >= 500)\nAND (data.request.headerParams.x-apikey PRESENT OR data.request.headerParams.cookie PRESENT)\nAND data.response.statusCode NONEOF ["401", "403"]\nAND data.request.path NOT CONTAINS "/public"',
  'data.response.statusCode BETWEEN 400 AND 499 AND data.response.statusCode NONEOF ["401", "404"] AND data.request.verb != "GET"',
  `data.request.port > 8000 AND (${X} IP IN_RANGE "203.0.113.0/24" OR (metadata.responseTimestamp - metadata.requestTimestamp) > 5000)`,
  `(data.request.verb == "DELETE" OR (data.request.verb == "POST" AND data.request.path ~ "/holds$")) AND ${X} IP NOT_IN_RANGE ["10.0.0.0/8", "192.168.0.0/16"] AND (metadata.responseTimestamp - metadata.requestTimestamp) > 1500 AND COUNT() >= 10 WITHIN 15m GROUP BY ${X}`,
  `(data.request.verb == "POST" OR data.request.verb ANYONE ["PUT", "PATCH", "DELETE"])
AND data.request.verb NONEOF ["GET", "HEAD", "OPTIONS"]
AND data.request.path ~ "^/api/v1/devices/.*"
AND data.request.path !~* "/(health|ping|ready)$"
AND data.request.hostname CONTAINS "dev-api"
AND data.request.headerParams.user-agent NOT CONTAINS "healthcheck"
AND data.response.statusCode != "404"
AND data.response.statusCode >= 500
AND data.response.statusCode < 600
AND data.request.port BETWEEN 1024 AND 9000
AND data.request.port > 1024
AND data.request.port <= 8443
AND data.request.headerParams.x-apikey PRESENT
AND data.request.headerParams.jsessionid ABSENT
AND ((metadata.responseTimestamp - metadata.requestTimestamp) > 2000 AND (metadata.responseTimestamp - metadata.requestTimestamp) <= 30000)
AND NOT ((metadata.responseTimestamp - metadata.requestTimestamp) < 100 OR (metadata.responseTimestamp - metadata.requestTimestamp) >= 60000)
AND (${X} IP IN_RANGE "203.0.113.0/24"
  OR ${X} IP NOT_IN_RANGE "10.0.0.0/8")
AND COUNT() > 50 WITHIN 5m GROUP BY ${X}`,
  ...SAVED.map((s) => s.query)
]

for (const q of good) {
  const a = parse(q, schema)
  if (a.errors.length) {
    fail(q, a.errors)
    continue
  }
  const f1 = format(a.ast)
  const b = parse(f1, schema)
  const f2 = format(b.ast)
  if (f1 !== f2 || b.errors.length) fail('unstable', q, f1, f2)
  const r = evaluate(a.ast, rows)
  console.log(String(r.rows.length).padStart(5), r.count ? `groups ${r.count.groups.length}/${r.count.buckets}` : '', '|', format(a.ast, (p) => (p === '@latency' ? 'latency' : schema.short[p] || p)).replace(/\n/g, ' '))
}

const neg = [
  ['data.response.statusCode == 200', 'stored as text', '"200"'],
  ['data.request.port == "443"', 'stored as a number', '443'],
  ['metadata.security == "true"', 'boolean', 'true'],
  ['data.request.verb > 5', 'needs a number field'],
  ['data.request.path IP IN_RANGE "10.0.0.0/8"', 'IP operators work only'],
  [`${X} IP IN_RANGE "10.0.0.0/33"`, 'not a valid CIDR'],
  [`${X} IP IN_RANGE "10.0.0.9-10.0.0.1"`, 'not a valid CIDR'],
  [`${X} IP IN_RANGE "1:2:3:4:5:6:7:8::1"`, 'not a valid CIDR'],
  [`${X} IP IN_RANGE "10.0.0.0/08"`, 'not a valid CIDR'],
  [`${X} IP IN_RANGE "::/0/0"`, 'not a valid CIDR'],
  [`${X} IP IN_RANGE "10.0.0.1-10.0.0.2-10.0.0.3"`, 'not a valid CIDR'],
  [`${X} IP IN_RANGE "::01.2.3.4"`, 'not a valid CIDR'],
  ['LATENCY == 5', 'Latency takes'],
  ['COUNT() > 5 AND data.request.verb == "GET"', 'goes last'],
  ['data.request.verb == "GET" AND COUNT() > 5 AND COUNT() > 2', 'Only one'],
  ['data.request.verb == "GET" OR COUNT() > 5', 'goes last'],
  ['COUNT() > 5 WITHIN 5', 'Add a unit'],
  ['data.request.path ~ "("', 'Invalid regex'],
  [String.raw`data.request.path ~ "\\bapi\\B"`, 'reads \\b as a backspace', String.raw`"\yapi\Y"`],
  [String.raw`data.request.path ~ "(?<v>\\d+)"`, 'named groups'],
  [String.raw`data.request.path ~ "\\p{L}"`, 'does not understand \\p'],
  [String.raw`data.request.path ~ "[^]"`, 'empty brackets'],
  [String.raw`data.request.path ~ "[a-\\d]"`, 'cannot start or end with \\d'],
  [String.raw`data.request.path ~ "(a)\\2"`, 'needs group 2 to be closed'],
  [String.raw`data.request.path ~ "a{300}"`, 'at most 255'],
  [String.raw`data.request.path ~ "\\x4"`, 'two hex digits'],
  [String.raw`data.request.path ~ "\\u004"`, 'four hex digits'],
  ['data.request.path == "a\0b"', 'NUL character'],
  ['data.request.verbs == "GET"', 'not a field'],
  ['data.request.verb == "GET" data.request.path == "/x"', 'Join conditions'],
  ['(data.request.verb == "GET"', 'Close the group'],
  ['data.request.verb == "GET")', 'no matching'],
  ['data.request.verb == "GET', 'Close the quote'],
  ['data.request.verb ==', 'Add a value'],
  ['data.request.port BETWEEN 9 AND 1', 'smaller'],
  ['data.request.verb ANYONE []', 'at least one'],
  ['data.request.path CONTAINS 5', 'takes text'],
  ['data.response.statusCode >= "500"', 'bare number', '500'],
  ['(metadata.requestTimestamp - metadata.responseTimestamp) > 5', 'Latency is written']
]
for (const [q, want, fixText] of neg) {
  const a = parse(q, schema)
  const hit = a.errors.find((e) => e.msg.includes(want))
  if (!hit) fail('neg', q, want, a.errors.map((e) => e.msg))
  else if (fixText && hit.fix?.text !== fixText) fail('fix', q, hit.fix)
}
for (const re of [String.raw`\\y(v1|v2)\\y`, String.raw`[\\d-]+`, String.raw`\\x41`, '(?<=a)b', '[[:alpha:]]', 'a{255}', String.raw`[\\b]`, String.raw`(a)\\1`]) {
  const errs = parse(`data.request.path ~ "${re}"`, schema).errors
  if (errs.length) fail('regex should pass', re, errs.map((e) => e.msg))
}

const sem = [
  ['data.request.queryParams.endTime != "1"', (r) => r.every((x) => x.data.request.queryParams.endTime)],
  ['NOT data.request.queryParams.endTime == "1"', (r) => r.every((x) => x.data.request.queryParams.endTime)],
  ['data.request.queryParams.endTime NONEOF ["1"]', (r) => r.every((x) => x.data.request.queryParams.endTime)],
  ['data.response.statusCode == 200', (r) => r.length === 0],
  ['data.response.statusCode == "401" AND COUNT() > 20 WITHIN 5m GROUP BY ' + X, (r) => r.length >= 21 && r.every((x) => x.data.request.headerParams['x-envoy-external-address'] === '34.217.218.221')]
]
for (const [q, ok] of sem) {
  const a = parse(q, schema)
  const r = evaluate(a.ast, rows).rows
  if (!ok(r)) fail('sem', q, r.length)
}

const ctx = [
  ['', 'fields'],
  ['data.request.path ', 'ops'],
  ['data.request.verb == ', 'values'],
  ['data.request.path == "/api/v1/security/preferences"', 'kw', 'AND'],
  ['data.request.path == "/api/v1/security/preferences" ', 'kw', 'AND'],
  ['data.request.verb ANYONE ["GET"', 'values'],
  ['data.request.path == "/x', null],
  ['data.request.hostname == ', null],
  ['data.response.statusCode >= 5', null],
  ['data.response.statusCode >= 500 ', 'kw', 'AND'],
  ['(data.request.verb == "GET" ', 'kw', ')'],
  ['data.request.verb == "GET" AND ', 'fields'],
  ['data.request.verb == "GET" AND COUNT() ', 'kw', '>'],
  ['data.request.verb == "GET" AND COUNT() > 5 ', 'kw', 'WITHIN'],
  ['data.request.verb == "GET" AND COUNT() > 5 WITHIN ', 'kw', '5m'],
  ['data.request.verb == "GET" AND COUNT() > 5 WITHIN 5m GROUP BY ', 'fields'],
  ['(metadata.responseTimestamp - metadata.requestTimestamp) ', 'ops'],
  [X + ' IP ', 'kw', 'IN_RANGE'],
  ['metadata.security == ', 'values'],
  ['data.response.statusCode == 5', 'values'],
  ['data.request.verb == "GET"', 'kw', '"POST"'],
  ['data.request.verb == "GET" ', 'kw', 'AND'],
  ['data.response.statusCode ANYONE ["200", "201"]', 'kw', '"204"'],
  ['data.response.statusCode == "200', 'values', '"201"'],
  ['service', 'fields', 'metadata.additionalMetadata.service.name'],
  ['metadata.additionalMetadata.host\\.ip ', 'ops']
]
for (const [src, kind, label] of ctx) {
  const c = context(src, src.length, schema)
  const got = c && c.items.length ? c.kind : null
  if (got !== kind) fail('ctx', JSON.stringify(src), 'want', kind, 'got', got)
  else if (label && !c.items.some((i) => i.label === label)) fail('ctx label', JSON.stringify(src), label, c.items.map((i) => i.label))
}

{
  const src = 'data.request.verb == "GET"'
  const c = context(src, src.length, schema)
  const it = c.items.find((i) => i.label === '"POST"')
  const out = src.slice(0, it.from) + it.insert + src.slice(it.to)
  if (out.trim() !== 'data.request.verb ANYONE ["GET", "POST"]') fail('another', out)
  if (c.items.some((i) => i.label === '"GET"')) fail('another shows existing GET')
  const s2 = 'data.response.statusCode == "20"'
  const c2 = context(s2, s2.length - 1, schema)
  const it2 = c2.items.find((i) => i.label === '"201"')
  const o2 = s2.slice(0, c2.from) + it2.insert + s2.slice(c2.to)
  if (o2.trim() !== 'data.response.statusCode == "201"') fail('mid-string replace', o2)
  const s3 = 'data.response.statusCode == "200"'
  const c3 = context(s3, s3.length - 1, schema)
  if (c3.title !== 'Add another value' || c3.items.some((i) => i.label === '"200"')) fail('exact value inside quotes', c3.title)
}
for (const q of good) {
  const a = parse(q, schema)
  const back = fromTree(toTree(a.ast), schema)
  const b = parse(back, schema)
  if (b.errors.length || format(b.ast) !== format(a.ast)) fail('tree round trip', format(a.ast), '=>', back, b.errors.map((e) => e.msg))
}
{
  const t = toTree(parse('data.request.path ~* "/api\\.v1"', schema).ast)
  if (t.items[0].op !== 'CONTAINS' || !t.items[0].ci || t.items[0].values[0] !== '/api.v1') fail('ci contains', JSON.stringify(t.items[0]))
  const out = fromTree(t, schema)
  if (format(parse(out, schema).ast) !== 'data.request.path ~* "/api\\.v1"') fail('ci contains out', out)
}
for (const [src, at, pick, want] of [
  ['data.request.path ~ "/api"', 19, '~', 'data.request.path ~ "/api"'],
  ['data.response.statusCode > 500', 26, '>=', 'data.response.statusCode >= 500'],
  ['data.request.path ~', 19, '~', 'data.request.path ~ ""']
]) {
  const c = context(src, at, schema)
  const it = c?.items.find((i) => i.label === pick)
  const out = it && src.slice(0, c.from) + it.insert + src.slice(c.to)
  if (out !== want) fail('operator swap', src, pick, out)
}
let checks = 0
const expect = (ok, ...why) => {
  checks++
  if (!ok) fail(...why)
}
const ctxAt = (src, caret = src.length) => context(src, caret, schema)
const labels = (c) => (c ? c.items.map((i) => i.label) : [])
const subOf = (c, label) => c?.items.find((i) => i.label === label)?.sub
const LAT = '(metadata.responseTimestamp - metadata.requestTimestamp)'

for (const v of ['^5\\d\\d$', 'a\\\\b', 'x\\"y', 'end\\', 'q"q', '\\.1$', 'plain', '']) {
  const back = tokenize(lit(v))[0]?.v ?? ''
  expect(back === v, 'lit round trip', JSON.stringify(v), JSON.stringify(lit(v)), JSON.stringify(back))
}
for (const q of ['data.response.statusCode ~ "^5\\d\\d$"', 'data.request.path ~ "/agents/\\d+$"', 'metadata.clientIp ~ "^192\\.168\\."']) {
  const a = parse(q, schema)
  expect(!a.errors.length && format(a.ast) === q, 'regex keeps single backslash', q, format(a.ast ?? {}))
}

{
  const c = ctxAt('')
  expect(subOf(c, 'COUNT()') === 'number of matching calls, e.g. COUNT() > 50 WITHIN 5m', 'COUNT() hint', subOf(c, 'COUNT()'))
  expect(subOf(c, 'NOT') === 'exclude matching calls, e.g. NOT data.request.verb == "GET"', 'NOT hint', subOf(c, 'NOT'))
  expect(subOf(c, '(') === 'start a group', '( hint')
  const j = ctxAt('data.request.verb == "GET" ')
  expect(subOf(j, 'AND') === 'both must match, e.g. AND data.response.statusCode >= 500', 'AND hint', subOf(j, 'AND'))
  expect(subOf(j, 'OR') === 'either can match, e.g. OR data.request.verb == "PUT"', 'OR hint')
  expect(subOf(j, 'AND NOT') === 'exclude matching calls, e.g. AND NOT data.request.path CONTAINS "/health"', 'AND NOT hint')
  expect(subOf(j, 'AND COUNT()') === 'number of matching calls, e.g. AND COUNT() > 50 WITHIN 5m', 'AND COUNT() hint')
  expect(subOf(ctxAt('(data.request.verb == "GET" '), ')') === 'close the group, e.g. (A OR B) AND C', ') hint')
  expect(!JSON.stringify([c, j]).includes('goes last') && !JSON.stringify(c).includes('what follows'), 'old hint wording gone')
}

{
  const order = BUILD_OPS.flatMap(([g, list]) => list.flatMap((o) => (o === '~' || o === '!~' ? [o, o + '*'] : [o])).map((o) => [o, g]))
  const want = {
    'data.response.statusCode': ['Equality', 'Compare', 'Text', 'Existence'],
    'data.request.path': ['Equality', 'Text', 'Existence'],
    'metadata.clientIp': ['Equality', 'Text', 'Existence', 'Network'],
    'data.request.port': ['Equality', 'Compare', 'Existence'],
    'metadata.security': ['Equality', 'Existence'],
    [LAT]: ['Compare']
  }
  for (const [f, groups] of Object.entries(want)) {
    const c = ctxAt(f + ' ')
    expect(c?.title === 'Operators', 'ops title', f, c?.title)
    const got = [...new Set(c.items.map((i) => i.group))]
    expect(JSON.stringify(got) === JSON.stringify(groups), 'ops groups', f, got)
    const idx = c.items.map((i) => order.findIndex(([o]) => o === i.label))
    expect(idx.every((x, k) => x >= 0 && (k === 0 || x > idx[k - 1])), 'ops universal order', f, labels(c))
    const allowed = opsFor(f === LAT ? LAT_FIELD : schema.byPath[f])
    expect(c.items.length === allowed.length, 'ops count matches opsFor', f, labels(c), allowed)
  }
  const p = ctxAt('data.request.path ')
  const text = p.items.filter((i) => i.group === 'Text').map((i) => i.label)
  expect(JSON.stringify(text) === JSON.stringify(['CONTAINS', 'NOT CONTAINS', '~', '~*', '!~', '!~*']), 'text ops together', text)
  const s = ctxAt('data.response.statusCode ')
  for (const o of ['BETWEEN', '<', '<=', '>', '>=', '~', '!~', 'PRESENT']) expect(s.items.find((i) => i.label === o)?.reopen === true, 'reopen after picking', o)
}

{
  const c = ctxAt('data.response.statusCode ~ ""', 28)
  expect(c?.title === 'Example patterns · data.response.statusCode' && labels(c).includes('"^5\\d\\d$"'), 'statusCode regex examples', c?.title, labels(c))
  const v = ctxAt('data.request.verb !~* ""', 23)
  expect(v?.title === 'Example patterns · data.request.verb' && labels(v).includes('"^(GET|HEAD)$"'), 'verb regex examples', v?.title)
  const n = ctxAt('data.response.statusCode ~ "^5"', 30)
  expect(labels(n).length === 1, 'examples narrow while typing', labels(n))
  for (const [f, src] of [['path', 'data.request.path ~ ""'], ['ip', 'metadata.clientIp ~* ""'], ['port', 'data.request.port !~ ""'], ['text', 'metadata.traceId !~* ""']]) {
    const c2 = ctxAt(src, src.length - 1)
    expect(c2?.title?.startsWith('Regex syntax'), 'regex syntax card', f, c2?.title)
    expect(labels(c2).join(' ') === '^ $ . \\d \\w \\s [abc] [^abc] a|b (ab) * + ? {3} \\.', 'regex syntax rows', f, labels(c2))
    expect(c2.items.every((i) => i.from === src.length - 1 && i.to === src.length - 1), 'syntax inserts at caret', f)
  }
  const mid = 'data.request.path ~ "^/x"'
  const c3 = ctxAt(mid, mid.length - 1)
  const br = c3.items.find((i) => i.label === '[abc]')
  expect(br.insert === '[]' && br.caretAt === 1, 'bracket caret inside', br)
  const out = mid.slice(0, br.from) + br.insert + mid.slice(br.to)
  expect(out === 'data.request.path ~ "^/x[]"', 'syntax insert result', out)
}

{
  const sc = {
    '<': [['200', '1XX only'], ['300', '1XX and 2XX'], ['400', '1XX to 3XX'], ['500', '1XX to 4XX']],
    '<=': [['199', '1XX only'], ['299', '1XX and 2XX'], ['399', '1XX to 3XX'], ['499', '1XX to 4XX']],
    '>': [['199', '2XX to 5XX'], ['299', '3XX to 5XX'], ['399', '4XX and 5XX'], ['499', '5XX only']],
    '>=': [['200', '2XX to 5XX'], ['300', '3XX to 5XX'], ['400', '4XX and 5XX'], ['500', '5XX only']]
  }
  const port = {
    '<': [['1024', 'well-known ports only'], ['49152', 'well-known and registered ports']],
    '<=': [['1023', 'well-known ports only'], ['49151', 'well-known and registered ports']],
    '>': [['1023', 'registered and dynamic ports'], ['49151', 'dynamic ports only']],
    '>=': [['1024', 'registered and dynamic ports'], ['49152', 'dynamic ports only']]
  }
  for (const [field, table] of [['data.response.statusCode', sc], ['data.request.port', port]]) {
    for (const [op, rowsWant] of Object.entries(table)) {
      const c = ctxAt(`${field} ${op} `)
      const got = c?.items.map((i) => [i.label, i.sub])
      expect(c?.title === `Example thresholds · ${field}` && JSON.stringify(got) === JSON.stringify(rowsWant), 'thresholds', field, op, got)
      for (const [t] of rowsWant) {
        const q = `${field} ${op} ${t}`
        const a = parse(q, schema)
        expect(!a.errors.length, 'threshold query valid', q, a.errors)
      }
    }
    expect(!ctxAt(`${field} >= 4`)?.items.length, 'thresholds hide after a digit', field)
  }
  const lt = ctxAt(LAT + ' > ')
  expect(lt?.title === 'Example thresholds · latency in ms' && labels(lt)[0] === '100', 'latency thresholds', lt?.title)
  const lb = ctxAt(LAT + ' BETWEEN ')
  expect(lb?.title === 'Example ranges · latency in ms' && JSON.stringify(labels(lb)) === JSON.stringify(['0 AND 100', '100 AND 500', '500 AND 1000', '1000 AND 5000', '5000 AND 10000']), 'latency ranges', labels(lb))
  expect(labels(ctxAt('data.response.statusCode BETWEEN ')).length === 5, 'statusCode BETWEEN ranges')
  expect(labels(ctxAt('data.request.port BETWEEN ')).length === 4, 'port BETWEEN ranges')
  for (const [lo, hi] of [[0, 100], [100, 500], [1000, 5000]]) {
    const a = parse(`${LAT} BETWEEN ${lo} AND ${hi}`, schema)
    const r = evaluate(a.ast, rows).rows
    expect(!a.errors.length && r.every((x) => x.metadata.responseTimestamp - x.metadata.requestTimestamp >= lo && x.metadata.responseTimestamp - x.metadata.requestTimestamp <= hi), 'latency BETWEEN evaluates', lo, hi, a.errors)
    const back = fromTree(toTree(a.ast), schema)
    expect(format(parse(back, schema).ast) === format(a.ast), 'latency BETWEEN tree round trip', back)
  }
  expect(parse('LATENCY == 5', schema).errors[0]?.msg === 'Latency takes >, <, >=, <= or BETWEEN', 'latency op message')
}

{
  const one = parse('cdscdscsd', schema).errors
  expect(one.length === 1 && one[0].msg === 'cdscdscsd is not a field in this index', 'unknown field single error', one.map((e) => e.msg))
  const fixed = (q, e) => {
    const f = [].concat(e.fix)[0]
    return q.slice(0, f.s) + f.text + q.slice(f.e)
  }
  for (const q of ['data.request.verb == POST', 'data.request.verb ANYONE [PUT, "PATCH"]', 'data.request.path CONTAINS devices', 'data.request.verb != GET AND data.response.statusCode >= 500']) {
    const e = parse(q, schema).errors[0]
    expect(e?.msg.startsWith('Expected a value') && [].concat(e.fix || [])[0]?.verb === 'Use', 'bare word fix offered', q, e)
    if (e?.fix) expect(!parse(fixed(q, e), schema).errors.length, 'bare word fix valid', fixed(q, e))
  }
  expect(!parse('data.request.verb == AND', schema).errors[0]?.fix, 'keyword in value spot gets no quote fix')
  const fx = (q) => [].concat(parse(q, schema).errors[0]?.fix || []).map((f) => f.label)
  expect(JSON.stringify(fx('metadata.security == abc')) === '["true","false"]', 'boolean bare word offers true/false', fx('metadata.security == abc'))
  expect(!fx('data.request.port == abc').length && !fx('data.request.port BETWEEN abc AND 5').length, 'number bare word gets no quote fix')
  expect(fx('data.request.port BETWEEN 9 AND 1')[0] === '1 AND 9', 'BETWEEN swap fix')
  expect(fx('data.request.port BETWEEN 1 5')[0] === 'AND', 'BETWEEN add AND fix')
  expect(fx('data.request.verb ANYONE "GET", "PUT"]')[0] === '[', 'add [ fix')
  expect(parse('data.request.port ANYONE 1', schema).errors[0]?.msg === 'Expected a list like [1, 2]', 'list example follows type')
  expect(fx('data.response.statusCode ~* "^5"')[0] === '~' && fx('data.response.statusCode !~* "^5"')[0] === '!~', 'case-insensitive regex on status code offers ~')
  expect(JSON.stringify(fx('data.request.verb == "GET" AND COUNT() > 5 WITHIN 5')) === '["5s","5m","5h","5d"]', 'WITHIN unit fixes')
  expect(fx('data.request.verb == "GET" AND COUNT() 5')[0] === '>', 'COUNT add operator fix')
  const lq = 'data.request.verb ANYONE ["POST, "PUT"]'
  const le = parse(lq, schema).errors[0]
  expect(le?.msg === 'Missing " after POST' && !parse(fixed(lq, le), schema).errors.length, 'missing quote inside a list', le?.msg)
  for (const q of ['metadata.security == abc', 'data.request.port BETWEEN 9 AND 1', 'data.request.port BETWEEN 1 5', 'data.request.verb ANYONE "GET", "PUT"]', 'data.response.statusCode ~* "^5"', 'data.request.verb == "GET" AND COUNT() > 5 WITHIN 5', 'data.request.verb == "GET" AND COUNT() 5']) {
    const e = parse(q, schema).errors[0]
    expect(!parse(fixed(q, e), schema).errors.length, 'new fix makes query valid', q, fixed(q, e))
  }
  for (const q of [
    '(data.request.verb == "POST OR data.request.verb ANYONE ["PUT", "PATCH"])\nAND data.response.statusCode >= 500',
    'data.request.verb == "POST OR data.request.verb == "GET"',
    'data.request.path CONTAINS "/api OR data.request.verb == "GET"'
  ]) {
    const e = parse(q, schema).errors[0]
    expect(/^Missing " after /.test(e?.msg ?? ''), 'missing quote detected', JSON.stringify(q), e?.msg)
    if (e?.fix) expect(!parse(fixed(q, e), schema).errors.length, 'missing quote fix valid', fixed(q, e), parse(fixed(q, e), schema).errors.map((x) => x.msg))
  }
  expect(!/^Missing "/.test(parse('data.request.path CONTAINS "a b"x', schema).errors[0]?.msg ?? ''), 'plain spaced value not flagged as missing quote')
  expect(!parse('data.response.responseBody CONTAINS "Invalid Session Token"', schema).errors.length, 'spaced value valid')
  const g = parse('(data.request.verb == "GET"', schema).errors[0]
  expect(g.msg.includes('Close the group') && [].concat(g.fix).some((f) => f.text === ')'), 'unclosed group fix')
  const lat = parse('(metadata.responseTimestamp - metadata.requestTimestamp > 2000', schema).errors[0]
  expect(lat?.msg === 'Missing ) after metadata.requestTimestamp' && !parse(fixed('(metadata.responseTimestamp - metadata.requestTimestamp > 2000', lat), schema).errors.length, 'half latency fix', lat?.msg)
}

{
  const c = ctxAt('data.request.verb == "POST" ')
  expect(c?.title === 'Combine' && c.items[0]?.group === 'Add another value', 'combine card first group', c?.title, c?.items[0]?.group)
  expect(!labels(c).includes('"POST"'), 'combine hides existing value')
}
console.log(bad ? `${bad} failed` : 'all passed', `(${good.length} queries, ${neg.length} errors, ${sem.length} semantics, ${ctx.length} suggestion states, ${checks} checks for suggestions, hints, thresholds and fixes)`)
process.exit(bad ? 1 : 0)
