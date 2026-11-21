import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Funnel, X, Copy, TreeStructure, TextT, Hash, ToggleLeft, Globe, Timer, Warning } from '@phosphor-icons/react'
import { context, parse, format } from '../core/engine.js'
import Builder from './Builder.jsx'
import { valueStyle } from './colors.js'

const ROLE = { field: 'text-base-blue-1100', op: 'text-text-color-purple', kw: 'font-semibold text-text-color-purple', str: 'text-text-color-success', num: 'text-text-color-cyan', bool: 'text-text-color-orange', fn: 'font-semibold text-text-color-purple', punct: 'text-text-default-subtle' }
const DEFAULT = { kw: ROLE.kw, str: ROLE.str, num: ROLE.num, dur: ROLE.num, bool: ROLE.bool, op: ROLE.op, word: ROLE.field }
const cls = (t) => (t.role === 'op' && t.t === 'op' ? 'text-text-default-subdued' : ROLE[t.role] || DEFAULT[t.t] || '')
const TYPE_ICON = { string: TextT, numtext: TextT, number: Hash, boolean: ToggleLeft, ip: Globe, latency: Timer }
const PAIRS = { '"': '"', ']': ']', ')': ')' }
const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function paint(text, schema, tipFor) {
  const { toks } = parse(text, schema)
  const out = []
  let at = 0
  for (const t of toks) {
    if (t.s > at) out.push(text.slice(at, t.s))
    const tip = tipFor && t.role === 'field' ? tipFor(t.raw) : null
    out.push(
      tip ? (
        <span key={t.s} data-pqb-tip={tip} data-mono="" className={`${cls(t)} underline decoration-dotted`}>
          {t.raw}
        </span>
      ) : (
        <span key={t.s} className={cls(t)}>{t.raw}</span>
      )
    )
    at = t.e
  }
  out.push(text.slice(at))
  return out
}

export function Tips({ root }) {
  const [tip, setTip] = useState(null)
  useEffect(() => {
    let timer
    const over = (e) => {
      const el = e.target.closest?.('[data-pqb-tip]')
      clearTimeout(timer)
      if (!el || !el.dataset.pqbTip || !root.current?.contains(el) || el.getAttribute('aria-expanded') === 'true') return setTip(null)
      if (el.dataset.trunc !== undefined && el.scrollWidth <= el.clientWidth) return setTip(null)
      const r = el.getBoundingClientRect()
      timer = setTimeout(() => setTip({ text: el.dataset.pqbTip, mono: el.dataset.mono !== undefined, side: el.dataset.side, r }), 200)
    }
    const hide = () => {
      clearTimeout(timer)
      setTip(null)
    }
    document.addEventListener('mouseover', over)
    document.addEventListener('mousedown', hide, true)
    document.addEventListener('scroll', hide, true)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mousedown', hide, true)
      document.removeEventListener('scroll', hide, true)
    }
  }, [])
  if (!tip) return null
  const place = (el) => {
    if (!el) return
    const { r } = tip
    const w = el.offsetWidth
    const h = el.offsetHeight
    const a = el.firstChild.style
    if (tip.side === 'right') {
      const top = Math.max(8, r.top + r.height / 2 - h / 2)
      el.style.left = r.right + 8 + 'px'
      el.style.top = top + 'px'
      Object.assign(a, { left: '-4px', top: Math.min(h - 12, Math.max(4, r.top + r.height / 2 - top - 4)) + 'px' })
      return
    }
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2))
    const below = r.bottom + 8 + h < window.innerHeight
    el.style.left = left + 'px'
    el.style.top = (below ? r.bottom + 8 : r.top - h - 8) + 'px'
    Object.assign(a, { left: Math.min(w - 12, Math.max(4, r.left + r.width / 2 - left - 4)) + 'px', top: below ? '-4px' : h - 4 + 'px' })
  }
  return (
    <div ref={place} role="tooltip" style={{ position: 'fixed', zIndex: 100, left: -9999, top: -9999, background: '#000', fontSize: tip.mono ? 11 : 13, lineHeight: tip.mono ? '16px' : '18px' }} className={`pointer-events-none w-max max-w-[520px] whitespace-pre-wrap break-words rounded-md px-2.5 py-1.5 font-medium text-text-default-static shadow-e300 ${tip.mono ? 'font-mono' : ''}`}>
      <span aria-hidden="true" style={{ position: 'absolute', width: 8, height: 8, background: '#000', transform: 'rotate(45deg)' }} />
      {tip.text}
    </div>
  )
}

