import { useEffect, useMemo, useRef, useState } from 'react'
import * as P from '@phosphor-icons/react'
import { parse, format, toTree, fromTree, newCond, isComplete, arity, opsFor, OP_INFO, BUILD_OPS, LATENCY, LAT_FIELD, METHODS, STATUS_CODES, TYPE_LABEL } from '../core/engine.js'
import { paint } from './QueryBox.jsx'
import { valueStyle } from './colors.js'

const TYPE_ICON = { string: P.TextT, numtext: P.TextT, ip: P.Globe, number: P.Hash, boolean: P.ToggleLeft, latency: P.Timer }
const EXAMPLE = {
  '==': '"GET"',
  '!=': '"200"',
  ANYONE: '["POST", "PUT"]',
  NONEOF: '["GET", "HEAD"]',
  '<': '1024',
  '<=': '5000',
  '>': '399',
  '>=': '500',
  BETWEEN: '200 AND 299',
  CONTAINS: '"agent-registry"',
  'NOT CONTAINS': '"node"',
  '~': '"^/api/v1/"',
  '!~': '"/health$"',
  PRESENT: 'no value',
  ABSENT: 'no value',
  'IP IN_RANGE': '"10.0.0.0/8"',
  'IP NOT_IN_RANGE': '["10.0.0.0/8"]'
}
const HINT = { 'data.request.verb': 'Method', 'data.response.statusCode': 'Status code', 'data.request.path': 'Path', 'data.request.hostname': 'Host' }
const CATALOG = { 'data.request.verb': METHODS, 'data.response.statusCode': STATUS_CODES }
const INPUT = 'h-7 min-w-0 rounded-md border border-stroke-subsection bg-transparent px-1.5 hover:border-stroke-section font-mono text-code-editor-small text-text-default-regular outline-none placeholder:font-sans placeholder:text-text-default-disabled focus:border-stroke-active'
const ACT = 'grid h-7 w-7 place-items-center rounded text-icon-default hover:bg-surface-hover-l1-hover'

const typeOf = (field, schema) => (field === '@latency' ? 'latency' : schema.byPath[field]?.type || 'string')

const update = (g, id, fn) => ({ ...g, items: g.items.map((x) => (x.id === id ? fn(x) : x.kind === 'group' ? update(x, id, fn) : x)) })
const remove = (g, id) => ({ ...g, items: g.items.filter((x) => x.id !== id).map((x) => (x.kind === 'group' ? remove(x, id) : x)) })
const tidy = (g, top) => {
  const items = g.items.map((x) => (x.kind === 'group' ? tidy(x, false) : x)).filter((x) => x && (x.kind !== 'group' || x.items.length))
  if (!top && items.length === 1 && !g.not) return items[0]
  return { ...g, items }
}
const insertAfter = (g, id, item) => {
  const i = g.items.findIndex((x) => x.id === id)
  if (i >= 0) return { ...g, items: [...g.items.slice(0, i + 1), item, ...g.items.slice(i + 1)] }
  return { ...g, items: g.items.map((x) => (x.kind === 'group' ? insertAfter(x, id, item) : x)) }
}
const clone = (x) => (x.kind === 'group' ? { ...x, id: newCond().id, items: x.items.map(clone) } : { ...x, id: newCond().id, values: [...x.values] })

export function Menu({ anchor, width, onClose, children }) {
  const ref = useRef(null)
  const close = useRef(onClose)
  close.current = onClose
  const [pos, setPos] = useState(null)
  useEffect(() => {
    const onClose = () => close.current()
    const r = anchor.current.getBoundingClientRect()
    const below = r.bottom + 360 < window.innerHeight
    setPos({ left: Math.min(r.left, window.innerWidth - width - 8), top: below ? r.bottom + 4 : undefined, bottom: below ? undefined : window.innerHeight - r.top + 4 })
    const out = (e) => !ref.current?.contains(e.target) && !anchor.current?.contains(e.target) && onClose()
    const key = (e) => e.key === 'Escape' && onClose()
    const scroll = (e) => !ref.current?.contains(e.target) && onClose()
    document.addEventListener('mousedown', out, true)
    document.addEventListener('keydown', key)
    document.addEventListener('scroll', scroll, true)
    return () => {
      document.removeEventListener('mousedown', out, true)
      document.removeEventListener('keydown', key)
      document.removeEventListener('scroll', scroll, true)
    }
  }, [])
  if (!pos) return null
  return (
    <div ref={ref} style={{ position: 'fixed', zIndex: 70, width, ...pos }} className="rounded-md border border-stroke-subsection bg-surface-default-l1 shadow-e300">
      {children}
    </div>
  )
}

