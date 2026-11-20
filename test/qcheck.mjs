import { buildSchema, parse, format, evaluate, context, toTree, fromTree } from '../src/core/engine.js'
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
  ['LATENCY == 5', 'Latency takes'],
  ['COUNT() > 5 AND data.request.verb == "GET"', 'goes last'],
  ['data.request.verb == "GET" AND COUNT() > 5 AND COUNT() > 2', 'Only one'],
  ['data.request.verb == "GET" OR COUNT() > 5', 'goes last'],
  ['COUNT() > 5 WITHIN 5', 'Add a unit'],
  ['data.request.path ~ "("', 'Invalid regex'],
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
  if (format(parse(out, schema).ast) !== 'data.request.path ~* "/api\\\\.v1"') fail('ci contains out', out)
}
console.log(bad ? `${bad} failed` : 'all passed', `(${good.length} queries, ${neg.length} errors, ${sem.length} semantics, ${ctx.length} suggestion states)`)
process.exit(bad ? 1 : 0)
