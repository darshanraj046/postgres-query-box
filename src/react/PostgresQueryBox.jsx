import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { BookmarksSimple, CaretDown, Play } from '@phosphor-icons/react'
import { parse, format } from '../core/engine.js'
import QueryBox, { Tips } from './QueryBox.jsx'
import Saved from './Saved.jsx'

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
    onSavedSearch,
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
            {panel && <Saved saved={saved} loading={savedLoading} schema={schema} current={text} onPick={pick} onPin={onPinSaved} onDelete={onDeleteSaved} onSave={onSaveQuery} onSearch={onSavedSearch} onClose={() => setPanel(false)} />}
          </span>
        )}
      </>
    ) : null
  return (
    <div ref={root} className={`pqb flex min-w-0 items-start gap-2 ${className}`}>
      <QueryBox text={text} setText={setText} schema={schema} onRun={onRun} tools={extra} runErrors={runErrors} setRunErrors={setRunErrors} runRef={runRef} adv={adv} setAdv={setAdv} placeholder={placeholder} />
      <button onClick={() => runRef.current?.()} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-stroke-active bg-surface-default-action px-3 hover:bg-surface-default-action-hover">
        <Play size={14} weight="fill" className="text-text-default-static" />
        <span className="whitespace-nowrap text-interface-labels-xs-normal font-semibold text-text-default-static">{runLabel}</span>
      </button>
      <Tips root={root} />
    </div>
  )
})

export default PostgresQueryBox