function FieldPicker({ value, schema, onPick, autoOpen, placeholder = 'Add field' }) {
  const btn = useRef(null)
  const [open, setOpen] = useState(autoOpen)
  const [q, setQ] = useState('')
  const x = q.trim().toLowerCase()
  const common = [...schema.fields.filter((f) => f.group === 'Common').map((f) => ({ path: f.path, hint: HINT[f.path] || '' })), { path: '@latency', hint: 'Latency in ms' }].filter((c) => !x || (c.path === '@latency' ? LATENCY : c.path).toLowerCase().includes(x) || c.hint.toLowerCase().includes(x))
  const all = schema.fields.filter((f) => f.group !== 'Common' && (!x || f.path.toLowerCase().includes(x))).slice(0, 80)
  const pick = (p) => {
    onPick(p)
    setOpen(false)
    setQ('')
  }
  const label = value === '@latency' ? LATENCY : value
  return (
    <div className="relative min-w-0 shrink">
      <button ref={btn} onClick={() => setOpen(!open)} aria-expanded={open} data-pqb-tip={value ? undefined : 'Pick a field'} className={`flex h-7 max-w-[440px] items-center rounded-md border text-left ${value ? `px-1 ${open ? 'border-stroke-active bg-surface-default-ground' : 'border-transparent hover:bg-surface-hover-l1-hover'}` : `border-dashed bg-surface-default-ground px-2 ${open ? 'border-stroke-active' : 'border-stroke-section hover:border-stroke-active'}`}`}>
        <span className={`min-w-0 truncate text-interface-body-s-normal ${value ? 'font-mono text-base-blue-1100' : 'text-text-default-disabled'}`}>{value ? label : placeholder}</span>
      </button>
      {open && (
        <Menu anchor={btn} width={420} onClose={() => setOpen(false)}>
          <div className="flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5">
            <P.MagnifyingGlass size={14} className="text-icon-default" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${schema.fields.length} fields`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const p = common[0]?.path ?? all[0]?.path
                  if (p) pick(p)
                }
              }}
              className="min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto no-scrollbar pb-1">
            {[['Common', common], ...Object.entries(all.reduce((g, f) => ((g[f.group] ||= []).push(f), g), {}))]
              .filter(([, list]) => list.length)
              .map(([g, list]) => (
                <div key={g}>
                  <p style={{ position: 'sticky', top: 0, zIndex: 1 }} className="flex items-center justify-between gap-3 bg-surface-default-l1 px-2.5 pb-0.5 pt-1.5 text-interface-titles-caption text-text-default-subdued">
                    <span className="min-w-0 truncate">{`FIELDS / ${g}`.toUpperCase()}</span>
                    <span className="shrink-0 text-interface-labels-xs-normal text-text-default-subtle">{list.length}</span>
                  </p>
                  {g === 'Common'
                    ? list.map((c) => {
                        const Icon = TYPE_ICON[c.path === '@latency' ? 'latency' : schema.byPath[c.path]?.type] || P.TextT
                        return (
                          <button key={c.path} onClick={() => pick(c.path)} className="flex w-full items-center gap-2 px-2.5 py-1 text-left hover:bg-surface-hover-l1-hover">
                            <Icon size={12} className="shrink-0 text-icon-subtle" />
                            <span className="min-w-0 flex-1 truncate font-mono text-code-editor-small text-text-default-regular">{c.path === '@latency' ? LATENCY : c.path}</span>
                            {value === c.path && <P.Check size={12} className="shrink-0 text-icon-default" />}
                          </button>
                        )
                      })
                    : list.map((f) => {
                        const Icon = TYPE_ICON[f.type] || P.TextT
                        return (
                          <button key={f.path} onClick={() => pick(f.path)} className="flex w-full items-center gap-2 px-2.5 py-1 text-left hover:bg-surface-hover-l1-hover">
                            <Icon size={12} className="shrink-0 text-icon-subtle" />
                            <span className="min-w-0 flex-1 truncate font-mono text-code-editor-small text-text-default-regular">{f.path}</span>
                            {value === f.path && <P.Check size={12} className="shrink-0 text-icon-default" />}
                          </button>
                        )
                      })}
                </div>
              ))}
            {!common.length && !all.length && <p className="px-2.5 py-2 text-interface-body-s-light text-text-default-subdued">No field matches “{q}”</p>}
          </div>
        </Menu>
      )}
    </div>
  )
}

function OpPicker({ value, type, onPick }) {
  const btn = useRef(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const allowed = opsFor({ type })
  const x = q.trim().toLowerCase()
  const groups = BUILD_OPS.map(([name, ops]) => [name, ops.filter((o) => allowed.includes(o) && (!x || `${o} ${OP_INFO[o]}`.toLowerCase().includes(x)))]).filter(([, ops]) => ops.length)
  const pick = (o) => {
    onPick(o)
    setOpen(false)
    setQ('')
  }
  return (
    <div className="relative shrink-0">
      <button ref={btn} onClick={() => setOpen(!open)} aria-expanded={open} data-pqb-tip={OP_INFO[value]} className={`mt-[3px] flex h-[22px] min-w-[22px] items-center justify-center rounded px-1.5 bg-surface-color-blue-default-subtle hover:bg-surface-color-blue-hover-subtle ${open ? 'ring-1 ring-stroke-active' : ''}`}>
        <span className="whitespace-nowrap font-mono text-code-editor-small font-semibold text-text-color-blue">{value}</span>
      </button>
      {open && (
        <Menu anchor={btn} width={320} onClose={() => setOpen(false)}>
          <div className="flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5">
            <P.MagnifyingGlass size={14} className="text-icon-default" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search operators"
              onKeyDown={(e) => e.key === 'Enter' && groups[0] && pick(groups[0][1][0])}
              className="min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto no-scrollbar py-1">
            {groups.map(([name, ops]) => (
              <div key={name}>
                <p className="px-2.5 pb-0.5 pt-1.5 text-interface-titles-caption text-text-default-subdued">{name.toUpperCase()}</p>
                {ops.map((o) => (
                  <button key={o} onClick={() => pick(o)} className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-surface-hover-l1-hover ${o === value ? 'bg-surface-color-blue-default-subtle' : ''}`}>
                    <span className="w-[72px] shrink-0 truncate rounded bg-surface-default-underground px-1 py-0.5 text-center font-mono text-code-editor-small text-text-default-subtle">{o.replace('IP ', '')}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-interface-body-s-normal text-text-default-regular">{OP_INFO[o]}</span>
                      <span className="truncate font-mono text-interface-labels-xs-light text-text-default-subdued">{EXAMPLE[o]}</span>
                    </span>
                    {o === value && <P.Check size={12} className="shrink-0 text-icon-default" />}
                  </button>
                ))}
              </div>
            ))}
            {!groups.length && <p className="px-2.5 py-2 text-interface-body-s-light text-text-default-subdued">No operator matches “{q}”</p>}
          </div>
          <p className="border-t border-stroke-subsection px-2.5 py-1.5 text-interface-labels-xs-light text-text-default-subdued">Showing operators for {TYPE_LABEL[type]} fields</p>
        </Menu>
      )}
    </div>
  )
}

