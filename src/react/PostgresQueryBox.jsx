import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { BookmarksSimple, CaretDown, Play } from '@phosphor-icons/react'
import { parse, format } from '../core/engine.js'
import QueryBox, { Tips } from './QueryBox.jsx'
import Saved, { ICON, BELL, BOOKMARK, QueryChip } from './Saved.jsx'

const PostgresQueryBox = forwardRef(function PostgresQueryBox(
  {
    schema,
    value,
    defaultValue = '',
    onChange,
    onRun,
    placeholder = 'Filter calls, e.g. data.request.verb == "GET" AND data.response.statusCode >= 500',
    runLabel = 'Run query',
    tools,
    saved,
    savedCount,
    savedLoading,
    onSelectSaved,
    onPinSaved,
    onSaveQuery,
    onDeleteSaved,
    onUpdateSaved,
    onSavedSearch,
    onCreateAlert,
    className = ''
  },
  ref
) {
  const root = useRef(null)
  const runRef = useRef(null)
  const [own, setOwn] = useState(defaultValue)
  const text = value ?? own
  const setText = (t) => {
    if (value === undefined) setOwn(t)
    onChange?.(t)
  }
  const [runErrors, setRunErrors] = useState(false)
  const [adv, setAdvState] = useState(false)
  const [panel, setPanelState] = useState(false)
  const setAdv = (v) => {
    setAdvState(v)
    if (v) setPanelState(false)
  }
  const setPanel = (v) => {
    setPanelState(v)
    if (v) setAdvState(false)
  }
  const parsed = text.trim() ? parse(text, schema) : null
  const valid = !!parsed && !parsed.errors.length
  const clean = valid ? format(parsed.ast) : ''
  const match = onUpdateSaved && saved?.find((s) => s.query === clean)
  const [draft, setDraft] = useState(null)
  const popRef = useRef(null)
  const taken = draft && saved?.some((s) => s.id !== match?.id && s.name === draft.name.trim())
  useEffect(() => {
    if (!draft) return
    const out = (e) => !popRef.current?.contains(e.target) && setDraft(null)
    document.addEventListener('mousedown', out)
    return () => document.removeEventListener('mousedown', out)
  }, [!draft])
  const submitDraft = () => {
    if (!draft.name.trim() || taken) return
    if (match) onUpdateSaved(match, { name: draft.name.trim(), pinned: draft.pinned })
    else onSaveQuery({ name: draft.name.trim(), query: clean, pinned: draft.pinned })
    setDraft(null)
  }
  const openAlert = (q) => {
    root.current?.querySelector('textarea')?.blur()
    setPanel(false)
    const p = parse(q, schema)
    onCreateAlert(format(p.ast), p.ast)
  }
  useImperativeHandle(ref, () => ({
    focus: () => root.current?.querySelector('textarea')?.focus(),
    run: () => runRef.current?.(),
    setText,
    getText: () => text
  }))
  const pick = (s) => {
    onSelectSaved?.(s)
    setPanel(false)
    const p = parse(s.query, schema)
    const clean = p.errors.length ? s.query : format(p.ast)
    setText(clean)
    runRef.current?.(clean)
  }
  const extra =
    tools || saved ? (
      <>
        {tools}
        {saved && (
          <span className="relative">
            <button data-pqb-saved="" onMouseDown={(e) => e.preventDefault()} onClick={() => setPanel(!panel)} aria-expanded={panel} data-pqb-tip="Saved queries" className={`flex h-6 items-center gap-1.5 rounded px-1.5 hover:bg-surface-hover-l1-hover ${panel ? 'bg-surface-hover-l1-hover' : ''}`}>
              <BookmarksSimple size={14} className="shrink-0 text-icon-default" />
              <span className="min-w-0 max-w-[200px] truncate text-interface-body-s-heavy text-text-default-regular">Queries</span>
              <span className="rounded-full bg-surface-hover-l1-hover px-1.5 text-interface-labels-xxs-normal text-text-default-subdued">{savedCount ?? saved.length}</span>
              <CaretDown size={12} className="shrink-0 text-text-default-subtle" />
            </button>
            {panel && <Saved saved={saved} loading={savedLoading} schema={schema} onPick={pick} onPin={onPinSaved} onDelete={onDeleteSaved} onUpdate={onUpdateSaved} onAlert={onCreateAlert && openAlert} onSearch={onSavedSearch} onClose={() => setPanel(false)} />}
          </span>
        )}
      </>
    ) : null
  const actions = [
    onSaveQuery && ['Save', BOOKMARK, (e) => {
      const r = e.currentTarget.getBoundingClientRect()
      setPanel(false)
      setDraft({ name: match?.name ?? text.replace(/\b(?:data|metadata)\.[\w.-]+/g, (x) => x.split('.').pop()).replace(/\s+/g, ' ').trim().slice(0, 60), pinned: !!match?.pinned, top: r.bottom + 6, left: Math.max(8, r.right - 280) })
    }],
    onCreateAlert && ['Create alert', BELL, () => openAlert(text)]
  ].filter(Boolean)
  return (
    <div ref={root} className={`pqb ${className}`}>
      <div className="flex min-w-0 items-start gap-2">
        <QueryBox text={text} setText={setText} schema={schema} onRun={onRun} tools={extra} actions={actions.length > 0 && actions.map(([label, d, go]) => (
          <button key={label} disabled={!valid} onMouseDown={(e) => e.preventDefault()} onClick={go} className="flex h-6 items-center gap-1.5 rounded px-1.5 text-left hover:bg-surface-hover-l1-hover disabled:cursor-not-allowed disabled:opacity-50">
            <svg {...ICON} width={14} height={14} className="shrink-0 text-icon-default"><path d={d} /></svg>
            <span className="whitespace-nowrap text-interface-body-s-normal text-text-default-regular">{label}</span>
          </button>
        ))} runErrors={runErrors} setRunErrors={setRunErrors} runRef={runRef} adv={adv} setAdv={setAdv} placeholder={placeholder} />
        <button onClick={() => runRef.current?.()} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-stroke-active bg-surface-default-action px-3 hover:bg-surface-default-action-hover">
          <Play size={14} weight="fill" className="text-text-default-static" />
          <span className="whitespace-nowrap text-interface-labels-xs-normal font-semibold text-text-default-static">{runLabel}</span>
        </button>
      </div>
      <Tips root={root} />
      {draft && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Save query as"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDraft(null)
            else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') e.preventDefault(), submitDraft()
          }}
          style={{ position: 'fixed', top: draft.top, left: draft.left, width: 280, zIndex: 60 }}
          className="flex flex-col gap-2 rounded-md border border-stroke-subsection bg-surface-default-l1 p-3 shadow-e300"
        >
          <p className="text-interface-body-s-heavy text-text-default-regular">Save query as</p>
          <input autoFocus aria-label="Name" value={draft.name} onFocus={(e) => e.target.select()} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="rounded-md border border-stroke-subsection bg-surface-default-underground px-2 py-1.5 text-interface-body-s-normal font-medium text-text-default-regular outline-none focus:border-stroke-active" />
          <label className="flex cursor-pointer items-center gap-1.5 text-interface-labels-xs-normal font-medium text-text-default-subdued">
            <input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} style={{ width: 14, height: 14, margin: 0, accentColor: 'var(--color-stroke-active)' }} />
            Pin to the top of Queries
          </label>
          <QueryChip query={clean} schema={schema} />
          {taken && <p className="text-interface-labels-xs-normal text-text-color-red">A saved query is already called {draft.name.trim()}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setDraft(null)} className="h-6 rounded px-2 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-hover-l1-hover">Cancel</button>
            <button disabled={!draft.name.trim() || taken} onClick={submitDraft} className="h-6 rounded-md border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50">{match ? 'Update' : 'Save'}</button>
          </div>
        </div>
      )}
    </div>
  )
})

export default PostgresQueryBox
