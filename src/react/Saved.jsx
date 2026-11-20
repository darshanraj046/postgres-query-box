import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlass, PushPin, Trash } from '@phosphor-icons/react'
import { parse, format } from '../core/engine.js'
import { paint } from './QueryBox.jsx'

export default function Saved({ saved, loading, schema, current, onPick, onPin, onDelete, onSave, onSearch, onClose }) {
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const ref = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const out = (e) => !ref.current?.contains(e.target) && !e.target.closest('[data-pqb-saved]') && close.current()
    const key = (e) => e.key === 'Escape' && close.current()
    document.addEventListener('mousedown', out, true)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', out, true)
      document.removeEventListener('keydown', key)
    }
  }, [])
  const x = q.trim().toLowerCase()
  const hit = saved.filter((s) => !x || s.name.toLowerCase().includes(x) || s.query.toLowerCase().includes(x))
  const parsed = current.trim() ? parse(current, schema) : null
  const valid = parsed && !parsed.errors.length
  const taken = saved.some((s) => s.name === name.trim())
  const save = () => {
    if (!valid || !name.trim() || taken) return
    onSave({ name: name.trim(), query: format(parsed.ast), pinned: false })
    setName('')
  }
  const section = (title, list) =>
    list.length > 0 && (
      <>
        <p className="px-3 pb-1 pt-2.5 text-interface-titles-caption text-text-default-subdued">{title}</p>
        {list.map((s) => (
          <div key={s.id} onClick={() => onPick(s)} className="group cursor-pointer px-3 py-1.5 hover:bg-surface-hover-l1-hover">
            <div className="flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-interface-body-s-heavy text-text-default-regular">{s.name}</span>
              {onDelete && (
                <button
                  aria-label="Delete"
                  data-pqb-tip="Delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(s)
                  }}
                  className="invisible grid h-5 w-5 shrink-0 place-items-center rounded text-icon-default hover:bg-surface-default-l2 group-hover:visible"
                >
                  <Trash size={12} />
                </button>
              )}
              {onPin && (
                <button
                  aria-label={s.pinned ? 'Unpin' : 'Pin'}
                  data-pqb-tip={s.pinned ? 'Unpin' : 'Pin'}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPin(s, !s.pinned)
                  }}
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded hover:bg-surface-default-l2 ${s.pinned ? 'text-text-color-blue' : 'invisible text-icon-default group-hover:visible'}`}
                >
                  <PushPin size={12} weight={s.pinned ? 'fill' : 'regular'} />
                </button>
              )}
            </div>
            <p data-pqb-tip={s.query} data-mono="" className="mt-0.5 truncate font-mono text-interface-labels-xs-normal">{paint(s.query.replace(/\n/g, ' '), schema)}</p>
          </div>
        ))}
      </>
    )
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
          placeholder="Search saved queries"
          className="min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
        />
      </div>
      <div className="max-h-[min(520px,70vh)] overflow-y-auto no-scrollbar pb-1">
        {loading && <p className="px-3 py-3 text-interface-body-s-light text-text-default-subdued">Loading saved queries</p>}
        {section('PINNED', hit.filter((s) => s.pinned))}
        {section('ALL SAVED', hit.filter((s) => !s.pinned))}
        {!loading && !hit.length && <p className="px-3 py-3 text-interface-body-s-light text-text-default-subdued">{saved.length ? 'No saved query matches' : 'No saved queries yet'}</p>}
      </div>
      {onSave && valid && (
        <div className="flex items-center gap-1.5 border-t border-stroke-subsection p-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="Name the current query" className="h-7 min-w-0 flex-1 rounded-md border border-stroke-subsection bg-transparent px-2 text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled focus:border-stroke-active" />
          <button disabled={!name.trim() || taken} onClick={save} className="h-7 shrink-0 rounded-[5px] border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50">
            Save
          </button>
        </div>
      )}
    </div>
  )
}