function Options({ list, value, field, quoted, onPick, children }) {
  return (
    <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto no-scrollbar p-2">
      {Object.entries(list.reduce((g, v) => ((g[/^\d{3}$/.test(v) ? v[0] + 'XX' : ''] ||= []).push(v), g), {})).map(([k, vs]) => (
        <div key={k} className="flex flex-wrap items-center gap-1">
          {k && <span className="w-8 shrink-0 text-interface-labels-xs-normal text-text-default-subdued">{k}</span>}
          {vs.map((v) => {
            const st = valueStyle(v, field)
            return (
              <button key={v} onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(v)} style={{ ...st, outline: v === value ? '2px solid var(--color-stroke-active)' : 'none', outlineOffset: 1 }} className={`h-6 rounded px-1.5 font-mono text-code-editor-small hover:opacity-80 ${st?.background ? '' : 'bg-surface-default-underground'} ${st ? '' : 'text-text-default-regular'}`}>
                {quoted && !st ? `"${v}"` : v}
              </button>
            )
          })}
        </div>
      ))}
      {children}
    </div>
  )
}

function ValuePick({ value, options, quoted, onPick, add, field }) {
  const btn = useRef(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const x = q.trim().toLowerCase()
  const list = options.filter((o) => !x || o.toLowerCase().includes(x))
  const show = (v) => {
    const st = valueStyle(v, field)
    return <span style={st ? { ...st, padding: st.background ? '0 4px' : 0 } : undefined}>{quoted && !st ? `"${v}"` : v}</span>
  }
  const pick = (v) => {
    onPick(v)
    setOpen(false)
    setQ('')
  }
  return (
    <span className="relative shrink-0">
      {add ? (
        <button ref={btn} onClick={() => setOpen(!open)} aria-expanded={open} data-pqb-tip="Add a value" aria-label="Add a value" className={ACT}>
          <P.Plus size={14} />
        </button>
      ) : (
        <button ref={btn} onClick={() => setOpen(!open)} className={`flex h-7 min-w-[90px] items-center gap-1.5 rounded-md border px-1.5 text-left ${open ? 'border-stroke-active' : 'border-stroke-subsection hover:border-stroke-active'}`}>
          <span className={`min-w-0 flex-1 truncate ${value ? 'font-mono text-code-editor-small text-text-default-regular' : 'text-interface-body-s-normal text-text-default-disabled'}`}>{value ? show(value) : 'Pick a value'}</span>
          <P.CaretDown size={12} className="shrink-0 text-text-default-subtle" />
        </button>
      )}
      {open && (
        <Menu anchor={btn} width={field === 'data.response.statusCode' ? 420 : 300} onClose={() => setOpen(false)}>
          <div className="flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5">
            <P.MagnifyingGlass size={14} className="text-icon-default" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search values"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (list[0] || q.trim())) pick(list[0] ?? q.trim())
              }}
              className="min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
            />
          </div>
          <Options list={list} value={value} field={field} quoted={quoted} onPick={pick}>
            {!list.length && <p className="px-0.5 py-1 text-interface-body-s-light text-text-default-subdued">Enter adds “{q}”</p>}
          </Options>
        </Menu>
      )}
    </span>
  )
}

