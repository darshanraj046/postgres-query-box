import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { parse, format } from '../core/engine.js'
import { paint } from './QueryBox.jsx'

export const ICON = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
export const PIN = 'M9 3h6l-1 6 4 4H6l4-4zM12 13v8'
export const FUNNEL = 'M3 5h18l-7 8v6l-4 2v-8z'
export const BELL = 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4'
export const BOOKMARK = 'M6 3h12v18l-6-4-6 4z'

export function QueryChip({ query, schema }) {
  return (
    <code style={{ fontSize: 11, lineHeight: '16px', paddingTop: 1, paddingBottom: 1 }} className="flex w-fit max-w-full items-center gap-1 rounded border border-stroke-subsection bg-surface-default-underground px-1.5 font-mono text-text-default-regular">
      <svg {...ICON} width={12} height={12} className="shrink-0 text-icon-default"><path d={FUNNEL} /></svg>
      <span data-pqb-tip={query} data-mono="" data-trunc="" className="min-w-0 truncate">{paint(query.replace(/\s+/g, ' ').trim(), schema)}</span>
    </code>
  )
}

export default function Saved({ saved, loading, schema, onPick, onPin, onDelete, onUpdate, onAlert, onSearch, onClose }) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const ref = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const out = (e) => !ref.current?.contains(e.target) && !e.target.closest('[data-pqb-saved]') && close.current()
    document.addEventListener('mousedown', out, true)
    return () => document.removeEventListener('mousedown', out, true)
  }, [])
  const x = q.trim().toLowerCase()
  const hit = saved.filter((s) => !x || s.name.toLowerCase().includes(x) || s.query.toLowerCase().includes(x))
  const err = editing && editing.query.trim() ? parse(editing.query, schema).errors[0] : null
  const nameTaken = editing && saved.some((s) => s.id !== editing.id && s.name === editing.name.trim())
  const submit = () => {
    if (!editing.name.trim() || !editing.query.trim() || err || nameTaken) return
    onUpdate(saved.find((s) => s.id === editing.id), { name: editing.name.trim(), query: format(parse(editing.query, schema).ast) })
    setEditing(null)
  }
  const act = 'grid h-6 w-6 place-items-center rounded text-text-default-subtle hover:bg-surface-default-l1 hover:text-text-default-regular'
  const item = (s) =>
    removing === s.id ? (
      <div key={s.id} onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setRemoving(null))} className="flex items-center gap-1 bg-surface-hover-l1-hover px-2.5 py-1.5">
        <span className="min-w-0 flex-1 truncate text-interface-body-s-heavy text-text-default-regular">Delete “{s.name}”?</span>
        <button onClick={() => (onDelete(s), setRemoving(null))} className="h-6 rounded px-2 text-interface-labels-xs-normal font-semibold text-text-color-red hover:bg-surface-default-l1">Delete</button>
        <button autoFocus onClick={() => setRemoving(null)} className="h-6 rounded border border-stroke-subsection bg-surface-default-l1 px-2 text-interface-labels-xs-normal font-semibold text-text-default-regular">Cancel</button>
      </div>
    ) : editing?.id === s.id ? (
      <div
        key={s.id}
        onKeyDown={(e) => {
          if (e.key === 'Escape') e.stopPropagation(), setEditing(null)
          else if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'BUTTON') e.preventDefault(), submit()
        }}
        className="flex flex-col gap-1.5 bg-surface-hover-l1-hover px-2.5 py-1.5"
      >
        <input autoFocus aria-label="Name" value={editing.name} onFocus={(e) => e.target.select()} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="rounded border border-stroke-subsection bg-surface-default-l1 px-1.5 py-1 text-interface-body-s-heavy text-text-default-regular outline-none focus:border-stroke-active" />
        <textarea aria-label="Query" rows={3} spellCheck={false} value={editing.query} onChange={(e) => setEditing({ ...editing, query: e.target.value })} style={{ fontSize: 11, lineHeight: '16px' }} className="resize-none rounded border border-stroke-subsection bg-surface-default-l1 px-1.5 py-1 font-mono text-text-default-regular outline-none focus:border-stroke-active" />
        {err && (() => {
          const t = editing.query.replace(/\n/g, ' ')
          const from = Math.min(err.s, err.at ?? err.s)
          const to = Math.max(err.e, err.at ?? err.e)
          const lo = Math.max(0, from - 30)
          const hi = Math.min(t.length, to + 30)
          const fixes = [...[].concat(err.fix || []), ...(err.near || []).map((n) => ({ s: err.s, e: err.e, text: n, label: n, plain: true }))]
          return (
            <div className="flex flex-col gap-1">
              <p className="text-interface-labels-xs-normal text-text-color-red">{err.msg}</p>
              <code style={{ fontSize: 11, lineHeight: '16px' }} className="whitespace-pre-wrap break-all rounded border border-stroke-subsection bg-surface-default-l1 px-1.5 py-0.5 font-mono text-text-default-subdued">
                {lo > 0 && '…'}
                {t.slice(lo, from)}
                <span className="rounded-sm bg-base-red-100 text-text-color-red">
                  {t.slice(from, err.s)}
                  <b className="font-semibold">{t.slice(err.s, err.e)}</b>
                  {t.slice(err.e, to) || (from === to ? ' ' : '')}
                </span>
                {t.slice(to, hi)}
                {hi < t.length && '…'}
              </code>
              {fixes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-interface-labels-xs-light text-text-default-subdued">Suggestions</span>
                  {fixes.map((f) => (
                    <button key={(f.verb || '') + f.label} onClick={() => setEditing({ ...editing, query: editing.query.slice(0, f.s) + f.text + editing.query.slice(f.e) })} style={{ minHeight: 24 }} className="max-w-full break-words rounded border border-stroke-subsection bg-surface-default-l1 px-2 py-0.5 text-left font-mono text-interface-labels-xs-normal text-base-blue-1100 hover:bg-surface-default-underground">
                      {f.plain ? f.label : `${f.verb || 'Use'} ${f.label}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
        {!err && nameTaken && <p className="text-interface-labels-xs-normal text-text-color-red">A saved query is already called {editing.name.trim()}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(null)} className="h-6 rounded bg-surface-default-l1 px-2 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-default-underground">Cancel</button>
          <button disabled={!editing.name.trim() || !editing.query.trim() || !!err || nameTaken} onClick={submit} className="h-6 rounded-md border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50">Save</button>
        </div>
      </div>
    ) : (
      <div key={s.id} className="group flex items-start gap-2 px-2.5 py-1.5 hover:bg-surface-hover-l1-hover">
        <button onClick={() => onPick(s)} style={{ gap: 3 }} className="flex min-w-0 flex-1 flex-col text-left">
          <span data-pqb-tip={s.name} data-trunc="" className="max-w-full truncate text-interface-body-s-heavy text-text-default-regular">{s.name}</span>
          <QueryChip query={s.query} schema={schema} />
        </button>
        <span className="grid shrink-0 self-center">
          {s.pinned && <svg {...ICON} width={14} height={14} role="img" aria-label="Pinned" style={{ gridArea: '1 / 1', justifySelf: 'end', marginRight: 5 }} className="text-text-color-blue group-hover:hidden"><path d={PIN} fill="currentColor" /></svg>}
          <span style={{ gridArea: '1 / 1' }} className="hidden gap-0.5 group-hover:flex">
            {onPin && (
              <button aria-label={s.pinned ? `Unpin ${s.name}` : `Pin ${s.name}`} data-pqb-tip={s.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(s, !s.pinned)} className={act}>
                <svg {...ICON}><path d={s.pinned ? PIN + 'M4 4l16 16' : PIN} /></svg>
              </button>
            )}
            {onAlert && (
              <button aria-label={`Create an alert from ${s.name}`} data-pqb-tip="Create alert" onClick={() => onAlert(s.query)} className={act}>
                <svg {...ICON}><path d={BELL} /></svg>
              </button>
            )}
            {onUpdate && (
              <button aria-label={`Edit ${s.name}`} data-pqb-tip="Edit" onClick={() => (setRemoving(null), setEditing({ id: s.id, name: s.name, query: s.query }))} className={act}>
                <svg {...ICON}><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /></svg>
              </button>
            )}
            {onDelete && (
              <button aria-label={`Delete ${s.name}`} data-pqb-tip="Delete" onClick={() => (setEditing(null), setRemoving(s.id))} className={`${act} hover:text-text-color-red`}>
                <svg {...ICON}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
              </button>
            )}
          </span>
        </span>
      </div>
    )
  const pinned = hit.filter((s) => s.pinned)
  const rest = hit.filter((s) => !s.pinned)
  return (
    <div ref={ref} className="absolute right-0 top-9 z-50 flex w-[380px] flex-col rounded-md border border-stroke-subsection bg-surface-default-l1 shadow-e300">
      <div className="flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-3">
        <MagnifyingGlass size={14} className="shrink-0 text-icon-default" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            onSearch?.(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'Enter' && hit[0]) onPick(hit[0])
          }}
          placeholder="Search saved queries"
          className="min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
        />
      </div>
      <div style={{ maxHeight: 'min(520px, 70vh)' }} className="overflow-y-auto no-scrollbar py-1">
        {loading && <p className="px-3 py-3 text-interface-body-s-light text-text-default-subdued">Loading saved queries</p>}
        {pinned.length > 0 && (
          <>
            <p className="px-2.5 pb-0.5 pt-1 text-interface-titles-caption text-text-default-subdued">PINNED</p>
            {pinned.map(item)}
          </>
        )}
        {rest.length > 0 && (
          <div className={pinned.length ? 'mt-1 border-t border-stroke-subsection pt-1' : ''}>
            <p className="px-2.5 pb-0.5 pt-1 text-interface-titles-caption text-text-default-subdued">ALL SAVED</p>
            {rest.map(item)}
          </div>
        )}
        {!loading && !hit.length && <p className="px-3 py-5 text-center text-interface-body-s-light text-text-default-subdued">{q ? 'No saved queries match.' : 'No saved queries yet. Type a filter and press Save.'}</p>}
      </div>
    </div>
  )
}
