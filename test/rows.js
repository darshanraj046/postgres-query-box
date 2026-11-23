let seed = 20261120
const rnd = () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (a) => a[Math.floor(rnd() * a.length)]
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [v, w] of pairs) if ((r -= w) <= 0) return v
  return pairs[0][0]
}

const ROUTES = [
  ['GET', '/api/v1/metrics/messaging', 14, 1800],
  ['GET', '/api/v1/metrics/network', 12, 2200],
  ['GET', '/api/v1/metrics/application', 10, 1900],
  ['GET', '/api/v1/metrics/system', 8, 2600],
  ['GET', '/api/v1/metrics/database', 8, 1500],
  ['GET', '/api/v1/metrics/dashboard/overview', 8, 2400],
  ['GET', '/api/v1/reports/queries', 6, 160],
  ['GET', '/api/v1/security/preferences', 6, 90],
  ['PUT', '/api/v1/security/preferences', 2, 140],
  ['GET', '/api/v1/devices/agents', 6, 120],
  ['POST', '/api/v1/devices/agents/{n}/telemetry', 12, 60],
  ['PATCH', '/api/v1/devices/agents/{n}', 2, 110],
  ['DELETE', '/api/v1/devices/agents/{n}', 1, 95],
  ['POST', '/api/v1/accounts/{n}/holds', 2, 300],
  ['PATCH', '/api/v1/accounts/{n}/holds', 1, 260],
  ['GET', '/public/status', 3, 20],
  ['GET', '/health', 5, 8],
  ['HEAD', '/ping', 2, 5],
  ['OPTIONS', '/api/v1/metrics/network', 1, 6],
  ['GET', '/ready', 2, 6]
]

const HOSTS = [
  ['dev-api.example.com', 6],
  ['stage-api.example.com', 3],
  ['gateway.example.com', 1]
]

const DEVICESS = [
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0', 5],
  ['node-fetch/1.0', 2],
  ['kube-probe/1.29 healthcheck', 2],
  ['curl/8.4.0', 1],
  ['okhttp/4.12.0', 1]
]

const INTERNAL = () => pick([`10.${(rnd() * 255) | 0}.${(rnd() * 255) | 0}.${(rnd() * 254 + 1) | 0}`, `172.16.${(rnd() * 255) | 0}.${(rnd() * 254 + 1) | 0}`, `192.168.1.${(rnd() * 254 + 1) | 0}`])
const EXTERNAL = () => pick([`203.0.113.${(rnd() * 254 + 1) | 0}`, `198.51.100.${(rnd() * 254 + 1) | 0}`, `49.36.${(rnd() * 255) | 0}.${(rnd() * 254 + 1) | 0}`])

const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[(rnd() * 16) | 0]).join('')

export const NOW = Date.UTC(2026, 10, 20, 10, 0, 0)

function statusFor(verb, path) {
  if (path === '/health' || path === '/ping' || path === '/ready' || path === '/public/status') return weighted([['200', 30], ['503', 1]])
  if (verb === 'POST') return weighted([['201', 14], ['200', 6], ['400', 2], ['401', 1], ['409', 1], ['429', 1], ['500', 1], ['502', 1], ['504', 1]])
  if (verb === 'DELETE') return weighted([['204', 6], ['404', 2], ['403', 1], ['500', 1]])
  return weighted([['200', 40], ['304', 2], ['404', 2], ['401', 1], ['403', 1], ['408', 1], ['429', 1], ['500', 2], ['502', 1], ['503', 1], ['504', 1]])
}

const b64 = (n) => Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[(rnd() * 62) | 0]).join('')
const SERVER_IPS = ['10.10.149.234', '10.10.150.12', '10.10.151.87']