function Chips({ values, onValues, placeholder, quoted, field, options }) {
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const box = useRef(null)
  const x = draft.trim().toLowerCase()
  const list = (options || []).filter((o) => !values.includes(o) && (!x || o.toLowerCase().includes(x)))
  const add = (raw) => {
    const vals = raw.split(/[,\n]/).map((v) => v.trim().replace(/^"(.*)"$/s, '$1')).filter(Boolean)
    if (vals.length) onValues([...values, ...vals.filter((v) => !values.includes(v))])
    setDraft('')
    setOpen(false)
  }
  return (
    <span ref={box} onClick={() => (ref.current?.focus(), setOpen(true))} className="flex min-h-7 min-w-0 max-w-[420px] flex-1 cursor-text flex-wrap items-center gap-1 rounded-md border border-stroke-subsection bg-surface-default-ground px-1 py-0.5 focus-within:border-stroke-active">
      {values.map((v) => (
        <span key={v} style={valueStyle(v, field) || undefined} className="flex h-5 items-center gap-1 rounded bg-surface-default-underground pl-1.5 pr-0.5 font-mono text-code-editor-small text-text-default-regular">
          {quoted && !valueStyle(v, field) ? `"${v}"` : v}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onValues(values.filter((x) => x !== v))
            }}
            aria-label={`Remove ${v}`}
            className="grid h-4 w-4 place-items-center rounded text-icon-subtle hover:bg-surface-hover-l1-hover"
          >
            <P.X size={9} />
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={draft}
        placeholder={values.length ? '' : `${placeholder}, then Enter`}
        onFocus={() => setOpen(true)}
        onChange={(e) => (setOpen(true), e.target.value.includes(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(x && list[0] ? list[0] : draft)
          }
          if (e.key === 'Backspace' && !draft && values.length) onValues(values.slice(0, -1))
        }}
        onBlur={() => draft && add(draft)}
        className="h-5 min-w-[90px] flex-1 bg-transparent px-1 font-mono text-code-editor-small text-text-default-regular outline-none placeholder:font-sans placeholder:text-text-default-disabled"
      />
      {open && list.length > 0 && (
        <Menu anchor={box} width={field === 'data.response.statusCode' ? 420 : 300} onClose={() => setOpen(false)}>
          <Options list={list} field={field} quoted={quoted} onPick={add} />
        </Menu>
      )}
    </span>
  )
}

function Values({ cond, type, onChange }) {
  const a = arity(cond.op)
  const [one = '', two = ''] = cond.values
  const set = (values) => onChange({ values })
  const catalog = CATALOG[cond.field] || (type === 'boolean' ? ['true', 'false'] : null)
  const quoted = type !== 'number' && type !== 'boolean' && type !== 'latency' && !['<', '<=', '>', '>='].includes(cond.op)
  const placeholder = cond.field === 'data.response.statusCode' ? '404' : type === 'number' || type === 'latency' ? 'Number' : type === 'ip' ? '10.0.4.12' : type === 'boolean' ? 'true or false' : 'Value'
  const hint = (t) => <span className="pl-0.5 text-interface-labels-xs-light text-text-default-subdued">{t}</span>
  const textOp = ['CONTAINS', 'NOT CONTAINS', '~', '!~'].includes(cond.op)
  if (a === 'none') return <span className="flex h-7 items-center px-1 text-interface-labels-xs-light text-text-default-subdued">no value needed</span>
  if (a === 'two')
    return (
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <input value={one} onChange={(e) => set([e.target.value, two])} inputMode="decimal" placeholder="From" className={`${INPUT} w-24`} />
        <span className="text-interface-body-s-normal text-text-default-subtle">and</span>
        <input value={two} onChange={(e) => set([one, e.target.value])} inputMode="decimal" placeholder="To" className={`${INPUT} w-24`} />
        {hint(type === 'latency' ? 'ms · both ends included' : 'both ends included')}
      </span>
    )
  if (a === 'list')
    return (
      <>
        <Chips values={cond.values} onValues={set} placeholder={placeholder} quoted={quoted} field={cond.field} options={catalog} />
        {catalog && <ValuePick add options={catalog.filter((v) => !cond.values.includes(v))} quoted={quoted} field={cond.field} onPick={(v) => set([...cond.values, v])} />}
      </>
    )
  if (a === 'ip')
    return (
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <input value={cond.values.join(', ')} onChange={(e) => set(e.target.value.split(',').map((v) => v.trim()))} placeholder="10.0.0.0/24 or 10.0.0.1-10.0.0.50, comma for several" className={`${INPUT} w-full max-w-[340px]`} />
      </span>
    )
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
      {catalog && (cond.op === '==' || cond.op === '!=') ? (
        <ValuePick value={one} options={catalog} quoted={quoted} field={cond.field} onPick={(v) => set([v])} />
      ) : quoted ? (
        <span className="flex h-7 w-[220px] min-w-0 items-center rounded-md border border-stroke-subsection font-mono text-code-editor-small hover:border-stroke-section focus-within:border-stroke-active">
          <span className="pl-1.5 text-text-default-subdued">{cond.op === '~' || cond.op === '!~' ? '/' : '"'}</span>
          <input value={one} onChange={(e) => set([e.target.value.replace(/^"(.*)"$/s, '$1')])} placeholder={placeholder} spellCheck={false} className="h-full min-w-0 flex-1 bg-transparent px-0.5 text-text-default-regular outline-none placeholder:font-sans placeholder:text-text-default-disabled" />
          <span className="pr-1.5 text-text-default-subdued">{cond.op === '~' || cond.op === '!~' ? '/' : '"'}</span>
        </span>
      ) : (
        <input value={one} onChange={(e) => set([e.target.value])} inputMode={type === 'boolean' ? undefined : 'decimal'} placeholder={placeholder} className={`${INPUT} w-[180px]`} />
      )}
      {type === 'latency' && hint('ms')}
      {textOp && (
        <button onClick={() => onChange({ ci: !cond.ci })} aria-pressed={cond.ci} data-pqb-tip={cond.ci ? 'Any case (click for exact case)' : 'Exact case (click for any case)'} className={`h-6 shrink-0 rounded px-1.5 font-mono text-interface-labels-xs-normal font-semibold ${cond.ci ? 'bg-surface-color-blue-default-subtle text-text-color-blue' : 'text-text-default-subtle hover:bg-surface-hover-l1-hover'}`}>
          Aa
        </button>
      )}
    </span>
  )
}