const closes = (text, pos) => {
  let n = 0
  for (let i = 0; i < pos; i++) {
    if (text[i] === '\\') i++
    else if (text[i] === '"') n++
  }
  return n % 2 === 1
}

export default function QueryBox({ text, setText, schema, onRun, tools, actions, runErrors, setRunErrors, runRef, adv, setAdv, placeholder }) {
  const ta = useRef(null)
  const pre = useRef(null)
  const list = useRef(null)
  const nextCaret = useRef(null)
  const stepped = useRef(null)
  const last = useRef(text)
  last.current = text
  const [caret, setCaret] = useState(0)
  const [focus, setFocus] = useState(false)
  const [open, setOpen] = useState(false)
  const [hl, setHl] = useState(0)

  const sugg = useMemo(() => (focus && open ? context(text, caret, schema) : null), [focus, open, text, caret, schema])
  const items = sugg?.items || []
  const parsed = useMemo(() => parse(text, schema), [text, schema])
  const [ranged, setRanged] = useState(false)
  const startHl = sugg?.title === 'Combine' || sugg?.title === 'Add another value' || sugg?.title?.startsWith('Regex syntax') ? -1 : 0

  useLayoutEffect(() => {
    setHl(startHl)
    if (list.current) list.current.scrollTop = 0
  }, [sugg?.kind, sugg?.title, sugg?.from, startHl])

  useLayoutEffect(() => {
    if (nextCaret.current !== null && ta.current) {
      ta.current.setSelectionRange(nextCaret.current, nextCaret.current)
      setCaret(nextCaret.current)
      nextCaret.current = null
    }
  }, [text])

  useEffect(() => {
    list.current?.querySelector('[data-hl]')?.scrollIntoView({ block: 'nearest' })
  }, [hl])

  const visible = useMemo(() => parsed.errors.filter((e) => runErrors || (!e.eof && (e.e < caret || caret < e.s || !focus))), [parsed, runErrors, caret, focus])

  const highlighted = useMemo(() => {
    const out = []
    let at = 0
    const marked = visible.find((e) => e.at !== undefined)
    const mark = marked?.at
    const lo = marked && Math.min(marked.s, mark)
    const hi = marked && Math.max(marked.e, mark)
    const tint = (a, b) => (marked && a >= lo && b <= hi ? ' bg-base-red-100' : '')
    const pin = (k) => (
      <span key={'at' + k} className="relative">
        <span style={{ position: 'absolute', left: 0, top: -1, height: 20, width: 2, borderRadius: 1, background: 'var(--color-text-color-red)' }} />
      </span>
    )
    for (const t of parsed.toks) {
      if (t.s > at) out.push(<span key={'g' + at} className={tint(at, t.s)}>{text.slice(at, t.s)}</span>)
      const bad = visible.some((e) => t.s < e.e && t.e > e.s)
      out.push(<span key={t.s} className={(bad ? 'text-text-color-red underline decoration-dotted' : cls(t)) + tint(t.s, t.e)}>{text.slice(t.s, t.e)}</span>)
      at = t.e
      if (mark === t.e) out.push(pin(t.e))
    }
    out.push(text.slice(at))
    return out
  }, [parsed, text, visible])

  const edit = (value, pos, keep) => {
    nextCaret.current = pos
    setText(value)
    setRunErrors(false)
    setOpen(keep)
  }

  const accept = (item) => {
    let from = item.from ?? sugg.from
    if (item.trim) while (from > 0 && /\s/.test(text[from - 1])) from--
    const ins = item.insert
    edit(text.slice(0, from) + ins + text.slice(item.to ?? sugg.to), from + (item.caretAt ?? ins.length), !!item.reopen)
  }

  const run = (src = text) => {
    setOpen(false)
    const p = parse(src, schema)
    if (p.errors.length) {
      setRunErrors(true)
      return
    }
    const clean = format(p.ast)
    const shown = focus ? format(p.ast, null, true) : clean
    if (shown !== text) edit(shown, shown.length, false)
    onRun?.(clean, p.ast)
  }
  if (runRef) runRef.current = run

  const skip = (pos) => {
    nextCaret.current = pos
    ta.current.setSelectionRange(pos, pos)
    setCaret(pos)
    setOpen(true)
  }

  const onKeyDown = (e) => {
    const el = ta.current
    stepped.current = null
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      run()
      return
    }
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (open && items.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const d = e.key === 'ArrowDown' ? 1 : -1
        setHl((h) => (h < 0 ? (d > 0 ? 0 : items.length - 1) : (h + d + items.length) % items.length))
        return
      }
      if (e.key === 'Enter' && !e.shiftKey && hl >= 0) {
        e.preventDefault()
        accept(items[hl])
        return
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (open && items.length) setOpen(false)
      else el.blur()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      run()
      return
    }
    const at = el.selectionStart
    const live = el.value
    last.current = live
    if (e.key === ' ' && at === el.selectionEnd && live[at - 1] === ' ' && !((live.slice(0, at).match(/(?<!\\)"/g) || []).length % 2)) {
      e.preventDefault()
      return
    }
    if (PAIRS[e.key] && at === el.selectionEnd && live[at] === e.key && (e.key !== '"' || closes(live, at))) {
      e.preventDefault()
      stepped.current = { pos: at + 1, c: e.key }
      skip(at + 1)
    }
  }

  const onChange = (e) => {
    const value = e.target.value
    const pos = e.target.selectionStart
    const prev = last.current
    const st = stepped.current
    stepped.current = null
    if (st && value === prev.slice(0, st.pos) + st.c + prev.slice(st.pos)) {
      e.target.value = prev
      setText(prev)
      skip(st.pos)
      return
    }
    if (value.length === prev.length + 1 && value.slice(pos - 2, pos) === '. ' && value.slice(0, pos - 2) + ' ' + value.slice(pos) === prev) {
      e.target.value = prev
      setText(prev)
      skip(pos - 1)
      return
    }
    const n = value.length - prev.length
    const c = value[pos - 1]
    if (n >= 1 && PAIRS[c] && value.slice(0, pos - n) + value.slice(pos) === prev && prev[pos - n] === c && (c !== '"' || closes(value, pos - 1))) {
      const v = value.slice(0, pos - 1) + value.slice(pos)
      e.target.value = v
      last.current = v
      setText(v)
      setRunErrors(false)
      skip(pos)
      return
    }
    last.current = value
    setText(value)
    setCaret(pos)
    setRunErrors(false)
    setOpen(true)
  }

  const sync = () => setCaret(ta.current.selectionStart)
  const showCard = !adv && focus && open && !ranged && items.length > 0
  const err = visible[0]
  const showNotice = !adv && !showCard && err && (focus || runErrors)
  const fix = (s, e, t) => {
    edit(text.slice(0, s) + t + text.slice(e), s + t.length, true)
    ta.current.focus()
  }
  const lifted = focus || showNotice || adv
  const kfmt = (n) => (n >= 1000 ? (n / 1000).toFixed(2).replace(/\.?0+$/, '') + 'k' : n)

  let lastGroup = sugg?.title
  const row = 'relative flex h-7 cursor-pointer items-center gap-2 rounded px-2'

  const chips = showCard && items.some((it) => !it.pin) && items.every((it) => it.pin || it.kind === 'value')
  const rowsOf = []
  if (chips)
    items.forEach((it, i) => {
      if (it.pin) return
      const raw = it.label.replace(/^"(.*)"$/, '$1')
      const cls = /^\d{3}$/.test(raw) ? raw[0] + 'XX' : ''
      const last = rowsOf[rowsOf.length - 1]
      if (last && last.group === it.group && last.cls === cls) last.items.push([it, i])
      else rowsOf.push({ group: it.group, cls, head: (!last || last.group !== it.group) && it.group, items: [[it, i]] })
    })
  const grouped = showCard && !chips && items.some((it) => !it.pin && it.group)
  const groupsOf = []
  if (grouped)
    items.forEach((it, i) => {
      if (it.pin) return
      const last = groupsOf[groupsOf.length - 1]
      if (last && last.group === (it.group || '')) last.items.push([it, i])
      else groupsOf.push({ group: it.group || '', items: [[it, i]] })
    })

  const renderRow = (it, i, bare) => {
    const head = !bare && it.group && it.group !== lastGroup ? it.group : null
    lastGroup = it.group
    const segs = schema.byPath[it.label]?.segs
    const dot = segs ? it.label.length - segs[segs.length - 1].length : it.label.search(/[^.]*$/)
    const Icon = TYPE_ICON[it.type]
    const raw = it.label.replace(/^"(.*)"$/, '$1')
    const vs = it.kind === 'value' && valueStyle(raw)
    return (
      <li key={i}>
        {head && <p className={`px-2 pb-1 text-interface-titles-caption text-text-default-subdued ${i > 0 ? 'pt-2' : ''}`}>{head.toUpperCase()}</p>}
        <div data-hl={i === hl || undefined} style={{ scrollMarginTop: 28 }} onMouseMove={() => i !== hl && setHl(i)} onClick={() => accept(it)} className={`${row} ${i === hl ? 'bg-surface-color-blue-default-subtle' : ''}`}>
          {it.kind === 'field' && (
            <>
              {Icon && <Icon size={13} className="shrink-0 text-icon-subtle" />}
              <span className="min-w-0 truncate font-mono text-code-editor-small">
                {it.sub ? (
                  <>
                    <span className="font-semibold text-base-blue-1100">{it.label}</span>
                    <span className="text-text-default-subtle"> {it.sub}</span>
                  </>
                ) : (
                  <>
                    <span className="text-text-default-subtle">{it.label.slice(0, dot)}</span>
                    <span className="font-semibold text-base-blue-1100">{it.label.slice(dot)}</span>
                  </>
                )}
              </span>
              <span className="flex-1" />
              {it.count !== undefined && <span className="w-9 shrink-0 text-right text-interface-labels-xs-normal text-text-default-subtle">{kfmt(it.count)}</span>}
            </>
          )}
          {(it.kind === 'op' || it.kind === 'kw' || it.kind === 'fn') && (
            <>
              <span className={`shrink-0 font-mono text-code-editor-small font-semibold ${it.num ? ROLE.num : it.str ? ROLE.str : 'text-text-color-purple'}`}>{it.label}</span>
              {it.sub && <span className="ml-auto min-w-0 truncate text-interface-body-s-normal text-text-default-subdued">{it.sub}</span>}
            </>
          )}
          {it.kind === 'value' && (
            <>
              {vs ? (
                <span style={{ ...vs, padding: vs.background ? '0 4px' : 0 }} className="min-w-0 truncate font-mono text-code-editor-small">{raw}</span>
              ) : (
                <span className={`min-w-0 truncate font-mono text-code-editor-small ${it.label.startsWith('"') ? ROLE.str : it.label === 'true' || it.label === 'false' ? ROLE.bool : ROLE.num}`}>{it.label}</span>
              )}
              {it.total ? (
                <span className="ml-auto h-1 w-14 shrink-0 overflow-hidden rounded-full bg-surface-hover-l1-hover">
                  <span className="block h-full rounded-full bg-base-blue-500" style={{ width: Math.max(4, (it.count / it.total) * 100) + '%' }} />
                </span>
              ) : null}
              {it.count !== undefined && <span className="w-9 shrink-0 text-right text-interface-labels-xs-normal text-text-default-subtle">{kfmt(it.count)}</span>}
            </>
          )}
          {i === hl && (it.kind === 'field' || it.kind === 'value') && <kbd className={`${it.kind === 'field' || it.total ? '' : 'ml-auto'} shrink-0 rounded border border-stroke-subsection bg-surface-default-ground px-1 font-sans text-[10px] leading-4 text-text-default-subtle`}>Enter</kbd>}
        </div>
      </li>
    )
  }

  return (
    <div data-qbox="" className="relative h-8 min-w-0 flex-1">
      <div className={`absolute inset-x-0 top-0 rounded-md border ${lifted ? `z-40 bg-surface-default-l1 shadow-e300 ${showNotice && runErrors ? 'border-stroke-red-regular' : 'border-stroke-active'}` : `${runErrors && parsed.errors.length ? 'border-stroke-red-regular' : 'border-stroke-subsection'} bg-surface-default-underground`}`}>
        <div className="flex items-start">
          <span className={`flex h-[30px] shrink-0 items-center pl-2 ${adv ? 'invisible' : ''}`}>
            <Funnel size={14} className="text-icon-default" />
          </span>
          <div className={`group/filter relative min-w-0 flex-1 ${adv ? 'invisible' : ''}`}>
            <div ref={pre} aria-hidden="true" style={focus ? { maxHeight: 210 } : undefined} className={`pointer-events-none px-2 py-[5px] font-mono text-code-editor-small leading-5 ${focus ? 'overflow-hidden whitespace-pre-wrap break-words' : 'h-[30px] overflow-hidden whitespace-pre'}`}>
              {highlighted}
              {'​'}
            </div>
            <textarea
              ref={ta}
              rows={1}
              wrap={focus ? 'soft' : 'off'}
              value={text}
              spellCheck={false}
              aria-label="Filter"
              placeholder={placeholder}
              onSelect={(e) => setRanged(e.target.selectionStart !== e.target.selectionEnd)}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onKeyUp={(e) => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || (!open && ['ArrowUp', 'ArrowDown'].includes(e.key))) sync()
              }}
              onClick={() => {
                sync()
                setOpen(true)
              }}
              onFocus={() => {
                setFocus(true)
                setOpen(true)
                const pretty = parsed.ast && !parsed.errors.length ? format(parsed.ast, null, true) : text
                if (pretty === text) return sync()
                const n = text.slice(0, ta.current.selectionStart).replace(/\s/g, '').length
                let i = 0
                for (let k = 0; i < pretty.length && k < n; i++) if (!/\s/.test(pretty[i])) k++
                nextCaret.current = i
                setText(pretty)
              }}
              onBlur={() => {
                setFocus(false)
                setOpen(false)
                if (text.includes('\n')) setText(parsed.ast && !parsed.errors.length ? format(parsed.ast) : text.replace(/\s*\n\s*/g, ' '))
                ta.current.scrollTop = 0
                if (pre.current) pre.current.scrollTop = 0
              }}
              onScroll={(e) => {
                if (pre.current) pre.current.scrollTop = e.target.scrollTop
              }}
              className={`absolute inset-0 h-full w-full resize-none ${focus ? 'no-scrollbar overflow-y-auto' : 'overflow-hidden'} bg-transparent px-2 py-[5px] font-mono text-code-editor-small leading-5 text-transparent caret-[var(--color-text-default-regular)] outline-none placeholder:text-text-default-disabled`}
            />
          </div>
          {text && !adv && (
            <span className="flex h-[30px] shrink-0 items-center">
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => edit('', 0, true)} data-pqb-tip="Clear filter" aria-label="Clear filter" className="grid h-6 w-6 place-items-center rounded text-icon-default hover:bg-surface-hover-l1-hover">
                <X size={13} />
              </button>
              {focus && (
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => navigator.clipboard?.writeText(text)} data-pqb-tip="Copy query" aria-label="Copy query" className="grid h-6 w-6 place-items-center rounded text-icon-default hover:bg-surface-hover-l1-hover">
                  <Copy size={13} />
                </button>
              )}
              <span className="w-1" />
            </span>
          )}
          <span className="flex h-[30px] shrink-0 items-center gap-0.5 px-1">
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
                if (!adv) ta.current.blur()
                setAdv(!adv)
              }} aria-pressed={adv} data-pqb-tip="Build the filter with AND / OR groups" className={`flex h-6 items-center gap-1 rounded px-1.5 ${adv ? 'bg-surface-color-blue-default-subtle text-text-color-blue' : 'text-text-default-regular hover:bg-surface-hover-l1-hover'}`}>
              <TreeStructure size={14} className={adv ? '' : 'text-icon-default'} />
              <span className="whitespace-nowrap text-interface-body-s-heavy">Advanced filter</span>
            </button>
          </span>
          {(tools || actions) && (
            <div className="flex shrink-0 self-stretch border-l border-stroke-subsection pl-1 pr-1">
              <span className="flex min-h-[30px] flex-col items-stretch">
                <span className="flex min-h-[30px] items-center">{tools}</span>
                {focus && !adv && actions}
              </span>
            </div>
          )}
        </div>
        {adv && (
          <Builder
            text={text}
            schema={schema}
            onCancel={() => setAdv(false)}
            onApply={(t) => {
              setAdv(false)
              edit(t, t.length, false)
              run(t)
            }}
          />
        )}
        {showCard && (
          <div className="border-t border-stroke-subsection" onMouseDown={(e) => e.preventDefault()}>
            <div className={`${grouped || (chips && rowsOf[0]?.head) ? 'hidden' : 'flex'} items-center justify-between gap-3 px-3 pb-1 pt-2`}>
              <span className="min-w-0 truncate text-interface-titles-caption text-text-default-subdued">
                {sugg.title.toUpperCase()}
              </span>
            </div>
            <ul ref={list} style={{ maxHeight: 180 }} className="no-scrollbar overflow-y-auto px-1 pb-1">
              {chips
                ? rowsOf.map((r) => (
                    <li key={r.items[0][1]}>
                      {r.head && <p className="px-2 pb-1 pt-2 text-interface-titles-caption text-text-default-subdued">{(r === rowsOf[0] && r.head !== sugg.title ? `${sugg.title} / ${r.head}` : r.head).toUpperCase()}</p>}
                      <div className="flex flex-wrap items-center gap-1 px-2 py-1">
                        {r.cls && <span className="w-8 shrink-0 text-interface-labels-xs-normal text-text-default-subdued">{r.cls}</span>}
                        {r.items.map(([it, i]) => {
                          const raw = it.label.replace(/^"(.*)"$/, '$1')
                          const vs = valueStyle(raw)
                          return (
                            <button key={i} data-hl={i === hl || undefined} onMouseMove={() => i !== hl && setHl(i)} onClick={() => accept(it)} style={{ ...vs, outline: i === hl ? '2px solid var(--color-stroke-active)' : 'none', outlineOffset: 1 }} className={`h-6 rounded px-1.5 font-mono text-code-editor-small ${vs?.background ? '' : 'bg-surface-default-underground'} ${vs ? '' : raw === 'true' || raw === 'false' ? ROLE.bool : ROLE.str}`}>
                              {vs ? raw : it.label}
                            </button>
                          )
                        })}
                      </div>
                    </li>
                  ))
                : grouped
                  ? groupsOf.map((g) => (
                      <li key={g.items[0][1]}>
                        <p style={{ position: 'sticky', top: 0, zIndex: 1 }} className="flex items-center justify-between gap-3 bg-surface-default-l1 px-2 pb-1 pt-2 text-interface-titles-caption text-text-default-subdued">
                          <span className="min-w-0 truncate">{(g.group ? `${sugg.title} / ${g.group}` : sugg.title).toUpperCase()}</span>
                        </p>
                        <ul>{g.items.map(([it, i]) => renderRow(it, i, true))}</ul>
                      </li>
                    ))
                  : items.map((it, i) => !it.pin && renderRow(it, i))}
            </ul>
            {items.some((it) => it.pin) && <ul className="border-t border-stroke-subsection px-1 pb-1">{items.map((it, i) => it.pin && renderRow(it, i))}</ul>}
            <div className="flex items-center gap-3 border-t border-stroke-subsection px-3 py-1.5 text-interface-labels-xs-light text-text-default-subdued">
              {[
                ['↑↓', 'move'],
                ['Enter', hl < 0 ? 'run' : 'add'],
                ['Esc', 'close'],
                [MAC ? '⌘ Enter' : 'Ctrl Enter', 'run'],
                [MAC ? '⇧ Enter' : 'Shift Enter', 'new line']
              ].map(([k, l]) => (
                <span key={k} className="flex items-center gap-1">
                  <kbd className="rounded border border-stroke-subsection bg-surface-default-ground px-1 font-sans text-[10px] leading-4 text-text-default-subtle">{k}</kbd>
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}
        {showNotice && (
          <div className="flex items-start gap-1.5 border-t border-stroke-subsection px-2.5 py-1.5" onMouseDown={(e) => e.preventDefault()}>
            <Warning size={14} weight="fill" className="mt-[3px] shrink-0 text-text-color-red" />
            <div className="min-w-0 flex-1">
              <p className="text-interface-labels-xs-normal leading-5 text-text-color-red">{err.msg}</p>
              {(err.fix || err.near?.length > 0) && (
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-interface-labels-xs-light text-text-default-subdued">Suggestions</span>
                  {[].concat(err.fix || []).map((f) => (
                    <button key={f.verb + f.label} onClick={() => fix(f.s, f.e, f.text)} style={{ minHeight: 24 }} className="max-w-full break-words rounded border border-stroke-subsection px-2 py-0.5 text-left font-mono text-interface-labels-xs-normal text-base-blue-1100 hover:bg-surface-hover-l1-hover">{f.verb || 'Use'} {f.label}</button>
                  ))}
                  {err.near?.map((n) => (
                    <button key={n} onClick={() => fix(err.s, err.e, n)} style={{ minHeight: 24 }} className="max-w-full break-words rounded border border-stroke-subsection px-2 py-0.5 text-left font-mono text-interface-labels-xs-normal text-base-blue-1100 hover:bg-surface-hover-l1-hover">{n}</button>
                  ))}
                </div>
              )}
              {visible.length > 1 && <p className="mt-1 text-interface-labels-xs-light text-text-default-subdued">and {visible.length - 1} more {visible.length === 2 ? 'problem' : 'problems'}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
