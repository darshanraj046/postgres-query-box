import {
  BUILD_OPS,
  LATENCY,
  LAT_FIELD,
  METHODS,
  OP_INFO,
  STATUS_CODES,
  TYPE_LABEL,
  arity,
  buildSchema,
  context,
  evaluate,
  format,
  fromTree,
  ipToBig,
  isComplete,
  newCond,
  opsFor,
  parse,
  parseRange,
  schemaFromFields,
  toTree,
  tokenize,
  validate
} from "./chunk-35VS6GCS.js";

// src/react/PostgresQueryBox.jsx
import { forwardRef, useImperativeHandle, useRef as useRef4, useState as useState4 } from "react";
import { BookmarksSimple, CaretDown as CaretDown2, Play } from "@phosphor-icons/react";

// src/react/QueryBox.jsx
import { useEffect as useEffect2, useLayoutEffect, useMemo as useMemo2, useRef as useRef2, useState as useState2 } from "react";
import { Funnel, X as X2, Copy as Copy2, TreeStructure, TextT as TextT2, Hash as Hash2, ToggleLeft as ToggleLeft2, Globe as Globe2, Timer as Timer2, Warning as Warning2 } from "@phosphor-icons/react";

// src/react/Builder.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import * as P from "@phosphor-icons/react";

// src/react/colors.js
var VERB = { GET: "#147af3", POST: "#2fb880", PUT: "#b07500", PATCH: "#9d57f4", DELETE: "#ea3829", OPTIONS: "#626978", HEAD: "#626978", TRACE: "#626978", CONNECT: "#626978", QUERY: "#626978" };
var TONE = { 1: ["#147af3", "#e0f2ff"], 2: ["#00653e", "#cef8e0"], 3: ["#4046ca", "#d3d5ff"], 4: ["#b40000", "#ffcdc3"], 5: ["#cb5d00", "#ffeccc"] };
var valueStyle = (v, field) => {
  const s = String(v);
  if ((!field || field === "data.request.verb") && VERB[s]) return { color: VERB[s], fontWeight: 600 };
  const t = (!field || field === "data.response.statusCode") && /^\d{3}$/.test(s) && TONE[s[0]];
  return t ? { color: t[0], background: t[1], boxShadow: "inset 0 0 0 1px #cdd2dd", borderRadius: 2 } : null;
};