function RowActions({ item, depth, parentJoin, onRoot }) {
  const btn = useRef(null)
  const [open, setOpen] = useState(false)
  const row = 'flex h-8 w-full items-center gap-2 px-2.5 text-left text-interface-body-s-normal text-text-default-regular hover:bg-surface-hover-l1-hover'
  return (
    <span className="flex shrink-0 items-center">
      {depth < 2 && item.kind === 'cond' && (
        <button onClick={() => onRoot((r) => update(r, item.id, (c) => ({ kind: 'group', id: newCond().id, join: parentJoin === 'AND' ? 'OR' : 'AND', not: false, items: [c, newCond()] })))} data-pqb-tip="Branch" aria-label="Branch from this condition" className={ACT}>
          <P.TreeView size={14} />
        </button>
      )}
      <button onClick={() => onRoot((r) => tidy(remove(r, item.id), true))} data-pqb-tip={item.kind === 'group' ? 'Remove group' : 'Remove condition'} aria-label="Remove" className={`${ACT} hover:text-text-color-red`}>
        <P.Trash size={14} />
      </button>
      <span className="relative">
        <button ref={btn} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="More" data-pqb-tip="More" className={ACT}>
          <P.DotsThreeVertical size={16} weight="bold" />
        </button>
        {open && (
          <Menu anchor={btn} width={200} onClose={() => setOpen(false)}>
            <div className="py-1">
              <button
                onClick={() => {
                  onRoot((r) => insertAfter(r, item.id, clone(item)))
                  setOpen(false)
                }}
                className={row}
              >
                <P.Copy size={14} className="text-icon-default" />
                Duplicate
              </button>
              <button
                onClick={() => {
                  onRoot((r) => update(r, item.id, (x) => ({ ...x, not: !x.not })))
                  setOpen(false)
                }}
                className={row}
              >
                <P.Prohibit size={14} className="text-icon-default" />
                {item.not ? 'Remove NOT' : 'Negate with NOT'}
              </button>
            </div>
          </Menu>
        )}
      </span>
    </span>
  )
}

