export const VERB = { GET: '#147af3', POST: '#2fb880', PUT: '#b07500', PATCH: '#9d57f4', DELETE: '#ea3829', OPTIONS: '#626978', HEAD: '#626978', TRACE: '#626978', CONNECT: '#626978', QUERY: '#626978' }
const TONE = { 1: ['#147af3', '#e0f2ff'], 2: ['#00653e', '#cef8e0'], 3: ['#4046ca', '#d3d5ff'], 4: ['#b40000', '#ffcdc3'], 5: ['#cb5d00', '#ffeccc'] }
export const valueStyle = (v, field) => {
  const s = String(v)
  if ((!field || field === 'data.request.verb') && VERB[s]) return { color: VERB[s], fontWeight: 600 }
  const t = (!field || field === 'data.response.statusCode') && /^\d{3}$/.test(s) && TONE[s[0]]
  return t ? { color: t[0], background: t[1], boxShadow: 'inset 0 0 0 1px #cdd2dd', borderRadius: 2 } : null
}