// src/react/Builder.jsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var TYPE_ICON = { string: P.TextT, numtext: P.TextT, ip: P.Globe, number: P.Hash, boolean: P.ToggleLeft, latency: P.Timer };
var EXAMPLE = {
  "==": '"GET"',
  "!=": '"200"',
  ANYONE: '["POST", "PUT"]',
  NONEOF: '["GET", "HEAD"]',
  "<": "1024",
  "<=": "5000",
  ">": "399",
  ">=": "500",
  BETWEEN: "200 AND 299",
  CONTAINS: '"agent-registry"',
  "NOT CONTAINS": '"node"',
  "~": '"^/api/v1/"',
  "!~": '"/health$"',
  PRESENT: "no value",
  ABSENT: "no value",
  "IP IN_RANGE": '"10.0.0.0/8"',
  "IP NOT_IN_RANGE": '["10.0.0.0/8"]'
};
var HINT = { "data.request.verb": "Method", "data.response.statusCode": "Status code", "data.request.path": "Path", "data.request.hostname": "Host" };
var CATALOG = { "data.request.verb": METHODS, "data.response.statusCode": STATUS_CODES };
var INPUT = "h-7 min-w-0 rounded-md border border-stroke-subsection bg-transparent px-1.5 hover:border-stroke-section font-mono text-code-editor-small text-text-default-regular outline-none placeholder:font-sans placeholder:text-text-default-disabled focus:border-stroke-active";
var ACT = "grid h-7 w-7 place-items-center rounded text-icon-default hover:bg-surface-hover-l1-hover";
var typeOf = (field, schema) => {
  var _a;
  return field === "@latency" ? "latency" : ((_a = schema.byPath[field]) == null ? void 0 : _a.type) || "string";
};
var update = (g, id, fn) => ({ ...g, items: g.items.map((x) => x.id === id ? fn(x) : x.kind === "group" ? update(x, id, fn) : x) });
var remove = (g, id) => ({ ...g, items: g.items.filter((x) => x.id !== id).map((x) => x.kind === "group" ? remove(x, id) : x) });
var tidy = (g, top) => {
  const items = g.items.map((x) => x.kind === "group" ? tidy(x, false) : x).filter((x) => x && (x.kind !== "group" || x.items.length));
  if (!top && items.length === 1 && !g.not) return items[0];
  return { ...g, items };
};
var insertAfter = (g, id, item) => {
  const i = g.items.findIndex((x) => x.id === id);
  if (i >= 0) return { ...g, items: [...g.items.slice(0, i + 1), item, ...g.items.slice(i + 1)] };
  return { ...g, items: g.items.map((x) => x.kind === "group" ? insertAfter(x, id, item) : x) };
};
var clone = (x) => x.kind === "group" ? { ...x, id: newCond().id, items: x.items.map(clone) } : { ...x, id: newCond().id, values: [...x.values] };
function Menu({ anchor, width, onClose, children }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const [pos, setPos] = useState(null);
  useEffect(() => {
    const onClose2 = () => close.current();
    const r = anchor.current.getBoundingClientRect();
    const below = r.bottom + 360 < window.innerHeight;
    setPos({ left: Math.min(r.left, window.innerWidth - width - 8), top: below ? r.bottom + 4 : void 0, bottom: below ? void 0 : window.innerHeight - r.top + 4 });
    const out = (e) => {
      var _a, _b;
      return !((_a = ref.current) == null ? void 0 : _a.contains(e.target)) && !((_b = anchor.current) == null ? void 0 : _b.contains(e.target)) && onClose2();
    };
    const key = (e) => e.key === "Escape" && onClose2();
    const scroll = (e) => {
      var _a;
      return !((_a = ref.current) == null ? void 0 : _a.contains(e.target)) && onClose2();
    };
    document.addEventListener("mousedown", out, true);
    document.addEventListener("keydown", key);
    document.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("mousedown", out, true);
      document.removeEventListener("keydown", key);
      document.removeEventListener("scroll", scroll, true);
    };
  }, []);
  if (!pos) return null;
  return /* @__PURE__ */ jsx("div", { ref, style: { position: "fixed", zIndex: 70, width, ...pos }, className: "rounded-md border border-stroke-subsection bg-surface-default-l1 shadow-e300", children });
}
function FieldPicker({ value, schema, onPick, autoOpen, placeholder = "Add field" }) {
  const btn = useRef(null);
  const [open, setOpen] = useState(autoOpen);
  const [q, setQ] = useState("");
  const x = q.trim().toLowerCase();
  const common = [...schema.fields.filter((f) => f.group === "Common").map((f) => ({ path: f.path, hint: HINT[f.path] || "" })), { path: "@latency", hint: "Latency in ms" }].filter((c) => !x || (c.path === "@latency" ? LATENCY : c.path).toLowerCase().includes(x) || c.hint.toLowerCase().includes(x));
  const all = schema.fields.filter((f) => f.group !== "Common" && (!x || f.path.toLowerCase().includes(x))).slice(0, 80);
  const pick = (p) => {
    onPick(p);
    setOpen(false);
    setQ("");
  };
  const label = value === "@latency" ? LATENCY : value;
  return /* @__PURE__ */ jsxs("div", { className: "relative min-w-0 shrink", children: [
    /* @__PURE__ */ jsx("button", { ref: btn, onClick: () => setOpen(!open), "aria-expanded": open, "data-pqb-tip": value ? void 0 : "Pick a field", className: `flex h-7 max-w-[440px] items-center rounded-md border text-left ${value ? `px-1 ${open ? "border-stroke-active bg-surface-default-ground" : "border-transparent hover:bg-surface-hover-l1-hover"}` : `border-dashed bg-surface-default-ground px-2 ${open ? "border-stroke-active" : "border-stroke-section hover:border-stroke-active"}`}`, children: /* @__PURE__ */ jsx("span", { className: `min-w-0 truncate text-interface-body-s-normal ${value ? "font-mono text-base-blue-1100" : "text-text-default-disabled"}`, children: value ? label : placeholder }) }),
    open && /* @__PURE__ */ jsxs(Menu, { anchor: btn, width: 420, onClose: () => setOpen(false), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5", children: [
        /* @__PURE__ */ jsx(P.MagnifyingGlass, { size: 14, className: "text-icon-default" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            autoFocus: true,
            value: q,
            onChange: (e) => setQ(e.target.value),
            placeholder: `Search ${schema.fields.length} fields`,
            onKeyDown: (e) => {
              var _a, _b;
              if (e.key === "Enter") {
                const p = ((_a = common[0]) == null ? void 0 : _a.path) ?? ((_b = all[0]) == null ? void 0 : _b.path);
                if (p) pick(p);
              }
            },
            className: "min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-h-[280px] overflow-y-auto no-scrollbar pb-1", children: [
        [["Common", common], ...Object.entries(all.reduce((g, f) => ((g[f.group] ||= []).push(f), g), {}))].filter(([, list]) => list.length).map(([g, list]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { style: { position: "sticky", top: 0, zIndex: 1 }, className: "flex items-center justify-between gap-3 bg-surface-default-l1 px-2.5 pb-0.5 pt-1.5 text-interface-titles-caption text-text-default-subdued", children: [
            /* @__PURE__ */ jsx("span", { className: "min-w-0 truncate", children: `FIELDS / ${g}`.toUpperCase() }),
            /* @__PURE__ */ jsx("span", { className: "shrink-0 text-interface-labels-xs-normal text-text-default-subtle", children: list.length })
          ] }),
          g === "Common" ? list.map((c) => {
            var _a;
            const Icon = TYPE_ICON[c.path === "@latency" ? "latency" : (_a = schema.byPath[c.path]) == null ? void 0 : _a.type] || P.TextT;
            return /* @__PURE__ */ jsxs("button", { onClick: () => pick(c.path), className: "flex w-full items-center gap-2 px-2.5 py-1 text-left hover:bg-surface-hover-l1-hover", children: [
              /* @__PURE__ */ jsx(Icon, { size: 12, className: "shrink-0 text-icon-subtle" }),
              /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate font-mono text-code-editor-small text-text-default-regular", children: c.path === "@latency" ? LATENCY : c.path }),
              value === c.path && /* @__PURE__ */ jsx(P.Check, { size: 12, className: "shrink-0 text-icon-default" })
            ] }, c.path);
          }) : list.map((f) => {
            const Icon = TYPE_ICON[f.type] || P.TextT;
            return /* @__PURE__ */ jsxs("button", { onClick: () => pick(f.path), className: "flex w-full items-center gap-2 px-2.5 py-1 text-left hover:bg-surface-hover-l1-hover", children: [
              /* @__PURE__ */ jsx(Icon, { size: 12, className: "shrink-0 text-icon-subtle" }),
              /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate font-mono text-code-editor-small text-text-default-regular", children: f.path }),
              value === f.path && /* @__PURE__ */ jsx(P.Check, { size: 12, className: "shrink-0 text-icon-default" })
            ] }, f.path);
          })
        ] }, g)),
        !common.length && !all.length && /* @__PURE__ */ jsxs("p", { className: "px-2.5 py-2 text-interface-body-s-light text-text-default-subdued", children: [
          "No field matches \u201C",
          q,
          "\u201D"
        ] })
      ] })
    ] })
  ] });
}
function OpPicker({ value, type, onPick }) {
  const btn = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const allowed = opsFor({ type });
  const x = q.trim().toLowerCase();
  const groups = BUILD_OPS.map(([name, ops]) => [name, ops.filter((o) => allowed.includes(o) && (!x || `${o} ${OP_INFO[o]}`.toLowerCase().includes(x)))]).filter(([, ops]) => ops.length);
  const pick = (o) => {
    onPick(o);
    setOpen(false);
    setQ("");
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
    /* @__PURE__ */ jsx("button", { ref: btn, onClick: () => setOpen(!open), "aria-expanded": open, "data-pqb-tip": OP_INFO[value], className: `mt-[3px] flex h-[22px] min-w-[22px] items-center justify-center rounded px-1.5 bg-surface-color-blue-default-subtle hover:bg-surface-color-blue-hover-subtle ${open ? "ring-1 ring-stroke-active" : ""}`, children: /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap font-mono text-code-editor-small font-semibold text-text-color-blue", children: value }) }),
    open && /* @__PURE__ */ jsxs(Menu, { anchor: btn, width: 320, onClose: () => setOpen(false), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5", children: [
        /* @__PURE__ */ jsx(P.MagnifyingGlass, { size: 14, className: "text-icon-default" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            autoFocus: true,
            value: q,
            onChange: (e) => setQ(e.target.value),
            placeholder: "Search operators",
            onKeyDown: (e) => e.key === "Enter" && groups[0] && pick(groups[0][1][0]),
            className: "min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "max-h-[320px] overflow-y-auto no-scrollbar py-1", children: [
        groups.map(([name, ops]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "px-2.5 pb-0.5 pt-1.5 text-interface-titles-caption text-text-default-subdued", children: name.toUpperCase() }),
          ops.map((o) => /* @__PURE__ */ jsxs("button", { onClick: () => pick(o), className: `flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-surface-hover-l1-hover ${o === value ? "bg-surface-color-blue-default-subtle" : ""}`, children: [
            /* @__PURE__ */ jsx("span", { className: "w-[72px] shrink-0 truncate rounded bg-surface-default-underground px-1 py-0.5 text-center font-mono text-code-editor-small text-text-default-subtle", children: o.replace("IP ", "") }),
            /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 flex-1 flex-col", children: [
              /* @__PURE__ */ jsx("span", { className: "text-interface-body-s-normal text-text-default-regular", children: OP_INFO[o] }),
              /* @__PURE__ */ jsx("span", { className: "truncate font-mono text-interface-labels-xs-light text-text-default-subdued", children: EXAMPLE[o] })
            ] }),
            o === value && /* @__PURE__ */ jsx(P.Check, { size: 12, className: "shrink-0 text-icon-default" })
          ] }, o))
        ] }, name)),
        !groups.length && /* @__PURE__ */ jsxs("p", { className: "px-2.5 py-2 text-interface-body-s-light text-text-default-subdued", children: [
          "No operator matches \u201C",
          q,
          "\u201D"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "border-t border-stroke-subsection px-2.5 py-1.5 text-interface-labels-xs-light text-text-default-subdued", children: [
        "Showing operators for ",
        TYPE_LABEL[type],
        " fields"
      ] })
    ] })
  ] });
}
function ValuePick({ value, options, quoted, onPick, add, field }) {
  const btn = useRef(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const x = q.trim().toLowerCase();
  const list = options.filter((o) => !x || o.toLowerCase().includes(x));
  const show = (v) => {
    const st = valueStyle(v, field);
    return /* @__PURE__ */ jsx("span", { style: st ? { ...st, padding: st.background ? "0 4px" : 0 } : void 0, children: quoted && !st ? `"${v}"` : v });
  };
  const pick = (v) => {
    onPick(v);
    setOpen(false);
    setQ("");
  };
  return /* @__PURE__ */ jsxs("span", { className: "relative shrink-0", children: [
    add ? /* @__PURE__ */ jsx("button", { ref: btn, onClick: () => setOpen(!open), "aria-expanded": open, "data-pqb-tip": "Add a value", "aria-label": "Add a value", className: ACT, children: /* @__PURE__ */ jsx(P.Plus, { size: 14 }) }) : /* @__PURE__ */ jsxs("button", { ref: btn, onClick: () => setOpen(!open), className: `flex h-7 min-w-[90px] items-center gap-1.5 rounded-md border px-1.5 text-left ${open ? "border-stroke-active" : "border-stroke-subsection hover:border-stroke-active"}`, children: [
      /* @__PURE__ */ jsx("span", { className: `min-w-0 flex-1 truncate ${value ? "font-mono text-code-editor-small text-text-default-regular" : "text-interface-body-s-normal text-text-default-disabled"}`, children: value ? show(value) : "Pick a value" }),
      /* @__PURE__ */ jsx(P.CaretDown, { size: 12, className: "shrink-0 text-text-default-subtle" })
    ] }),
    open && /* @__PURE__ */ jsxs(Menu, { anchor: btn, width: field === "data.response.statusCode" ? 420 : 300, onClose: () => setOpen(false), children: [
      /* @__PURE__ */ jsxs("div", { className: "flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5", children: [
        /* @__PURE__ */ jsx(P.MagnifyingGlass, { size: 14, className: "text-icon-default" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            autoFocus: true,
            value: q,
            onChange: (e) => setQ(e.target.value),
            placeholder: "Search values",
            onKeyDown: (e) => {
              if (e.key === "Enter" && (list[0] || q.trim())) pick(list[0] ?? q.trim());
            },
            className: "min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex max-h-[280px] flex-col gap-1 overflow-y-auto no-scrollbar p-2", children: [
        Object.entries(list.reduce((g, v) => ((g[/^\d{3}$/.test(v) ? v[0] + "XX" : ""] ||= []).push(v), g), {})).map(([k, vs]) => /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
          k && /* @__PURE__ */ jsx("span", { className: "w-8 shrink-0 text-interface-labels-xs-normal text-text-default-subdued", children: k }),
          vs.map((v) => {
            const st = valueStyle(v, field);
            return /* @__PURE__ */ jsx("button", { onClick: () => pick(v), style: { ...st, outline: v === value ? "2px solid var(--color-stroke-active)" : "none", outlineOffset: 1 }, className: `h-6 rounded px-1.5 font-mono text-code-editor-small hover:opacity-80 ${(st == null ? void 0 : st.background) ? "" : "bg-surface-default-underground"} ${st ? "" : "text-text-default-regular"}`, children: quoted && !st ? `"${v}"` : v }, v);
          })
        ] }, k)),
        !list.length && /* @__PURE__ */ jsxs("p", { className: "px-0.5 py-1 text-interface-body-s-light text-text-default-subdued", children: [
          "Enter adds \u201C",
          q,
          "\u201D"
        ] })
      ] })
    ] })
  ] });
}
function Chips({ values, onValues, placeholder, quoted, field }) {
  const [draft, setDraft] = useState("");
  const ref = useRef(null);
  const add = (raw) => {
    const vals = raw.split(/[,\n]/).map((v) => v.trim().replace(/^"(.*)"$/s, "$1")).filter(Boolean);
    if (vals.length) onValues([...values, ...vals.filter((v) => !values.includes(v))]);
    setDraft("");
  };
  return /* @__PURE__ */ jsxs("span", { onClick: () => {
    var _a;
    return (_a = ref.current) == null ? void 0 : _a.focus();
  }, className: "flex min-h-7 min-w-0 max-w-[420px] flex-1 cursor-text flex-wrap items-center gap-1 rounded-md border border-stroke-subsection bg-surface-default-ground px-1 py-0.5 focus-within:border-stroke-active", children: [
    values.map((v) => /* @__PURE__ */ jsxs("span", { style: valueStyle(v, field) || void 0, className: "flex h-5 items-center gap-1 rounded bg-surface-default-underground pl-1.5 pr-0.5 font-mono text-code-editor-small text-text-default-regular", children: [
      quoted && !valueStyle(v, field) ? `"${v}"` : v,
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            onValues(values.filter((x) => x !== v));
          },
          "aria-label": `Remove ${v}`,
          className: "grid h-4 w-4 place-items-center rounded text-icon-subtle hover:bg-surface-hover-l1-hover",
          children: /* @__PURE__ */ jsx(P.X, { size: 9 })
        }
      )
    ] }, v)),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref,
        value: draft,
        placeholder: values.length ? "" : `${placeholder}, then Enter`,
        onChange: (e) => e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          }
          if (e.key === "Backspace" && !draft && values.length) onValues(values.slice(0, -1));
        },
        onBlur: () => draft && add(draft),
        className: "h-5 min-w-[90px] flex-1 bg-transparent px-1 font-mono text-code-editor-small text-text-default-regular outline-none placeholder:font-sans placeholder:text-text-default-disabled"
      }
    )
  ] });
}
function Values({ cond, type, onChange }) {
  const a = arity(cond.op);
  const [one = "", two = ""] = cond.values;
  const set = (values) => onChange({ values });
  const catalog = CATALOG[cond.field] || (type === "boolean" ? ["true", "false"] : null);
  const quoted = type !== "number" && type !== "boolean" && type !== "latency" && !["<", "<=", ">", ">="].includes(cond.op);
  const placeholder = cond.field === "data.response.statusCode" ? "404" : type === "number" || type === "latency" ? "Number" : type === "ip" ? "10.0.4.12" : type === "boolean" ? "true or false" : "Value";
  const hint = (t) => /* @__PURE__ */ jsx("span", { className: "pl-0.5 text-interface-labels-xs-light text-text-default-subdued", children: t });
  const textOp = ["CONTAINS", "NOT CONTAINS", "~", "!~"].includes(cond.op);
  if (a === "none") return /* @__PURE__ */ jsx("span", { className: "flex h-7 items-center px-1 text-interface-labels-xs-light text-text-default-subdued", children: "no value needed" });
  if (a === "two")
    return /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 flex-1 items-center gap-1.5", children: [
      /* @__PURE__ */ jsx("input", { value: one, onChange: (e) => set([e.target.value, two]), inputMode: "decimal", placeholder: "From", className: `${INPUT} w-24` }),
      /* @__PURE__ */ jsx("span", { className: "text-interface-body-s-normal text-text-default-subtle", children: "and" }),
      /* @__PURE__ */ jsx("input", { value: two, onChange: (e) => set([one, e.target.value]), inputMode: "decimal", placeholder: "To", className: `${INPUT} w-24` }),
      hint(type === "latency" ? "ms \xB7 both ends included" : "both ends included")
    ] });
  if (a === "list")
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Chips, { values: cond.values, onValues: set, placeholder, quoted, field: cond.field }),
      catalog && /* @__PURE__ */ jsx(ValuePick, { add: true, options: catalog.filter((v) => !cond.values.includes(v)), quoted, field: cond.field, onPick: (v) => set([...cond.values, v]) })
    ] });
  if (a === "ip")
    return /* @__PURE__ */ jsx("span", { className: "flex min-w-0 flex-1 flex-col gap-0.5", children: /* @__PURE__ */ jsx("input", { value: cond.values.join(", "), onChange: (e) => set(e.target.value.split(",").map((v) => v.trim())), placeholder: "10.0.0.0/24 or 10.0.0.1-10.0.0.50, comma for several", className: `${INPUT} w-full max-w-[340px]` }) });
  return /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 flex-1 items-center gap-1.5", children: [
    catalog && (cond.op === "==" || cond.op === "!=") ? /* @__PURE__ */ jsx(ValuePick, { value: one, options: catalog, quoted, field: cond.field, onPick: (v) => set([v]) }) : quoted ? /* @__PURE__ */ jsxs("span", { className: "flex h-7 w-[220px] min-w-0 items-center rounded-md border border-stroke-subsection font-mono text-code-editor-small hover:border-stroke-section focus-within:border-stroke-active", children: [
      /* @__PURE__ */ jsx("span", { className: "pl-1.5 text-text-default-subdued", children: cond.op === "~" || cond.op === "!~" ? "/" : '"' }),
      /* @__PURE__ */ jsx("input", { value: one, onChange: (e) => set([e.target.value.replace(/^"(.*)"$/s, "$1")]), placeholder, spellCheck: false, className: "h-full min-w-0 flex-1 bg-transparent px-0.5 text-text-default-regular outline-none placeholder:font-sans placeholder:text-text-default-disabled" }),
      /* @__PURE__ */ jsx("span", { className: "pr-1.5 text-text-default-subdued", children: cond.op === "~" || cond.op === "!~" ? "/" : '"' })
    ] }) : /* @__PURE__ */ jsx("input", { value: one, onChange: (e) => set([e.target.value]), inputMode: type === "boolean" ? void 0 : "decimal", placeholder, className: `${INPUT} w-[180px]` }),
    type === "latency" && hint("ms"),
    textOp && /* @__PURE__ */ jsx("button", { onClick: () => onChange({ ci: !cond.ci }), "aria-pressed": cond.ci, "data-pqb-tip": cond.ci ? "Any case (click for exact case)" : "Exact case (click for any case)", className: `h-6 shrink-0 rounded px-1.5 font-mono text-interface-labels-xs-normal font-semibold ${cond.ci ? "bg-surface-color-blue-default-subtle text-text-color-blue" : "text-text-default-subtle hover:bg-surface-hover-l1-hover"}`, children: "Aa" })
  ] });
}
function RowActions({ item, depth, parentJoin, onRoot }) {
  const btn = useRef(null);
  const [open, setOpen] = useState(false);
  const row = "flex h-8 w-full items-center gap-2 px-2.5 text-left text-interface-body-s-normal text-text-default-regular hover:bg-surface-hover-l1-hover";
  return /* @__PURE__ */ jsxs("span", { className: "flex shrink-0 items-center", children: [
    depth < 2 && item.kind === "cond" && /* @__PURE__ */ jsx("button", { onClick: () => onRoot((r) => update(r, item.id, (c) => ({ kind: "group", id: newCond().id, join: parentJoin === "AND" ? "OR" : "AND", not: false, items: [c, newCond()] }))), "data-pqb-tip": "Branch", "aria-label": "Branch from this condition", className: ACT, children: /* @__PURE__ */ jsx(P.TreeView, { size: 14 }) }),
    /* @__PURE__ */ jsx("button", { onClick: () => onRoot((r) => tidy(remove(r, item.id), true)), "data-pqb-tip": item.kind === "group" ? "Remove group" : "Remove condition", "aria-label": "Remove", className: `${ACT} hover:text-text-color-red`, children: /* @__PURE__ */ jsx(P.Trash, { size: 14 }) }),
    /* @__PURE__ */ jsxs("span", { className: "relative", children: [
      /* @__PURE__ */ jsx("button", { ref: btn, onClick: () => setOpen(!open), "aria-expanded": open, "aria-label": "More", "data-pqb-tip": "More", className: ACT, children: /* @__PURE__ */ jsx(P.DotsThreeVertical, { size: 16, weight: "bold" }) }),
      open && /* @__PURE__ */ jsx(Menu, { anchor: btn, width: 200, onClose: () => setOpen(false), children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              onRoot((r) => insertAfter(r, item.id, clone(item)));
              setOpen(false);
            },
            className: row,
            children: [
              /* @__PURE__ */ jsx(P.Copy, { size: 14, className: "text-icon-default" }),
              "Duplicate"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              onRoot((r) => update(r, item.id, (x) => ({ ...x, not: !x.not })));
              setOpen(false);
            },
            className: row,
            children: [
              /* @__PURE__ */ jsx(P.Prohibit, { size: 14, className: "text-icon-default" }),
              item.not ? "Remove NOT" : "Negate with NOT"
            ]
          }
        )
      ] }) })
    ] })
  ] });
}
var NotChip = ({ onClick }) => /* @__PURE__ */ jsx("button", { onClick, "data-pqb-tip": "Negated, click to remove NOT", className: "mt-[3px] h-[22px] shrink-0 rounded bg-surface-color-red-default-subtle px-1.5 font-mono text-code-editor-small font-semibold text-text-color-red", children: "NOT" });
function Row({ cond, depth, parentJoin, schema, errors, onRoot }) {
  const type = cond.field ? typeOf(cond.field, schema) : "string";
  const set = (patch) => onRoot((r) => update(r, cond.id, (c) => ({ ...c, ...patch })));
  const err = errors.get(cond.id);
  return /* @__PURE__ */ jsxs("div", { className: "group/row", children: [
    /* @__PURE__ */ jsxs("div", { className: "inline-flex max-w-full items-start gap-1.5", children: [
      cond.not && /* @__PURE__ */ jsx(NotChip, { onClick: () => set({ not: false }) }),
      /* @__PURE__ */ jsx(
        FieldPicker,
        {
          value: cond.field,
          schema,
          autoOpen: !cond.field,
          onPick: (f) => {
            const t = typeOf(f, schema);
            const ops = opsFor({ type: t });
            const keep = ops.includes(cond.op) && t === type;
            set({ field: f, op: keep ? cond.op : t === "latency" ? ">" : "==", values: keep ? cond.values : [] });
          }
        }
      ),
      cond.field && /* @__PURE__ */ jsx(
        OpPicker,
        {
          value: cond.op,
          type,
          onPick: (o) => {
            const from = arity(cond.op);
            const to = arity(o);
            set({ op: o, values: from === to ? cond.values : to === "none" ? [] : to === "two" ? [cond.values[0] ?? "", ""] : cond.values.slice(0, to === "list" || to === "ip" ? 99 : 1) });
          }
        }
      ),
      cond.field && /* @__PURE__ */ jsx(Values, { cond, type, onChange: set }),
      /* @__PURE__ */ jsx(RowActions, { item: cond, depth, parentJoin, onRoot })
    ] }),
    err && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1.5 pt-0.5 text-interface-labels-xs-normal text-text-color-red", children: [
      /* @__PURE__ */ jsx(P.Warning, { size: 12, weight: "fill", className: "shrink-0" }),
      err
    ] })
  ] });
}
function Group({ group, depth, schema, errors, onRoot, parentJoin }) {
  return /* @__PURE__ */ jsxs("div", { className: "relative pl-6", children: [
    /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: `absolute left-2 ${depth > 0 ? "top-[14px]" : "top-0"} bottom-[9px] w-px bg-stroke-section` }),
    depth > 0 && /* @__PURE__ */ jsxs("div", { className: "group/row -ml-6 mb-1 flex items-center gap-1.5 pl-6", children: [
      group.not && /* @__PURE__ */ jsx(NotChip, { onClick: () => onRoot((r) => update(r, group.id, (g) => ({ ...g, not: false }))) }),
      /* @__PURE__ */ jsx("span", { className: "text-interface-labels-xs-light text-text-default-subdued", children: "Group" }),
      /* @__PURE__ */ jsx(RowActions, { item: group, depth, parentJoin, onRoot })
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "flex flex-col", children: group.items.map((item, i) => /* @__PURE__ */ jsxs("li", { children: [
      i > 0 && /* @__PURE__ */ jsx("button", { onClick: () => onRoot((r) => update(r, item.id, (x) => ({ ...x, j: (item.j || group.join) === "AND" ? "OR" : "AND" }))), "data-pqb-tip": `Switch to ${(item.j || group.join) === "AND" ? "OR" : "AND"}`, className: "relative -ml-6 my-1 block h-5 rounded bg-surface-color-blue-default-subtle px-1.5 text-interface-labels-xs-normal font-semibold text-text-color-blue hover:bg-surface-color-blue-hover-subtle", children: item.j || group.join }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "absolute -left-4 top-[14px] h-px w-4 bg-stroke-section" }),
        item.kind === "cond" ? /* @__PURE__ */ jsx(Row, { cond: item, depth, parentJoin: item.j || group.join, schema, errors, onRoot }) : /* @__PURE__ */ jsx("div", { className: "-ml-2", children: /* @__PURE__ */ jsx(Group, { group: item, depth: depth + 1, schema, errors, onRoot, parentJoin: item.j || group.join }) })
      ] })
    ] }, item.id)) }),
    /* @__PURE__ */ jsx("span", { className: "relative -ml-6 mt-1 block h-[18px]", children: /* @__PURE__ */ jsx("button", { onClick: () => onRoot((r) => {
      var _a;
      return r.id === group.id ? { ...r, items: [...r.items, { ...newCond(), j: (_a = group.items[group.items.length - 1]) == null ? void 0 : _a.j }] } : update(r, group.id, (g) => {
        var _a2;
        return { ...g, items: [...g.items, { ...newCond(), j: (_a2 = group.items[group.items.length - 1]) == null ? void 0 : _a2.j }] };
      });
    }), "aria-label": "Add a condition", "data-pqb-tip": "Add a condition", className: "ml-[1px] grid h-[15px] w-[15px] place-items-center rounded-full border border-stroke-section bg-surface-default-l1 text-icon-subtle hover:border-stroke-active hover:text-text-color-blue", children: /* @__PURE__ */ jsx(P.Plus, { size: 9, weight: "bold" }) }) })
  ] });
}
function CountRow({ count, schema, onChange, onRemove }) {
  const set = (patch) => onChange({ ...count, ...patch });
  return /* @__PURE__ */ jsxs("div", { className: "group/row mt-2 flex flex-wrap items-start gap-1.5 border-t border-stroke-subsection pl-6 pt-2", children: [
    /* @__PURE__ */ jsx("span", { className: "mt-[3px] flex h-[22px] items-center rounded bg-surface-color-blue-default-subtle px-1.5 font-mono text-code-editor-small font-semibold text-text-color-purple", children: "COUNT()" }),
    /* @__PURE__ */ jsx("select", { value: count.op, onChange: (e) => set({ op: e.target.value }), className: `${INPUT} w-16`, children: [">", ">=", "<", "<=", "=="].map((o) => /* @__PURE__ */ jsx("option", { value: o, children: o }, o)) }),
    /* @__PURE__ */ jsx("input", { value: count.n, onChange: (e) => set({ n: e.target.value }), inputMode: "numeric", placeholder: "Number", className: `${INPUT} w-24` }),
    /* @__PURE__ */ jsx("span", { className: "flex h-7 items-center text-interface-body-s-normal text-text-default-subtle", children: "within" }),
    /* @__PURE__ */ jsx("input", { value: count.within, onChange: (e) => set({ within: e.target.value }), placeholder: "time range", className: `${INPUT} w-24` }),
    /* @__PURE__ */ jsx("span", { className: "flex h-7 items-center text-interface-body-s-normal text-text-default-subtle", children: "group by" }),
    /* @__PURE__ */ jsx(FieldPicker, { value: count.by, schema, placeholder: "Whole result", onPick: (f) => set({ by: f === "@latency" ? "" : f }) }),
    count.by && /* @__PURE__ */ jsx("button", { onClick: () => set({ by: "" }), "data-pqb-tip": "Count the whole result", "aria-label": "Remove group by", className: ACT, children: /* @__PURE__ */ jsx(P.X, { size: 12 }) }),
    /* @__PURE__ */ jsx("button", { onClick: onRemove, "data-pqb-tip": "Remove COUNT()", "aria-label": "Remove COUNT()", className: `${ACT} hover:text-text-color-red`, children: /* @__PURE__ */ jsx(P.Trash, { size: 14 }) })
  ] });
}
function Builder({ text, schema, onApply, onCancel }) {
  var _a;
  const start = useMemo(() => {
    const p = parse(text, schema);
    const ok = text.trim() && !p.errors.length;
    const tree = toTree(ok ? p.ast : null);
    if (!tree.items.length && !tree.count) tree.items = [newCond()];
    return { tree, replaced: !!text.trim() && !ok };
  }, []);
  const [root, setRoot] = useState(start.tree);
  const [show, setShow] = useState(false);
  const onRoot = (fn) => setRoot((r) => fn(r));
  const out = useMemo(() => fromTree(root, schema), [root, schema]);
  const parsed = useMemo(() => out ? parse(out, schema) : null, [out, schema]);
  const clean = parsed && !parsed.errors.length ? format(parsed.ast) : out;
  const incomplete = useMemo(() => {
    let n = 0;
    const walk = (g) => g.items.forEach((x) => x.kind === "group" ? walk(x) : x.field && !isComplete(x) && n++);
    walk(root);
    if (root.count && !String(root.count.n).trim()) n++;
    return n;
  }, [root]);
  const error = (_a = parsed == null ? void 0 : parsed.errors[0]) == null ? void 0 : _a.msg;
  const blocked = incomplete > 0 || !!error;
  return /* @__PURE__ */ jsxs("div", { className: "border-t border-stroke-subsection", onMouseDown: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "max-h-[380px] min-h-[96px] overflow-auto scroll-thin bg-surface-default-l1 px-3 pb-2 pt-3", children: [
      start.replaced && /* @__PURE__ */ jsx("p", { className: "mb-2 text-interface-labels-xs-light text-text-default-subdued", children: "The query in the bar has an error, so the builder starts empty. Apply replaces it." }),
      /* @__PURE__ */ jsx(Group, { group: root, depth: 0, schema, errors: /* @__PURE__ */ new Map(), onRoot }),
      root.count ? /* @__PURE__ */ jsx(CountRow, { count: root.count, schema, onChange: (c) => setRoot({ ...root, count: c }), onRemove: () => setRoot({ ...root, count: null }) }) : /* @__PURE__ */ jsx("button", { onClick: () => setRoot({ ...root, count: { op: ">", n: "", within: "", by: "" } }), className: "mt-1 h-6 rounded px-1.5 text-interface-labels-xs-normal text-text-color-blue hover:bg-surface-hover-l1-hover", children: "Add COUNT() threshold" })
    ] }),
    show && /* @__PURE__ */ jsx("div", { className: "border-t border-stroke-subsection px-3 py-2", children: /* @__PURE__ */ jsx("pre", { style: { maxHeight: 200 }, className: "overflow-auto scroll-thin whitespace-pre-wrap break-all font-mono text-code-editor-small leading-5 text-text-default-subdued", children: clean ? paint(parsed && !parsed.errors.length ? format(parsed.ast, null, true) : clean, schema) : "No filter" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-t border-stroke-subsection px-3 py-2", children: [
      incomplete > 0 ? /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-center gap-1.5 text-interface-labels-xs-normal text-text-color-red", children: [
        /* @__PURE__ */ jsx(P.Warning, { size: 12, weight: "fill", className: "shrink-0" }),
        incomplete === 1 ? "Finish 1 condition to run" : `Finish ${incomplete} conditions to run`
      ] }) : error ? /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-center gap-1.5 truncate text-interface-labels-xs-normal text-text-color-red", children: [
        /* @__PURE__ */ jsx(P.Warning, { size: 12, weight: "fill", className: "shrink-0" }),
        error
      ] }) : null,
      /* @__PURE__ */ jsx("span", { className: "ml-auto" }),
      /* @__PURE__ */ jsx("button", { onClick: () => setShow(!show), "aria-pressed": show, className: "h-6 shrink-0 rounded px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-hover-l1-hover", children: show ? "Hide query" : "Show query" }),
      /* @__PURE__ */ jsx("button", { onClick: onCancel, className: "h-6 shrink-0 rounded px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-hover-l1-hover", children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { disabled: blocked, onClick: () => onApply(clean || ""), className: "h-6 shrink-0 rounded-[5px] border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50", children: "Apply & run" })
    ] })
  ] });
}