const NotChip = ({ onClick }) => (
  <button onClick={onClick} data-pqb-tip="Negated, click to remove NOT" className="mt-[3px] h-[22px] shrink-0 rounded bg-surface-color-red-default-subtle px-1.5 font-mono text-code-editor-small font-semibold text-text-color-red">
    NOT
  </button>
)

function Row({ cond, depth, parentJoin, schema, errors, onRoot }) {
  const type = cond.field ? typeOf(cond.field, schema) : 'string'
  const set = (patch) => onRoot((r) => update(r, cond.id, (c) => ({ ...c, ...patch })))
  const err = errors.get(cond.id)
  return (
    <div className="group/row">
      <div className="inline-flex max-w-full items-start gap-1.5">
        {cond.not && <NotChip onClick={() => set({ not: false })} />}
        <FieldPicker
          value={cond.field}
          schema={schema}
          autoOpen={!cond.field}
          onPick={(f) => {
            const t = typeOf(f, schema)
            const ops = opsFor({ type: t })
            const keep = ops.includes(cond.op) && t === type
            set({ field: f, op: keep ? cond.op : t === 'latency' ? '>' : '==', values: keep ? cond.values : [] })
          }}
        />
        {cond.field && (
          <OpPicker
            value={cond.op}
            type={type}
            onPick={(o) => {
              const from = arity(cond.op)
              const to = arity(o)
              set({ op: o, values: from === to ? cond.values : to === 'none' ? [] : to === 'two' ? [cond.values[0] ?? '', ''] : cond.values.slice(0, to === 'list' || to === 'ip' ? 99 : 1) })
            }}
          />
        )}
        {cond.field && <Values cond={cond} type={type} onChange={set} />}
        <RowActions item={cond} depth={depth} parentJoin={parentJoin} onRoot={onRoot} />
      </div>
      {err && (
        <p className="flex items-center gap-1.5 pt-0.5 text-interface-labels-xs-normal text-text-color-red">
          <P.Warning size={12} weight="fill" className="shrink-0" />
          {err}
        </p>
      )}
    </div>
  )
}