function makeRow(i, ts, over = {}) {
  const [verb, tmpl, , base] = over.route || weighted(ROUTES.map((r) => [r, r[2]]))
  const path = tmpl.replace('{n}', String(1 + ((rnd() * 12) | 0)))
  const statusCode = over.statusCode || statusFor(verb, path)
  const probe = path === '/health' || path === '/ping' || path === '/ready'
  const ua = probe ? 'kube-probe/1.29 healthcheck' : weighted(DEVICESS)
  const ip = over.ip || (rnd() < 0.55 ? INTERNAL() : EXTERNAL())
  const host = over.host || weighted(HOSTS)
  const env = host.startsWith('stage') ? 'STAGE' : 'DEV'
  let latency = Math.round(base * (0.35 + rnd() * 1.3))
  if (rnd() < 0.03) latency = Math.round(5000 + rnd() * 30000)
  if (rnd() < 0.004) latency = -Math.round(5 + rnd() * 40)
  const headerParams = { host, accept: 'application/json' }
  if (path.includes('/database')) headerParams.type = 'mssql'
  if (!probe && rnd() < 0.85) headerParams.cookie = `JSESSIONID=node0${b64(26)}.node0; session=${b64(40)}`
  if (!probe && rnd() < 0.8) headerParams['x-apikey'] = b64(120)
  if (ua.startsWith('Mozilla')) {
    headerParams['sec-ch-ua'] = '"Not:A-Brand";v="8", "Chromium";v="131", "Google Chrome";v="131"'
    headerParams['sec-fetch-dest'] = 'empty'
    headerParams['sec-fetch-mode'] = 'cors'
    headerParams['sec-fetch-site'] = 'same-origin'
    headerParams['sec-ch-ua-mobile'] = '?0'
    headerParams['sec-ch-ua-platform'] = '"macOS"'
    headerParams['accept-language'] = 'en-GB,en-US;q=0.9,en;q=0.8'
  }
  if (!probe && rnd() < 0.8) headerParams.jsessionid = hex(24)
  headerParams['user-agent'] = ua
  headerParams.environment = env
  headerParams['x-request-id'] = `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(12)}`
  headerParams['accept-encoding'] = 'gzip, deflate, br, zstd'
  headerParams['x-forwarded-proto'] = 'https'
  headerParams['x-envoy-attempt-count'] = rnd() < 0.95 ? '1' : '2'
  headerParams['x-envoy-external-address'] = ip
  const request = {
    path,
    port: weighted([[443, 8], [8443, 3], [8080, 2], [80, 1], [9090, 1]]),
    verb,
    scheme: 'https',
    hostname: host,
    queryParams: path.includes('/metrics/') ? { endTime: String(ts), startTime: String(ts - 3600000) } : {},
    requestBody: verb === 'GET' || verb === 'HEAD' || verb === 'DELETE' ? '' : JSON.stringify({ id: 1 + ((rnd() * 99) | 0), note: pick(['retry', 'sync', 'update']) }),
    headerParams
  }
  const failed = statusCode >= '400'
  const response = {
    statusCode,
    headerParams: { Vary: 'Origin' },
    responseBody: statusCode === '401' ? '{"error":{"userMessage":"Request Validation Failed. Invalid Session Token","statusCode":"Identity-1032"}}' : failed ? `{"error":{"userMessage":"Request failed","statusCode":"${statusCode}"}}` : '{"status":"ok"}'
  }
  const serverIp = pick(SERVER_IPS)
  return {
    id: 'tx-' + i,
    data: { request, response },
    metadata: {
      hook: weighted([['DEVICES', 4], ['GATEWAY', 1]]),
      spanId: hex(16),
      traceId: hex(32),
      clientIp: ip,
      security: rnd() < 0.7,
      serverIp,
      audited: rnd() < 0.6,
      serverHost: host,
      environment: env,
      monetization: { enabled: rnd() < 0.1 },
      capturePayload: rnd() < 0.9,
      requestTimestamp: ts,
      responseTimestamp: ts + latency,
      additionalMetadata: {
        'host.ip': serverIp,
        'host.name': env === 'DEV' ? 'DEVELOPMENT' : 'STAGING',
        environment: env,
        'service.name': pick(['checkout-app', 'checkout-app', 'devices', 'metrics']),
        'service.type': 'JAVA',
        'service.category': 'MICROSERVICE'
      }
    }
  }
}

export function makeRows() {
  const rows = []
  let i = 0
  for (let k = 0; k < 1400; k++) rows.push(makeRow(i++, NOW - Math.round(rnd() * 24 * 3600 * 1000)))
  const burstStart = NOW - 3 * 3600 * 1000
  for (let k = 0; k < 28; k++) rows.push(makeRow(i++, burstStart + k * 9000, { ip: '34.217.218.221', statusCode: '401', route: ['GET', '/api/v1/metrics/database', 1, 60] }))
  const spikeStart = NOW - 6 * 3600 * 1000
  for (let k = 0; k < 120; k++) rows.push(makeRow(i++, spikeStart + k * 4000, { host: 'dev-api.example.com', statusCode: pick(['500', '502', '503', '504']) }))
  return rows.sort((a, b) => b.metadata.requestTimestamp - a.metadata.requestTimestamp)
}

export const SAVED = [
  { id: 's1', name: 'Server errors', pinned: true, query: 'data.response.statusCode >= 500' },
  { id: 's2', name: 'Slow calls (over 2 s)', pinned: true, query: '(metadata.responseTimestamp - metadata.requestTimestamp) > 2000' },
  { id: 's3', name: 'Security preferences', pinned: true, query: 'data.request.path == "/api/v1/security/preferences"' },
  { id: 's4', name: 'Failed writes on devices, no probes', query: '(data.request.verb == "POST" OR data.request.verb ANYONE ["PUT", "PATCH"])\nAND (data.request.path ~ "^/api/v1/devices/.*" OR data.request.path CONTAINS "/telemetry")\nAND (data.response.statusCode >= 500 OR data.response.statusCode ANYONE ["408", "429"])\nAND NOT (data.request.headerParams.user-agent CONTAINS "healthcheck" OR data.request.path ~ "/(health|ping|ready)$")' },
  { id: 's5', name: 'Unauthorized calls', query: 'data.response.statusCode == "401"' },
  { id: 's6', name: 'External callers writing from outside internal ranges', query: 'metadata.clientIp IP NOT_IN_RANGE ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]\nAND (data.request.verb ANYONE ["POST", "PUT", "DELETE"] OR (data.request.verb == "PATCH" AND data.request.path ~ "/holds$"))' },
  { id: 's7', name: 'No API key but still succeeded', query: 'data.request.headerParams.x-apikey ABSENT\nAND data.response.statusCode BETWEEN 200 AND 299\nAND NOT (data.request.path CONTAINS "/public" OR data.request.path CONTAINS "/health")' },
  { id: 's8', name: 'Slow failures without payload capture', query: 'metadata.capturePayload == false\nAND data.response.statusCode ANYONE ["500", "502", "503", "504"]\nAND (metadata.responseTimestamp - metadata.requestTimestamp) >= 1000' },
  { id: 's9', name: 'Server errors on one host', query: 'data.request.hostname CONTAINS "dev-api"\nAND data.response.statusCode >= 500' },
  { id: 's10', name: 'checkout-app service, invalid session', query: 'metadata.additionalMetadata.service.name == "checkout-app"\nAND data.response.responseBody CONTAINS "Invalid Session Token"' }
]