// src/react/QueryBox.jsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var ROLE = { field: "text-base-blue-1100", op: "text-text-color-purple", kw: "font-semibold text-text-color-purple", str: "text-text-color-success", num: "text-text-color-cyan", bool: "text-text-color-orange", fn: "font-semibold text-text-color-purple", punct: "text-text-default-subtle" };
var DEFAULT = { kw: ROLE.kw, str: ROLE.str, num: ROLE.num, dur: ROLE.num, bool: ROLE.bool, op: ROLE.op, word: ROLE.field };
var cls = (t) => t.role === "op" && t.t === "op" ? "text-text-default-subdued" : ROLE[t.role] || DEFAULT[t.t] || "";
var TYPE_ICON2 = { string: TextT2, numtext: TextT2, number: Hash2, boolean: ToggleLeft2, ip: Globe2, latency: Timer2 };
var PAIRS = { '"': '"', "]": "]", ")": ")" };
var MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
function paint(text, schema, tipFor) {
  const { toks } = parse(text, schema);
  const out = [];
  let at = 0;
  for (const t of toks) {
    if (t.s > at) out.push(text.slice(at, t.s));
    const tip = tipFor && t.role === "field" ? tipFor(t.raw) : null;
    out.push(
      tip ? /* @__PURE__ */ jsx2("span", { "data-pqb-tip": tip, "data-mono": "", className: `${cls(t)} underline decoration-dotted`, children: t.raw }, t.s) : /* @__PURE__ */ jsx2("span", { className: cls(t), children: t.raw }, t.s)
    );
    at = t.e;
  }
  out.push(text.slice(at));
  return out;
}
function Tips({ root }) {
  const [tip, setTip] = useState2(null);
  useEffect2(() => {
    let timer;
    const over = (e) => {
      var _a, _b, _c;
      const el = (_b = (_a = e.target).closest) == null ? void 0 : _b.call(_a, "[data-pqb-tip]");
      clearTimeout(timer);
      if (!el || !el.dataset.pqbTip || !((_c = root.current) == null ? void 0 : _c.contains(el)) || el.getAttribute("aria-expanded") === "true") return setTip(null);
      if (el.dataset.trunc !== void 0 && el.scrollWidth <= el.clientWidth) return setTip(null);
      const r = el.getBoundingClientRect();
      timer = setTimeout(() => setTip({ text: el.dataset.pqbTip, mono: el.dataset.mono !== void 0, side: el.dataset.side, r }), 200);
    };
    const hide = () => {
      clearTimeout(timer);
      setTip(null);
    };
    document.addEventListener("mouseover", over);
    document.addEventListener("mousedown", hide, true);
    document.addEventListener("scroll", hide, true);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mousedown", hide, true);
      document.removeEventListener("scroll", hide, true);
    };
  }, []);
  if (!tip) return null;
  const place = (el) => {
    if (!el) return;
    const { r } = tip;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const a = el.firstChild.style;
    if (tip.side === "right") {
      const top = Math.max(8, r.top + r.height / 2 - h / 2);
      el.style.left = r.right + 8 + "px";
      el.style.top = top + "px";
      Object.assign(a, { left: "-4px", top: Math.min(h - 12, Math.max(4, r.top + r.height / 2 - top - 4)) + "px" });
      return;
    }
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    const below = r.bottom + 8 + h < window.innerHeight;
    el.style.left = left + "px";
    el.style.top = (below ? r.bottom + 8 : r.top - h - 8) + "px";
    Object.assign(a, { left: Math.min(w - 12, Math.max(4, r.left + r.width / 2 - left - 4)) + "px", top: below ? "-4px" : h - 4 + "px" });
  };
  return /* @__PURE__ */ jsxs2("div", { ref: place, role: "tooltip", style: { position: "fixed", zIndex: 100, left: -9999, top: -9999, background: "#000", fontSize: tip.mono ? 11 : 13, lineHeight: tip.mono ? "16px" : "18px" }, className: `pointer-events-none w-max max-w-[520px] whitespace-pre-wrap break-words rounded-md px-2.5 py-1.5 font-medium text-text-default-static shadow-e300 ${tip.mono ? "font-mono" : ""}`, children: [
    /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", style: { position: "absolute", width: 8, height: 8, background: "#000", transform: "rotate(45deg)" } }),
    tip.text
  ] });
}
var closes = (text, pos) => {
  let n = 0;
  for (let i = 0; i < pos; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === '"') n++;
  }
  return n % 2 === 1;
};
function QueryBox({ text, setText, schema, onRun, tools, runErrors, setRunErrors, runRef, adv, setAdv, placeholder }) {
  var _a, _b;
  const ta = useRef2(null);
  const pre = useRef2(null);
  const list = useRef2(null);
  const nextCaret = useRef2(null);
  const stepped = useRef2(null);
  const last = useRef2(text);
  last.current = text;
  const [caret, setCaret] = useState2(0);
  const [focus, setFocus] = useState2(false);
  const [open, setOpen] = useState2(false);
  const [hl, setHl] = useState2(0);
  const sugg = useMemo2(() => focus && open ? context(text, caret, schema) : null, [focus, open, text, caret, schema]);
  const items = (sugg == null ? void 0 : sugg.items) || [];
  const parsed = useMemo2(() => parse(text, schema), [text, schema]);
  const startHl = (sugg == null ? void 0 : sugg.title) === "Combine" || (sugg == null ? void 0 : sugg.title) === "Add another value" ? -1 : 0;
  useLayoutEffect(() => {
    setHl(startHl);
    if (list.current) list.current.scrollTop = 0;
  }, [sugg == null ? void 0 : sugg.kind, sugg == null ? void 0 : sugg.title, sugg == null ? void 0 : sugg.from, startHl]);
  useLayoutEffect(() => {
    if (nextCaret.current !== null && ta.current) {
      ta.current.setSelectionRange(nextCaret.current, nextCaret.current);
      setCaret(nextCaret.current);
      nextCaret.current = null;
    }
  }, [text]);
  useEffect2(() => {
    var _a2, _b2;
    (_b2 = (_a2 = list.current) == null ? void 0 : _a2.querySelector("[data-hl]")) == null ? void 0 : _b2.scrollIntoView({ block: "nearest" });
  }, [hl]);
  const visible = useMemo2(() => parsed.errors.filter((e) => runErrors || !e.eof && (e.e < caret || caret < e.s || !focus)), [parsed, runErrors, caret, focus]);
  const highlighted = useMemo2(() => {
    const out = [];
    let at = 0;
    const marked = visible.find((e) => e.at !== void 0);
    const mark = marked == null ? void 0 : marked.at;
    const lo = marked && Math.min(marked.s, mark);
    const hi = marked && Math.max(marked.e, mark);
    const tint = (a, b) => marked && a >= lo && b <= hi ? " bg-base-red-100" : "";
    const pin = (k) => /* @__PURE__ */ jsx2("span", { className: "relative", children: /* @__PURE__ */ jsx2("span", { style: { position: "absolute", left: 0, top: -1, height: 20, width: 2, borderRadius: 1, background: "var(--color-text-color-red)" } }) }, "at" + k);
    for (const t of parsed.toks) {
      if (t.s > at) out.push(/* @__PURE__ */ jsx2("span", { className: tint(at, t.s), children: text.slice(at, t.s) }, "g" + at));
      const bad = visible.some((e) => t.s < e.e && t.e > e.s);
      out.push(/* @__PURE__ */ jsx2("span", { className: (bad ? "text-text-color-red underline decoration-dotted" : cls(t)) + tint(t.s, t.e), children: text.slice(t.s, t.e) }, t.s));
      at = t.e;
      if (mark === t.e) out.push(pin(t.e));
    }
    out.push(text.slice(at));
    return out;
  }, [parsed, text, visible]);
  const edit = (value, pos, keep) => {
    nextCaret.current = pos;
    setText(value);
    setRunErrors(false);
    setOpen(keep);
  };
  const accept = (item) => {
    let from = item.from ?? sugg.from;
    if (item.trim) while (from > 0 && /\s/.test(text[from - 1])) from--;
    const ins = item.insert;
    edit(text.slice(0, from) + ins + text.slice(item.to ?? sugg.to), from + (item.caretAt ?? ins.length), !!item.reopen);
  };
  const run = (src = text) => {
    setOpen(false);
    const p = parse(src, schema);
    if (p.errors.length) {
      setRunErrors(true);
      return;
    }
    const clean = format(p.ast);
    const shown = focus ? format(p.ast, null, true) : clean;
    if (shown !== text) edit(shown, shown.length, false);
    onRun == null ? void 0 : onRun(clean, p.ast);
  };
  if (runRef) runRef.current = run;
  const skip = (pos) => {
    nextCaret.current = pos;
    ta.current.setSelectionRange(pos, pos);
    setCaret(pos);
    setOpen(true);
  };
  const onKeyDown = (e) => {
    const el = ta.current;
    stepped.current = null;
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
      return;
    }
    if (e.ctrlKey && e.key === " ") {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open && items.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const d = e.key === "ArrowDown" ? 1 : -1;
        setHl((h) => h < 0 ? d > 0 ? 0 : items.length - 1 : (h + d + items.length) % items.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && hl >= 0) {
        e.preventDefault();
        accept(items[hl]);
        return;
      }
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (open && items.length) setOpen(false);
      else el.blur();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      run();
      return;
    }
    const at = el.selectionStart;
    const live = el.value;
    last.current = live;
    if (PAIRS[e.key] && at === el.selectionEnd && live[at] === e.key && (e.key !== '"' || closes(live, at))) {
      e.preventDefault();
      stepped.current = { pos: at + 1, c: e.key };
      skip(at + 1);
    }
  };
  const onChange = (e) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    const prev = last.current;
    const st = stepped.current;
    stepped.current = null;
    if (st && value === prev.slice(0, st.pos) + st.c + prev.slice(st.pos)) {
      e.target.value = prev;
      setText(prev);
      skip(st.pos);
      return;
    }
    const n = value.length - prev.length;
    const c = value[pos - 1];
    if (n >= 1 && PAIRS[c] && value.slice(0, pos - n) + value.slice(pos) === prev && prev[pos - n] === c && (c !== '"' || closes(value, pos - 1))) {
      const v = value.slice(0, pos - 1) + value.slice(pos);
      e.target.value = v;
      last.current = v;
      setText(v);
      setRunErrors(false);
      skip(pos);
      return;
    }
    last.current = value;
    setText(value);
    setCaret(pos);
    setRunErrors(false);
    setOpen(true);
  };
  const sync = () => setCaret(ta.current.selectionStart);
  const showCard = !adv && focus && open && items.length > 0;
  const err = visible[0];
  const showNotice = !adv && !showCard && err && (focus || runErrors);
  const fix = (s, e, t) => {
    edit(text.slice(0, s) + t + text.slice(e), s + t.length, true);
    ta.current.focus();
  };
  const lifted = focus || showNotice || adv;
  const kfmt = (n) => n >= 1e3 ? (n / 1e3).toFixed(2).replace(/\.?0+$/, "") + "k" : n;
  let lastGroup = sugg == null ? void 0 : sugg.title;
  const typeOf2 = (sugg == null ? void 0 : sugg.field) && sugg.field.type !== "numtext" ? TYPE_LABEL[sugg.field.type] : null;
  const row = "relative flex h-7 cursor-pointer items-center gap-2 rounded px-2";
  const chips = showCard && items.some((it) => !it.pin) && items.every((it) => it.pin || it.kind === "value");
  const rowsOf = [];
  if (chips)
    items.forEach((it, i) => {
      if (it.pin) return;
      const raw = it.label.replace(/^"(.*)"$/, "$1");
      const cls2 = /^\d{3}$/.test(raw) ? raw[0] + "XX" : "";
      const last2 = rowsOf[rowsOf.length - 1];
      if (last2 && last2.group === it.group && last2.cls === cls2) last2.items.push([it, i]);
      else rowsOf.push({ group: it.group, cls: cls2, head: (!last2 || last2.group !== it.group) && it.group, items: [[it, i]] });
    });
  const grouped = showCard && !chips && items.some((it) => !it.pin && it.group);
  const groupsOf = [];
  if (grouped)
    items.forEach((it, i) => {
      if (it.pin) return;
      const last2 = groupsOf[groupsOf.length - 1];
      if (last2 && last2.group === (it.group || "")) last2.items.push([it, i]);
      else groupsOf.push({ group: it.group || "", items: [[it, i]] });
    });
  const renderRow = (it, i, bare) => {
    var _a2;
    const head = !bare && it.group && it.group !== lastGroup ? it.group : null;
    lastGroup = it.group;
    const segs = (_a2 = schema.byPath[it.label]) == null ? void 0 : _a2.segs;
    const dot = segs ? it.label.length - segs[segs.length - 1].length : it.label.search(/[^.]*$/);
    const Icon = TYPE_ICON2[it.type];
    const raw = it.label.replace(/^"(.*)"$/, "$1");
    const vs = it.kind === "value" && valueStyle(raw);
    return /* @__PURE__ */ jsxs2("li", { children: [
      head && /* @__PURE__ */ jsx2("p", { className: `px-2 pb-1 text-interface-titles-caption text-text-default-subdued ${i > 0 ? "pt-2" : ""}`, children: head.toUpperCase() }),
      /* @__PURE__ */ jsxs2("div", { "data-hl": i === hl || void 0, style: { scrollMarginTop: 28 }, onMouseMove: () => i !== hl && setHl(i), onClick: () => accept(it), className: `${row} ${i === hl ? "bg-surface-color-blue-default-subtle" : ""}`, children: [
        it.kind === "field" && /* @__PURE__ */ jsxs2(Fragment2, { children: [
          Icon && /* @__PURE__ */ jsx2(Icon, { size: 13, className: "shrink-0 text-icon-subtle" }),
          /* @__PURE__ */ jsx2("span", { className: "min-w-0 truncate font-mono text-code-editor-small", children: it.sub ? /* @__PURE__ */ jsxs2(Fragment2, { children: [
            /* @__PURE__ */ jsx2("span", { className: "font-semibold text-base-blue-1100", children: it.label }),
            /* @__PURE__ */ jsxs2("span", { className: "text-text-default-subtle", children: [
              " ",
              it.sub
            ] })
          ] }) : /* @__PURE__ */ jsxs2(Fragment2, { children: [
            /* @__PURE__ */ jsx2("span", { className: "text-text-default-subtle", children: it.label.slice(0, dot) }),
            /* @__PURE__ */ jsx2("span", { className: "font-semibold text-base-blue-1100", children: it.label.slice(dot) })
          ] }) }),
          /* @__PURE__ */ jsx2("span", { className: "flex-1" }),
          it.count !== void 0 && /* @__PURE__ */ jsx2("span", { className: "w-9 shrink-0 text-right text-interface-labels-xs-normal text-text-default-subtle", children: kfmt(it.count) })
        ] }),
        (it.kind === "op" || it.kind === "kw" || it.kind === "fn") && /* @__PURE__ */ jsxs2(Fragment2, { children: [
          /* @__PURE__ */ jsx2("span", { className: `shrink-0 font-mono text-code-editor-small font-semibold ${it.num ? ROLE.num : it.str ? ROLE.str : "text-text-color-purple"}`, children: it.label }),
          it.sub && /* @__PURE__ */ jsx2("span", { className: "ml-auto min-w-0 truncate text-interface-body-s-normal text-text-default-regular", children: it.sub })
        ] }),
        it.kind === "value" && /* @__PURE__ */ jsxs2(Fragment2, { children: [
          vs ? /* @__PURE__ */ jsx2("span", { style: { ...vs, padding: vs.background ? "0 4px" : 0 }, className: "min-w-0 truncate font-mono text-code-editor-small", children: raw }) : /* @__PURE__ */ jsx2("span", { className: `min-w-0 truncate font-mono text-code-editor-small ${it.label.startsWith('"') ? ROLE.str : it.label === "true" || it.label === "false" ? ROLE.bool : ROLE.num}`, children: it.label }),
          it.total ? /* @__PURE__ */ jsx2("span", { className: "ml-auto h-1 w-14 shrink-0 overflow-hidden rounded-full bg-surface-hover-l1-hover", children: /* @__PURE__ */ jsx2("span", { className: "block h-full rounded-full bg-base-blue-500", style: { width: Math.max(4, it.count / it.total * 100) + "%" } }) }) : null,
          it.count !== void 0 && /* @__PURE__ */ jsx2("span", { className: "w-9 shrink-0 text-right text-interface-labels-xs-normal text-text-default-subtle", children: kfmt(it.count) })
        ] }),
        i === hl && (it.kind === "field" || it.kind === "value") && /* @__PURE__ */ jsx2("kbd", { className: `${it.kind === "field" || it.total ? "" : "ml-auto"} shrink-0 rounded border border-stroke-subsection bg-surface-default-ground px-1 font-sans text-[10px] leading-4 text-text-default-subtle`, children: "Enter" })
      ] })
    ] }, i);
  };
  return /* @__PURE__ */ jsx2("div", { "data-qbox": "", className: "relative h-8 min-w-0 flex-1", children: /* @__PURE__ */ jsxs2("div", { className: `absolute inset-x-0 top-0 rounded-md border ${lifted ? `z-40 bg-surface-default-l1 shadow-e300 ${showNotice && runErrors ? "border-stroke-red-regular" : "border-stroke-active"}` : `${runErrors && parsed.errors.length ? "border-stroke-red-regular" : "border-stroke-subsection"} bg-surface-default-underground`}`, children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-start", children: [
      /* @__PURE__ */ jsx2("span", { className: `flex h-[30px] shrink-0 items-center pl-2 ${adv ? "invisible" : ""}`, children: /* @__PURE__ */ jsx2(Funnel, { size: 14, className: "text-icon-default" }) }),
      /* @__PURE__ */ jsxs2("div", { className: `group/filter relative min-w-0 flex-1 ${adv ? "invisible" : ""}`, children: [
        /* @__PURE__ */ jsxs2("div", { ref: pre, "aria-hidden": "true", style: focus ? { maxHeight: 210 } : void 0, className: `pointer-events-none px-2 py-[5px] font-mono text-code-editor-small leading-5 ${focus ? "overflow-hidden whitespace-pre-wrap break-words" : "h-[30px] overflow-hidden whitespace-pre"}`, children: [
          highlighted,
          "\u200B"
        ] }),
        /* @__PURE__ */ jsx2(
          "textarea",
          {
            ref: ta,
            rows: 1,
            wrap: focus ? "soft" : "off",
            value: text,
            spellCheck: false,
            "aria-label": "Filter",
            placeholder,
            onChange,
            onKeyDown,
            onKeyUp: (e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) || !open && ["ArrowUp", "ArrowDown"].includes(e.key)) sync();
            },
            onClick: () => {
              sync();
              setOpen(true);
            },
            onFocus: () => {
              setFocus(true);
              setOpen(true);
              const pretty = parsed.ast && !parsed.errors.length ? format(parsed.ast, null, true) : text;
              if (pretty === text) return sync();
              const n = text.slice(0, ta.current.selectionStart).replace(/\s/g, "").length;
              let i = 0;
              for (let k = 0; i < pretty.length && k < n; i++) if (!/\s/.test(pretty[i])) k++;
              nextCaret.current = i;
              setText(pretty);
            },
            onBlur: () => {
              setFocus(false);
              setOpen(false);
              if (text.includes("\n")) setText(parsed.ast && !parsed.errors.length ? format(parsed.ast) : text.replace(/\s*\n\s*/g, " "));
              ta.current.scrollTop = 0;
              if (pre.current) pre.current.scrollTop = 0;
            },
            onScroll: (e) => {
              if (pre.current) pre.current.scrollTop = e.target.scrollTop;
            },
            className: `absolute inset-0 h-full w-full resize-none ${focus ? "no-scrollbar overflow-y-auto" : "overflow-hidden"} bg-transparent px-2 py-[5px] font-mono text-code-editor-small leading-5 text-transparent caret-[var(--color-text-default-regular)] outline-none placeholder:text-text-default-disabled`
          }
        )
      ] }),
      text && !adv && /* @__PURE__ */ jsxs2("span", { className: "flex h-[30px] shrink-0 items-center", children: [
        /* @__PURE__ */ jsx2("button", { onMouseDown: (e) => e.preventDefault(), onClick: () => edit("", 0, true), "data-pqb-tip": "Clear filter", "aria-label": "Clear filter", className: "grid h-6 w-6 place-items-center rounded text-icon-default hover:bg-surface-hover-l1-hover", children: /* @__PURE__ */ jsx2(X2, { size: 13 }) }),
        focus && /* @__PURE__ */ jsx2("button", { onMouseDown: (e) => e.preventDefault(), onClick: () => {
          var _a2;
          return (_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(text);
        }, "data-pqb-tip": "Copy query", "aria-label": "Copy query", className: "grid h-6 w-6 place-items-center rounded text-icon-default hover:bg-surface-hover-l1-hover", children: /* @__PURE__ */ jsx2(Copy2, { size: 13 }) }),
        /* @__PURE__ */ jsx2("span", { className: "w-1" })
      ] }),
      /* @__PURE__ */ jsx2("span", { className: "flex h-[30px] shrink-0 items-center gap-0.5 px-1", children: /* @__PURE__ */ jsxs2("button", { onMouseDown: (e) => e.preventDefault(), onClick: () => {
        if (!adv) ta.current.blur();
        setAdv(!adv);
      }, "aria-pressed": adv, "data-pqb-tip": "Build the filter with AND / OR groups", className: `flex h-6 items-center gap-1 rounded px-1.5 ${adv ? "bg-surface-color-blue-default-subtle text-text-color-blue" : "text-text-default-regular hover:bg-surface-hover-l1-hover"}`, children: [
        /* @__PURE__ */ jsx2(TreeStructure, { size: 14, className: adv ? "" : "text-icon-default" }),
        /* @__PURE__ */ jsx2("span", { className: "whitespace-nowrap text-interface-body-s-heavy", children: "Advanced filter" })
      ] }) }),
      tools && /* @__PURE__ */ jsx2("div", { className: "flex shrink-0 self-stretch border-l border-stroke-subsection pl-1 pr-1", children: /* @__PURE__ */ jsx2("span", { className: "flex min-h-[30px] items-start", children: /* @__PURE__ */ jsx2("span", { className: "flex min-h-[30px] items-center", children: tools }) }) })
    ] }),
    adv && /* @__PURE__ */ jsx2(
      Builder,
      {
        text,
        schema,
        onCancel: () => setAdv(false),
        onApply: (t) => {
          setAdv(false);
          edit(t, t.length, false);
          run(t);
        }
      }
    ),
    showCard && /* @__PURE__ */ jsxs2("div", { className: "border-t border-stroke-subsection", onMouseDown: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ jsxs2("div", { className: `${grouped ? "hidden" : "flex"} items-center justify-between gap-3 px-3 pb-1 pt-2`, children: [
        /* @__PURE__ */ jsxs2("span", { className: "min-w-0 truncate text-interface-titles-caption text-text-default-subdued", children: [
          sugg.title.toUpperCase(),
          typeOf2 && /* @__PURE__ */ jsxs2("span", { className: "normal-case text-text-color-cyan", children: [
            " \xB7 ",
            typeOf2
          ] })
        ] }),
        /* @__PURE__ */ jsxs2("span", { className: "shrink-0 text-interface-labels-xs-normal text-text-default-subtle", children: [
          sugg.kind === "fields" ? items.filter((i) => i.type).length : items.length,
          " ",
          sugg.title.startsWith("Example") ? "examples" : "available"
        ] })
      ] }),
      /* @__PURE__ */ jsx2("ul", { ref: list, style: { maxHeight: 180 }, className: "no-scrollbar overflow-y-auto px-1 pb-1", children: chips ? rowsOf.map((r) => /* @__PURE__ */ jsxs2("li", { children: [
        r.head && /* @__PURE__ */ jsx2("p", { className: "px-2 pb-1 pt-2 text-interface-titles-caption text-text-default-subdued", children: r.head.toUpperCase() }),
        /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-1 px-2 py-0.5", children: [
          r.cls && /* @__PURE__ */ jsx2("span", { className: "w-8 shrink-0 text-interface-labels-xs-normal text-text-default-subdued", children: r.cls }),
          r.items.map(([it, i]) => {
            const raw = it.label.replace(/^"(.*)"$/, "$1");
            const vs = valueStyle(raw);
            return /* @__PURE__ */ jsx2("button", { "data-hl": i === hl || void 0, onMouseMove: () => i !== hl && setHl(i), onClick: () => accept(it), style: { ...vs, outline: i === hl ? "2px solid var(--color-stroke-active)" : "none", outlineOffset: 1 }, className: `h-6 rounded px-1.5 font-mono text-code-editor-small ${(vs == null ? void 0 : vs.background) ? "" : "bg-surface-default-underground"} ${vs ? "" : raw === "true" || raw === "false" ? ROLE.bool : ROLE.str}`, children: vs ? raw : it.label }, i);
          })
        ] })
      ] }, r.items[0][1])) : grouped ? groupsOf.map((g) => /* @__PURE__ */ jsxs2("li", { children: [
        /* @__PURE__ */ jsxs2("p", { style: { position: "sticky", top: 0, zIndex: 1 }, className: "flex items-center justify-between gap-3 bg-surface-default-l1 px-2 pb-1 pt-2 text-interface-titles-caption text-text-default-subdued", children: [
          /* @__PURE__ */ jsx2("span", { className: "min-w-0 truncate", children: (g.group ? `${sugg.title} / ${g.group}` : sugg.title).toUpperCase() }),
          /* @__PURE__ */ jsx2("span", { className: "shrink-0 text-interface-labels-xs-normal normal-case text-text-default-subtle", children: g.items.length })
        ] }),
        /* @__PURE__ */ jsx2("ul", { children: g.items.map(([it, i]) => renderRow(it, i, true)) })
      ] }, g.items[0][1])) : items.map((it, i) => !it.pin && renderRow(it, i)) }),
      items.some((it) => it.pin) && /* @__PURE__ */ jsx2("ul", { className: "border-t border-stroke-subsection px-1 pb-1", children: items.map((it, i) => it.pin && renderRow(it, i)) }),
      /* @__PURE__ */ jsx2("div", { className: "flex items-center gap-3 border-t border-stroke-subsection px-3 py-1.5 text-interface-labels-xs-light text-text-default-subdued", children: [
        ["\u2191\u2193", "move"],
        ["Enter", hl < 0 ? "run" : "add"],
        ["Esc", "close"],
        [MAC ? "\u2318 Enter" : "Ctrl Enter", "run"],
        [MAC ? "\u21E7 Enter" : "Shift Enter", "new line"]
      ].map(([k, l]) => /* @__PURE__ */ jsxs2("span", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx2("kbd", { className: "rounded border border-stroke-subsection bg-surface-default-ground px-1 font-sans text-[10px] leading-4 text-text-default-subtle", children: k }),
        l
      ] }, k)) })
    ] }),
    showNotice && /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-1.5 border-t border-stroke-subsection px-2.5 py-1.5", onMouseDown: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ jsx2(Warning2, { size: 14, weight: "fill", className: "mt-[3px] shrink-0 text-text-color-red" }),
      /* @__PURE__ */ jsxs2("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx2("p", { className: "text-interface-labels-xs-normal leading-5 text-text-color-red", children: err.msg }),
        (err.fix || ((_a = err.near) == null ? void 0 : _a.length) > 0) && /* @__PURE__ */ jsxs2("div", { className: "mt-1 flex flex-wrap items-center gap-1", children: [
          /* @__PURE__ */ jsx2("span", { className: "mr-1 text-interface-labels-xs-light text-text-default-subdued", children: "Suggestions" }),
          [].concat(err.fix || []).map((f) => /* @__PURE__ */ jsxs2("button", { onClick: () => fix(f.s, f.e, f.text), className: "h-6 rounded border border-stroke-subsection px-2 font-mono text-interface-labels-xs-normal text-base-blue-1100 hover:bg-surface-hover-l1-hover", children: [
            f.verb || "Use",
            " ",
            f.label
          ] }, f.verb + f.label)),
          (_b = err.near) == null ? void 0 : _b.map((n) => /* @__PURE__ */ jsx2("button", { onClick: () => fix(err.s, err.e, n), className: "h-6 rounded border border-stroke-subsection px-2 font-mono text-interface-labels-xs-normal text-base-blue-1100 hover:bg-surface-hover-l1-hover", children: n }, n))
        ] }),
        visible.length > 1 && /* @__PURE__ */ jsxs2("p", { className: "mt-1 text-interface-labels-xs-light text-text-default-subdued", children: [
          "and ",
          visible.length - 1,
          " more ",
          visible.length === 2 ? "problem" : "problems"
        ] })
      ] })
    ] })
  ] }) });
}