function Group({ group, depth, schema, errors, onRoot, parentJoin }) {
  return (
    <div className="relative pl-6">
      <span aria-hidden="true" className={`absolute left-2 ${depth > 0 ? 'top-[14px]' : 'top-0'} bottom-[9px] w-px bg-stroke-section`} />
      {depth > 0 && (
        <div className="group/row -ml-6 mb-1 flex items-center gap-1.5 pl-6">
          {group.not && <NotChip onClick={() => onRoot((r) => update(r, group.id, (g) => ({ ...g, not: false })))} />}
          <span className="text-interface-labels-xs-light text-text-default-subdued">Group</span>
          <RowActions item={group} depth={depth} parentJoin={parentJoin} onRoot={onRoot} />
        </div>
      )}
      <ul className="flex flex-col">
        {group.items.map((item, i) => (
          <li key={item.id}>
            {i > 0 && (
              <button onClick={() => onRoot((r) => update(r, item.id, (x) => ({ ...x, j: (item.j || group.join) === 'AND' ? 'OR' : 'AND' })))} data-pqb-tip={`Switch to ${(item.j || group.join) === 'AND' ? 'OR' : 'AND'}`} className="relative -ml-6 my-1 block h-5 rounded bg-surface-color-blue-default-subtle px-1.5 text-interface-labels-xs-normal font-semibold text-text-color-blue hover:bg-surface-color-blue-hover-subtle">
                {item.j || group.join}
              </button>
            )}
            <div className="relative">
              <span aria-hidden="true" className="absolute -left-4 top-[14px] h-px w-4 bg-stroke-section" />
              {item.kind === 'cond' ? (
                <Row cond={item} depth={depth} parentJoin={item.j || group.join} schema={schema} errors={errors} onRoot={onRoot} />
              ) : (
                <div className="-ml-2">
                  <Group group={item} depth={depth + 1} schema={schema} errors={errors} onRoot={onRoot} parentJoin={item.j || group.join} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <span className="relative -ml-6 mt-1 block h-[18px]">
        <button onClick={() => onRoot((r) => (r.id === group.id ? { ...r, items: [...r.items, { ...newCond(), j: group.items[group.items.length - 1]?.j }] } : update(r, group.id, (g) => ({ ...g, items: [...g.items, { ...newCond(), j: group.items[group.items.length - 1]?.j }] }))))} aria-label="Add a condition" data-pqb-tip="Add a condition" className="ml-[1px] grid h-[15px] w-[15px] place-items-center rounded-full border border-stroke-section bg-surface-default-l1 text-icon-subtle hover:border-stroke-active hover:text-text-color-blue">
          <P.Plus size={9} weight="bold" />
        </button>
      </span>
    </div>
  )
}

function CountRow({ count, schema, onChange, onRemove }) {
  const set = (patch) => onChange({ ...count, ...patch })
  return (
    <div className="group/row mt-2 flex flex-wrap items-start gap-1.5 border-t border-stroke-subsection pl-6 pt-2">
      <span className="mt-[3px] flex h-[22px] items-center rounded bg-surface-color-blue-default-subtle px-1.5 font-mono text-code-editor-small font-semibold text-text-color-purple">COUNT()</span>
      <select value={count.op} onChange={(e) => set({ op: e.target.value })} className={`${INPUT} w-16`}>
        {['>', '>=', '<', '<=', '=='].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <input value={count.n} onChange={(e) => set({ n: e.target.value })} inputMode="numeric" placeholder="Number" className={`${INPUT} w-24`} />
      <span className="flex h-7 items-center text-interface-body-s-normal text-text-default-subtle">within</span>
      <input value={count.within} onChange={(e) => set({ within: e.target.value })} placeholder="time range" className={`${INPUT} w-24`} />
      <span className="flex h-7 items-center text-interface-body-s-normal text-text-default-subtle">group by</span>
      <FieldPicker value={count.by} schema={schema} placeholder="Whole result" onPick={(f) => set({ by: f === '@latency' ? '' : f })} />
      {count.by && (
        <button onClick={() => set({ by: '' })} data-pqb-tip="Count the whole result" aria-label="Remove group by" className={ACT}>
          <P.X size={12} />
        </button>
      )}
      <button onClick={onRemove} data-pqb-tip="Remove COUNT()" aria-label="Remove COUNT()" className={`${ACT} hover:text-text-color-red`}>
        <P.Trash size={14} />
      </button>
    </div>
  )
}

export default function Builder({ text, schema, onApply, onCancel }) {
  const start = useMemo(() => {
    const p = parse(text, schema)
    const ok = text.trim() && !p.errors.length
    const tree = toTree(ok ? p.ast : null)
    if (!tree.items.length && !tree.count) tree.items = [newCond()]
    return { tree, replaced: !!text.trim() && !ok }
  }, [])
  const [root, setRoot] = useState(start.tree)
  const [show, setShow] = useState(false)
  const onRoot = (fn) => setRoot((r) => fn(r))
  const out = useMemo(() => fromTree(root, schema), [root, schema])
  const parsed = useMemo(() => (out ? parse(out, schema) : null), [out, schema])
  const clean = parsed && !parsed.errors.length ? format(parsed.ast) : out
  const incomplete = useMemo(() => {
    let n = 0
    const walk = (g) => g.items.forEach((x) => (x.kind === 'group' ? walk(x) : x.field && !isComplete(x) && n++))
    walk(root)
    if (root.count && !String(root.count.n).trim()) n++
    return n
  }, [root])
  const error = parsed?.errors[0]?.msg
  const blocked = incomplete > 0 || !!error
  return (
    <div className="border-t border-stroke-subsection" onMouseDown={(e) => e.stopPropagation()}>
      <div className="max-h-[380px] min-h-[96px] overflow-auto scroll-thin bg-surface-default-l1 px-3 pb-2 pt-3">
        {start.replaced && <p className="mb-2 text-interface-labels-xs-light text-text-default-subdued">The query in the bar has an error, so the builder starts empty. Apply replaces it.</p>}
        <Group group={root} depth={0} schema={schema} errors={new Map()} onRoot={onRoot} />
        {root.count ? (
          <CountRow count={root.count} schema={schema} onChange={(c) => setRoot({ ...root, count: c })} onRemove={() => setRoot({ ...root, count: null })} />
        ) : (
          <button onClick={() => setRoot({ ...root, count: { op: '>', n: '', within: '', by: '' } })} className="mt-1 h-6 rounded px-1.5 text-interface-labels-xs-normal text-text-color-blue hover:bg-surface-hover-l1-hover">
            Add COUNT() threshold
          </button>
        )}
      </div>
      {show && <div className="border-t border-stroke-subsection px-3 py-2">
        <pre style={{ maxHeight: 200 }} className="overflow-auto scroll-thin whitespace-pre-wrap break-all font-mono text-code-editor-small leading-5 text-text-default-subdued">{clean ? paint(parsed && !parsed.errors.length ? format(parsed.ast, null, true) : clean, schema) : 'No filter'}</pre>
      </div>}
      <div className="flex items-center gap-2 border-t border-stroke-subsection px-3 py-2">
        {incomplete > 0 ? (
          <span className="flex min-w-0 items-center gap-1.5 text-interface-labels-xs-normal text-text-color-red">
            <P.Warning size={12} weight="fill" className="shrink-0" />
            {incomplete === 1 ? 'Finish 1 condition to run' : `Finish ${incomplete} conditions to run`}
          </span>
        ) : error ? (
          <span className="flex min-w-0 items-center gap-1.5 truncate text-interface-labels-xs-normal text-text-color-red">
            <P.Warning size={12} weight="fill" className="shrink-0" />
            {error}
          </span>
        ) : null}
        <span className="ml-auto" />
        <button onClick={() => setShow(!show)} aria-pressed={show} className="h-6 shrink-0 rounded-[5px] border border-stroke-subsection bg-surface-default-ground px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-hover-l1-hover">
          {show ? 'Hide query' : 'Show query'}
        </button>
        <button onClick={onCancel} className="h-6 shrink-0 rounded-[5px] border border-stroke-subsection bg-surface-default-ground px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-hover-l1-hover">
          Cancel
        </button>
        <button disabled={blocked} onClick={() => onApply(clean || '')} className="h-6 shrink-0 rounded-[5px] border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50">
          Apply & run
        </button>
      </div>
    </div>
  )
}
