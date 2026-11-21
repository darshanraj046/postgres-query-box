import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'

const root = fileURLToPath(new URL('..', import.meta.url))
const cssPath = process.argv[2] || root + 'scripts/tailwind.css'
const srcDir = root + 'src'
const outPath = root + 'src/styles.css'
const css = readFileSync(cssPath, 'utf8').replace(/mds-/g, 'base-')

function parse(text) {
  const out = []
  let i = 0
  const n = text.length
  const skipWs = () => {
    while (i < n) {
      if (/\s/.test(text[i])) i++
      else if (text.startsWith('/*', i)) i = text.indexOf('*/', i + 2) + 2
      else break
    }
  }
  const block = () => {
    let depth = 0
    const start = i
    for (; i < n; i++) {
      const c = text[i]
      if (c === '\\') {
        i++
        continue
      }
      if (c === '"' || c === "'") {
        const q = c
        for (i++; i < n && text[i] !== q; i++) if (text[i] === '\\') i++
      } else if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) {
          i++
          return text.slice(start + 1, i - 1)
        }
      }
    }
    throw new Error('unbalanced')
  }
  while (true) {
    skipWs()
    if (i >= n) break
    let start = i
    while (i < n && text[i] !== '{' && text[i] !== ';') {
      if (text[i] === '"' || text[i] === "'") {
        const q = text[i]
        for (i++; i < n && text[i] !== q; i++) if (text[i] === '\\') i++
      }
      if (text[i] === '\\') i++
      i++
    }
    const prelude = text.slice(start, i).trim()
    if (text[i] === ';') {
      i++
      out.push({ kind: 'stmt', prelude })
      continue
    }
    const body = block()
    if (prelude.startsWith('@') && /^@(layer|media|supports)/.test(prelude)) out.push({ kind: 'group', prelude, children: parse(body) })
    else out.push({ kind: prelude.startsWith('@') ? 'at' : 'rule', prelude, body })
  }
  return out
}

const tree = parse(css)
const esc = (t) => t.replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c)
const files = readdirSync(srcDir, { recursive: true }).filter((f) => /\.(jsx|js)$/.test(f))
const src = files.map((f) => readFileSync(srcDir + '/' + f, 'utf8')).join('\n')
const cands = new Set(src.split(/[\s'"`{}$]+/).filter((t) => t && t.length < 80))
const used = new Set()
const classRe = (t) => new RegExp('\\.' + esc(t).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&') + '(?![a-zA-Z0-9_\\\\-])')
const flat = []
const walk = (nodes, wrap) => {
  for (const nd of nodes) {
    if (nd.kind === 'group') walk(nd.children, [...wrap, nd.prelude])
    else if (nd.kind === 'rule') flat.push({ ...nd, wrap })
  }
}
walk(tree, [])
const utilRules = flat.filter((r) => !r.wrap.some((w) => w.startsWith('@layer')) || r.wrap.some((w) => w.startsWith('@layer utilities') || w.startsWith('@layer components')))
for (const t of cands) {
  const re = classRe(t)
  if (utilRules.some((r) => re.test(r.prelude) || re.test(r.body))) used.add(t)
}
const keep = utilRules.filter((r) => [...used].some((t) => classRe(t).test(r.prelude)))
const scope = (sel) =>
  sel
    .split(/,(?![^(]*\))/)
    .map((s) => `.pqb ${s.trim()}`)
    .join(',')
const out = []
const theme = flat.filter((r) => r.wrap.some((w) => w.startsWith('@layer theme')))
const tokens = {}
for (const r of theme) for (const m of r.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) tokens[m[1]] = m[2].trim()
const props = flat.filter((r) => r.wrap.some((w) => w.startsWith('@layer properties')))
const propVars = {}
for (const r of props) for (const m of r.body.matchAll(/(--tw-[\w-]+)\s*:\s*([^;]+);?/g)) propVars[m[1]] = m[2].trim()
const body = keep.map((r) => {
  const rule = `${scope(r.prelude)}{${r.body}}`
  const media = r.wrap.filter((w) => w.startsWith('@media') || w.startsWith('@supports'))
  return media.reduceRight((acc, w) => `${w}{${acc}}`, rule)
})
const needed = new Set()
const addVars = (s) => {
  for (const m of s.matchAll(/var\((--[\w-]+)/g)) {
    if (needed.has(m[1])) continue
    needed.add(m[1])
    if (tokens[m[1]]) addVars(tokens[m[1]])
  }
}
body.forEach(addVars)
addVars(src)
addVars('var(--font-sans) var(--font-mono) var(--default-font-family) var(--default-mono-font-family)')
const vars = [...needed].filter((v) => tokens[v]).map((v) => `${v}:${tokens[v]}`)
const twv = Object.entries(propVars).map(([k, v]) => `${k}:${v}`)
out.push(`.pqb{${vars.join(';')}}`)
out.push(`.pqb,.pqb *,.pqb ::before,.pqb ::after{${twv.join(';')}}`)
out.push(
  `.pqb,.pqb *,.pqb ::before,.pqb ::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}`,
  `.pqb{font-family:var(--font-sans);font-size:16px;line-height:1.5;color:var(--color-text-default-regular,#202124);-webkit-font-smoothing:antialiased;font-variant-ligatures:none;font-feature-settings:'liga' 0,'calt' 0}`,
  `.pqb button,.pqb input,.pqb textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;background-color:transparent;border-radius:0;opacity:1}`,
  `.pqb button{cursor:pointer}`,
  `.pqb button:disabled{cursor:default}`,
  `.pqb input::placeholder,.pqb textarea::placeholder{opacity:1}`,
  `.pqb ul{list-style:none}`,
  `.pqb kbd,.pqb pre{font-family:var(--font-mono);font-size:1em}`,
  `.pqb svg{display:block;vertical-align:middle}`,
  `.pqb :focus-visible{outline:none}`
)
out.push(...body)
const result = out.join('\n')
writeFileSync(outPath, result + '\n')
console.log('used classes', used.size, 'rules', keep.length, 'vars', vars.length, 'bytes', result.length)
const missing = [...cands].filter((t) => /^(?:[a-z]+:)*-?(?:text|bg|border|flex|grid|h|w|p[xytblr]?|m[xytblr]?|gap|rounded|font|items|justify|shrink|truncate|min|max|top|left|right|bottom|z|shadow|overflow|whitespace|cursor|outline|place|inline|block|hidden|invisible|relative|absolute|sticky|underline|decoration|leading|tracking|opacity|ring|self|basis|scroll|no-scrollbar)(?:-|$)/.test(t) && !used.has(t))
console.log('looks like class but not in css:', missing.join(' '))