// src/react/Saved.jsx
import { useEffect as useEffect3, useRef as useRef3, useState as useState3 } from "react";
import { MagnifyingGlass as MagnifyingGlass2, PushPin, Trash as Trash2 } from "@phosphor-icons/react";
import { Fragment as Fragment3, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function Saved({ saved, loading, schema, current, onPick, onPin, onDelete, onSave, onSearch, onClose }) {
  const [q, setQ] = useState3("");
  const [name, setName] = useState3("");
  const ref = useRef3(null);
  const close = useRef3(onClose);
  close.current = onClose;
  useEffect3(() => {
    const out = (e) => {
      var _a;
      return !((_a = ref.current) == null ? void 0 : _a.contains(e.target)) && !e.target.closest("[data-pqb-saved]") && close.current();
    };
    const key = (e) => e.key === "Escape" && close.current();
    document.addEventListener("mousedown", out, true);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", out, true);
      document.removeEventListener("keydown", key);
    };
  }, []);
  const x = q.trim().toLowerCase();
  const hit = saved.filter((s) => !x || s.name.toLowerCase().includes(x) || s.query.toLowerCase().includes(x));
  const parsed = current.trim() ? parse(current, schema) : null;
  const valid = parsed && !parsed.errors.length;
  const taken = saved.some((s) => s.name === name.trim());
  const save = () => {
    if (!valid || !name.trim() || taken) return;
    onSave({ name: name.trim(), query: format(parsed.ast), pinned: false });
    setName("");
  };
  const section = (title, list) => list.length > 0 && /* @__PURE__ */ jsxs3(Fragment3, { children: [
    /* @__PURE__ */ jsx3("p", { className: "px-3 pb-1 pt-2.5 text-interface-titles-caption text-text-default-subdued", children: title }),
    list.map((s) => /* @__PURE__ */ jsxs3("div", { onClick: () => onPick(s), className: "group cursor-pointer px-3 py-1.5 hover:bg-surface-hover-l1-hover", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx3("span", { className: "min-w-0 flex-1 truncate text-interface-body-s-heavy text-text-default-regular", children: s.name }),
        onDelete && /* @__PURE__ */ jsx3(
          "button",
          {
            "aria-label": "Delete",
            "data-pqb-tip": "Delete",
            onClick: (e) => {
              e.stopPropagation();
              onDelete(s);
            },
            className: "invisible grid h-5 w-5 shrink-0 place-items-center rounded text-icon-default hover:bg-surface-default-l2 group-hover:visible",
            children: /* @__PURE__ */ jsx3(Trash2, { size: 12 })
          }
        ),
        onPin && /* @__PURE__ */ jsx3(
          "button",
          {
            "aria-label": s.pinned ? "Unpin" : "Pin",
            "data-pqb-tip": s.pinned ? "Unpin" : "Pin",
            onClick: (e) => {
              e.stopPropagation();
              onPin(s, !s.pinned);
            },
            className: `grid h-5 w-5 shrink-0 place-items-center rounded hover:bg-surface-default-l2 ${s.pinned ? "text-text-color-blue" : "invisible text-icon-default group-hover:visible"}`,
            children: /* @__PURE__ */ jsx3(PushPin, { size: 12, weight: s.pinned ? "fill" : "regular" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx3("p", { "data-pqb-tip": s.query, "data-mono": "", className: "mt-0.5 truncate font-mono text-interface-labels-xs-normal", children: paint(s.query.replace(/\n/g, " "), schema) })
    ] }, s.id))
  ] });
  return /* @__PURE__ */ jsxs3("div", { ref, className: "absolute right-0 top-9 z-50 flex w-[380px] flex-col rounded-md border border-stroke-subsection bg-surface-default-l1 shadow-e300", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-3", children: [
      /* @__PURE__ */ jsx3(MagnifyingGlass2, { size: 14, className: "shrink-0 text-icon-default" }),
      /* @__PURE__ */ jsx3(
        "input",
        {
          autoFocus: true,
          value: q,
          onChange: (e) => {
            setQ(e.target.value);
            onSearch == null ? void 0 : onSearch(e.target.value);
          },
          placeholder: "Search saved queries",
          className: "min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "max-h-[min(520px,70vh)] overflow-y-auto no-scrollbar pb-1", children: [
      loading && /* @__PURE__ */ jsx3("p", { className: "px-3 py-3 text-interface-body-s-light text-text-default-subdued", children: "Loading saved queries" }),
      section("PINNED", hit.filter((s) => s.pinned)),
      section("ALL SAVED", hit.filter((s) => !s.pinned)),
      !loading && !hit.length && /* @__PURE__ */ jsx3("p", { className: "px-3 py-3 text-interface-body-s-light text-text-default-subdued", children: saved.length ? "No saved query matches" : "No saved queries yet" })
    ] }),
    onSave && valid && /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-1.5 border-t border-stroke-subsection p-2", children: [
      /* @__PURE__ */ jsx3("input", { value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => e.key === "Enter" && save(), placeholder: "Name the current query", className: "h-7 min-w-0 flex-1 rounded-md border border-stroke-subsection bg-transparent px-2 text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled focus:border-stroke-active" }),
      /* @__PURE__ */ jsx3("button", { disabled: !name.trim() || taken, onClick: save, className: "h-7 shrink-0 rounded-[5px] border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50", children: "Save" })
    ] })
  ] });
}

// src/react/PostgresQueryBox.jsx
import { Fragment as Fragment4, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var PostgresQueryBox = forwardRef(function PostgresQueryBox2({
  schema,
  value,
  defaultValue = "",
  onChange,
  onRun,
  placeholder = 'Filter calls, e.g. data.request.verb == "GET" AND data.response.statusCode >= 500',
  runLabel = "Run query",
  tools,
  saved,
  savedCount,
  savedLoading,
  onSelectSaved,
  onPinSaved,
  onSaveQuery,
  onDeleteSaved,
  onSavedSearch,
  className = ""
}, ref) {
  const root = useRef4(null);
  const runRef = useRef4(null);
  const [own, setOwn] = useState4(defaultValue);
  const text = value ?? own;
  const setText = (t) => {
    if (value === void 0) setOwn(t);
    onChange == null ? void 0 : onChange(t);
  };
  const [runErrors, setRunErrors] = useState4(false);
  const [adv, setAdvState] = useState4(false);
  const [panel, setPanelState] = useState4(false);
  const setAdv = (v) => {
    setAdvState(v);
    if (v) setPanelState(false);
  };
  const setPanel = (v) => {
    setPanelState(v);
    if (v) setAdvState(false);
  };
  useImperativeHandle(ref, () => ({
    focus: () => {
      var _a, _b;
      return (_b = (_a = root.current) == null ? void 0 : _a.querySelector("textarea")) == null ? void 0 : _b.focus();
    },
    run: () => {
      var _a;
      return (_a = runRef.current) == null ? void 0 : _a.call(runRef);
    },
    setText,
    getText: () => text
  }));
  const pick = (s) => {
    var _a;
    onSelectSaved == null ? void 0 : onSelectSaved(s);
    setPanel(false);
    const p = parse(s.query, schema);
    const clean = p.errors.length ? s.query : format(p.ast);
    setText(clean);
    (_a = runRef.current) == null ? void 0 : _a.call(runRef, clean);
  };
  const extra = tools || saved ? /* @__PURE__ */ jsxs4(Fragment4, { children: [
    tools,
    saved && /* @__PURE__ */ jsxs4("span", { className: "relative", children: [
      /* @__PURE__ */ jsxs4("button", { "data-pqb-saved": "", onMouseDown: (e) => e.preventDefault(), onClick: () => setPanel(!panel), "aria-expanded": panel, "data-pqb-tip": "Saved queries", className: `flex h-6 items-center gap-1.5 rounded px-1.5 hover:bg-surface-hover-l1-hover ${panel ? "bg-surface-hover-l1-hover" : ""}`, children: [
        /* @__PURE__ */ jsx4(BookmarksSimple, { size: 14, className: "shrink-0 text-icon-default" }),
        /* @__PURE__ */ jsx4("span", { className: "min-w-0 max-w-[200px] truncate text-interface-body-s-heavy text-text-default-regular", children: "Queries" }),
        /* @__PURE__ */ jsx4("span", { className: "rounded-full bg-surface-hover-l1-hover px-1.5 text-interface-labels-xxs-normal text-text-default-subdued", children: savedCount ?? saved.length }),
        /* @__PURE__ */ jsx4(CaretDown2, { size: 12, className: "shrink-0 text-text-default-subtle" })
      ] }),
      panel && /* @__PURE__ */ jsx4(Saved, { saved, loading: savedLoading, schema, current: text, onPick: pick, onPin: onPinSaved, onDelete: onDeleteSaved, onSave: onSaveQuery, onSearch: onSavedSearch, onClose: () => setPanel(false) })
    ] })
  ] }) : null;
  return /* @__PURE__ */ jsxs4("div", { ref: root, className: `pqb flex min-w-0 items-start gap-2 ${className}`, children: [
    /* @__PURE__ */ jsx4(QueryBox, { text, setText, schema, onRun, tools: extra, runErrors, setRunErrors, runRef, adv, setAdv, placeholder }),
    /* @__PURE__ */ jsxs4("button", { onClick: () => {
      var _a;
      return (_a = runRef.current) == null ? void 0 : _a.call(runRef);
    }, className: "flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-stroke-active bg-surface-default-action px-3 hover:bg-surface-default-action-hover", children: [
      /* @__PURE__ */ jsx4(Play, { size: 14, weight: "fill", className: "text-text-default-static" }),
      /* @__PURE__ */ jsx4("span", { className: "whitespace-nowrap text-interface-labels-xs-normal font-semibold text-text-default-static", children: runLabel })
    ] }),
    /* @__PURE__ */ jsx4(Tips, { root })
  ] });
});
var PostgresQueryBox_default = PostgresQueryBox;
export {
  LATENCY,
  LAT_FIELD,
  METHODS,
  OP_INFO,
  PostgresQueryBox_default as PostgresQueryBox,
  STATUS_CODES,
  TYPE_LABEL,
  buildSchema,
  context,
  evaluate,
  format,
  fromTree,
  ipToBig,
  opsFor,
  parse,
  parseRange,
  schemaFromFields,
  toTree,
  tokenize,
  validate
};
//# sourceMappingURL=index.js.map