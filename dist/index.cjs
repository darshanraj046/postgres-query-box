var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.js
var src_exports = {};
__export(src_exports, {
  LATENCY: () => LATENCY,
  LAT_FIELD: () => LAT_FIELD,
  METHODS: () => METHODS,
  OP_INFO: () => OP_INFO,
  PostgresQueryBox: () => PostgresQueryBox_default,
  STATUS_CODES: () => STATUS_CODES,
  TYPE_LABEL: () => TYPE_LABEL,
  buildSchema: () => buildSchema,
  context: () => context,
  evaluate: () => evaluate,
  format: () => format,
  fromTree: () => fromTree,
  ipToBig: () => ipToBig,
  opsFor: () => opsFor,
  parse: () => parse,
  parseRange: () => parseRange,
  schemaFromFields: () => schemaFromFields,
  toSql: () => toSql,
  toTree: () => toTree,
  tokenize: () => tokenize,
  validate: () => validate
});
module.exports = __toCommonJS(src_exports);

// src/react/PostgresQueryBox.jsx
var import_react6 = require("react");
var import_react7 = require("@phosphor-icons/react");

// src/core/engine.js
var LAT_A = "metadata.responseTimestamp";
var LAT_B = "metadata.requestTimestamp";
var LATENCY = `(${LAT_A} - ${LAT_B})`;
var VALUE_FIELDS = ["data.request.verb", "data.response.statusCode"];
var METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT", "QUERY"];
var STATUS_CODES = [100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511].map(String);
var CATALOG = { "data.request.verb": METHODS, "data.response.statusCode": STATUS_CODES };
var COMMON = ["data.request.verb", "data.response.statusCode", "data.request.path", "data.request.hostname"];
var KW = /* @__PURE__ */ new Set(["AND", "OR", "NOT", "CONTAINS", "PRESENT", "ABSENT", "BETWEEN", "ANYONE", "NONEOF", "IP", "IN_RANGE", "NOT_IN_RANGE", "LATENCY"]);
var OPS = ["!~*", "!~", "~*", "==", "!=", "<=", ">=", "~", "<", ">", "="];
var CMP = /* @__PURE__ */ new Set(["<", "<=", ">", ">="]);
var REGEX = /* @__PURE__ */ new Set(["~", "~*", "!~", "!~*"]);
var TEXT_OPS = /* @__PURE__ */ new Set(["~", "~*", "!~", "!~*", "CONTAINS", "NOT CONTAINS"]);
var UNIT = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
var pgRegex = (p) => {
  const hex = (k, n) => [...Array(n)].every((_, j) => /[0-9a-fA-F]/.test(p[k + j] || "")) && !/[0-9a-fA-F]/.test(p[k + n] || "");
  const open = [];
  const closed = /* @__PURE__ */ new Set();
  let groups = 0;
  let cls2 = -1;
  let first = 0;
  let fixed = "";
  let wb = false;
  let bare = false;
  let last = 0;
  const size = [0];
  const add = (w) => {
    size[size.length - 1] += w;
    last = w;
  };
  for (let i = 0; i < p.length; ) {
    const c = p[i];
    const d = p[i + 1];
    if (cls2 < 0 && bare && (c === "*" || c === "+" || c === "?" || c === "{" && /\d/.test(d || ""))) return { msg: "Postgres cannot repeat \\y, \\m, \\A, \\Z or a lookaround" };
    bare = false;
    if (c === "\\") {
      if (/[1-9]/.test(d) && !/\d/.test(p[i + 2] || "") && cls2 < 0 && !closed.has(+d)) return { msg: `\\${d} needs group ${d} to be closed before it` };
      if (cls2 >= 0 && /\d/.test(d)) return { msg: `Inside brackets, write the character itself instead of \\${d}` };
      if (d === "x" && !hex(i + 2, 2)) return { msg: "Write \\x with exactly two hex digits, like \\x41" };
      if (d === "u" && !hex(i + 2, 4)) return { msg: "Write \\u with exactly four hex digits, like \\u0041" };
      if (d === "c" && !/[A-Za-z]/.test(p[i + 2] || "")) return { msg: "Write \\c with a letter, like \\cA" };
      if (cls2 >= 0 && /[dDwWsS]/.test(d) && (p[i + 2] === "-" && p[i + 3] && p[i + 3] !== "]" || p[i - 1] === "-" && i - 1 !== first)) return { msg: `A range like a-z cannot start or end with \\${d}` };
      if ((d === "b" || d === "B") && cls2 < 0) {
        wb = bare = true;
        add(1);
        fixed += "\\" + (d === "b" ? "y" : "Y");
        i += 2;
        continue;
      }
      if (/[A-Za-z]/.test(d) && !"dDwWsStnrfvxuc".includes(d) && !(cls2 < 0 ? "yYmMAZ" : "b").includes(d)) return { msg: `Postgres does not understand \\${d}. To match the letter ${d}, write ${d} without the backslash.` };
      bare = cls2 < 0 && "yYmMAZ".includes(d);
      if (cls2 < 0) add(1);
      fixed += c + d;
      i += 2;
      continue;
    }
    if (cls2 >= 0) {
      if (c === "[" && ":.=".includes(d || "-")) {
        const m = p.slice(i).match(/^\[:(alnum|alpha|blank|cntrl|digit|graph|lower|print|punct|space|upper|xdigit|word):\]/);
        if (!m) return { msg: "Inside brackets, write \\[ for a literal [" };
        fixed += m[0];
        i += m[0].length;
        continue;
      }
      if (c === "]" && i > first) {
        cls2 = -1;
        add(1);
      }
    } else if (c === "[") {
      if (d === "]" || d === "^" && p[i + 2] === "]") return { msg: "Postgres does not allow empty brackets [] or [^]" };
      cls2 = i;
      first = i + (d === "^" ? 2 : 1);
    } else if (c === "(") {
      size.push(0);
      if (d !== "?") open.push(++groups);
      else if (p[i + 2] === "<" && p[i + 3] !== "=" && p[i + 3] !== "!") return { msg: "Postgres does not support named groups like (?<name>...). Use ( ) instead." };
      else {
        open.push(p[i + 2] === ":" ? 0 : -1);
        const pre = p.slice(i).match(/^\(\?(?:<[=!]|[:=!])/)[0];
        fixed += pre;
        i += pre.length;
        continue;
      }
    } else if (c === ")") {
      if (!open.length) return { msg: "Postgres reads this ) as having no matching (. Check where the brackets [ ] close." };
      const g = open.pop();
      if (g > 0) closed.add(g);
      add(Math.max(size.pop(), 1));
      bare = g === -1;
    } else if (c === "{" && /\d/.test(d || "")) {
      const m = p.slice(i).match(/^\{(\d+)(?:,(\d*))?\}/);
      if (!m) return { msg: "Finish the repeat count, like {2} or {1,3}, or write \\{ for a literal {" };
      if (+m[1] > 255 || +(m[2] || 0) > 255) return { msg: "Postgres allows at most 255 repeats, like {255}" };
      const k = Math.max(+m[1], +(m[2] || 0));
      size[size.length - 1] += last * (k - 1);
      last *= k;
      fixed += m[0];
      i += m[0].length;
      continue;
    } else if (!"*+?".includes(c)) add(1);
    fixed += c;
    i++;
  }
  if (cls2 >= 0) return { msg: "Close the brackets with ]" };
  if (size[0] > 1e4) return { msg: "This regex is too large for Postgres. Use smaller repeat counts." };
  if (wb) return { msg: "Postgres reads \\b as a backspace. Use \\y for a word boundary and \\Y for the opposite.", fix: fixed };
  return null;
};
var OP_INFO = {
  "==": "equals",
  "!=": "not equal",
  "~": "matches regex",
  "~*": "matches regex, any case",
  "!~": "does not match regex",
  "!~*": "does not match regex, any case",
  "<": "less than",
  "<=": "at most",
  ">": "greater than",
  ">=": "at least",
  CONTAINS: "contains text",
  "NOT CONTAINS": "does not contain text",
  PRESENT: "has this field",
  ABSENT: "missing this field",
  BETWEEN: "between, both ends included",
  ANYONE: "any one of",
  NONEOF: "none of",
  "IP IN_RANGE": "IP in range",
  "IP NOT_IN_RANGE": "IP not in range"
};
var TYPE_LABEL = { string: "text", number: "number", boolean: "boolean", ip: "ip", numtext: "text", latency: "ms" };
function opsFor(f) {
  if (!f) return [];
  if (f.type === "latency") return [">", "<", ">=", "<=", "BETWEEN"];
  if (f.type === "number") return ["==", "!=", "<", "<=", ">", ">=", "BETWEEN", "ANYONE", "NONEOF", "PRESENT", "ABSENT"];
  if (f.type === "boolean") return ["==", "!=", "PRESENT", "ABSENT"];
  if (f.type === "ip") return ["IP IN_RANGE", "IP NOT_IN_RANGE", "==", "!=", "CONTAINS", "NOT CONTAINS", "~", "~*", "!~", "!~*", "ANYONE", "NONEOF", "PRESENT", "ABSENT"];
  if (f.type === "numtext") return ["==", "!=", ">=", ">", "<", "<=", "BETWEEN", "ANYONE", "NONEOF", "~", "!~", "CONTAINS", "NOT CONTAINS", "PRESENT", "ABSENT"];
  return ["==", "!=", "CONTAINS", "NOT CONTAINS", "~", "~*", "!~", "!~*", "ANYONE", "NONEOF", "PRESENT", "ABSENT"];
}
var GROUPS = [
  ["data.request.headerParams.", "Request headers"],
  ["data.request.queryParams.", "Query params"],
  ["data.request.", "Request"],
  ["data.response.headerParams.", "Response headers"],
  ["data.response.", "Response"],
  ["metadata.additionalMetadata.", "Additional metadata"],
  ["metadata.", "Metadata"]
];
function buildSchema(rows) {
  const map = /* @__PURE__ */ new Map();
  const visit = (o, segs) => {
    for (const k of Object.keys(o)) {
      const v = o[k];
      const ks = [...segs, k];
      const p = ks.join(".");
      if (v && typeof v === "object" && !Array.isArray(v)) visit(v, ks);
      else {
        let f = map.get(p);
        if (!f) map.set(p, f = { path: p, segs: ks, count: 0, kinds: /* @__PURE__ */ new Set(), numeric: true, ip: true, values: /* @__PURE__ */ new Map() });
        f.count++;
        f.kinds.add(typeof v);
        if (typeof v === "string") {
          if (!/^-?\d+(\.\d+)?$/.test(v)) f.numeric = false;
          if (!ipToBig(v)) f.ip = false;
        }
        if (VALUE_FIELDS.includes(p)) f.values.set(v, (f.values.get(v) || 0) + 1);
      }
    }
  };
  for (const r of rows) visit({ data: r.data, metadata: r.metadata }, []);
  return schemaFromFields(
    [...map.values()].map((f) => {
      const kind = f.kinds.size === 1 ? [...f.kinds][0] : "string";
      const type = kind === "number" ? "number" : kind === "boolean" ? "boolean" : f.ip ? "ip" : f.numeric ? "numtext" : "string";
      const values = [...f.values.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ v, n }));
      return { path: f.path, segs: f.segs, count: f.count, type, values };
    }),
    rows.length
  );
}
function schemaFromFields(list, total = 0) {
  const fields = list.map((f) => ({
    ...f,
    segs: f.segs || f.path.split("."),
    type: f.type || "string",
    count: f.count ?? total,
    group: f.group || (COMMON.includes(f.path) ? "Common" : (GROUPS.find(([p]) => f.path.startsWith(p)) || [, "Other"])[1]),
    values: f.values || []
  }));
  const order = ["Common", ...GROUPS.map((g) => g[1]), "Other"];
  fields.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || (a.group === "Common" ? COMMON.indexOf(a.path) - COMMON.indexOf(b.path) : a.path.localeCompare(b.path)));
  const byPath = Object.fromEntries(fields.map((f) => [f.path, f]));
  const short = {};
  for (const f of fields) {
    for (let n = 1; n <= f.segs.length; n++) {
      const tail = f.segs.slice(-n).join(".");
      if (fields.filter((g) => g.segs.length >= n && g.segs.slice(-n).join(".") === tail).length === 1) {
        short[f.path] = tail;
        break;
      }
    }
  }
  return { fields, byPath, short, total };
}
function ipToBig(s) {
  if (typeof s !== "string") return null;
  const v4 = (x2) => {
    const p = x2.split(".");
    if (p.length !== 4 || p.some((n2) => !/^\d{1,3}$/.test(n2) || +n2 > 255)) return null;
    return p.reduce((a2, n2) => a2 * 256n + BigInt(n2), 0n);
  };
  if (s.includes(".") && !s.includes(":")) {
    const n2 = v4(s);
    return n2 === null ? null : { v: 4, n: n2 };
  }
  if (!/^[0-9a-fA-F:.]+$/.test(s) || !s.includes(":")) return null;
  let tail = null;
  let x = s;
  const m = s.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (m) {
    tail = /(^|\.)0\d/.test(m[2]) ? null : v4(m[2]);
    if (tail === null) return null;
    x = m[1] + "0:0";
  }
  const halves = x.split("::");
  if (halves.length > 2) return null;
  const a = halves[0] ? halves[0].split(":") : [];
  const b = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? 8 - a.length - b.length : 0;
  if (halves.length === 2 && fill < 1) return null;
  const parts = [...a, ...Array(fill).fill("0"), ...b];
  if (parts.length !== 8 || parts.some((p) => !/^[0-9a-fA-F]{1,4}$/.test(p))) return null;
  let n = parts.reduce((acc, p) => acc * 65536n + BigInt(parseInt(p, 16)), 0n);
  if (tail !== null) n = (n >> 32n << 32n) + tail;
  if (n >> 32n === 0xffffn) return { v: 4, n: n & 0xffffffffn };
  return { v: 6, n };
}
function parseRange(s) {
  if (typeof s !== "string") return null;
  if (s.includes("/")) {
    const [base, bits, extra2] = s.split("/");
    const ip = ipToBig(base);
    const max = ip && ip.v === 4 ? 32 : 128;
    if (!ip || extra2 !== void 0 || !/^(0|[1-9]\d*)$/.test(bits) || +bits > max) return null;
    const host = BigInt(max - +bits);
    const lo = ip.n >> host << host;
    return { v: ip.v, lo, hi: lo + (1n << host) - 1n };
  }
  const [a, b, extra] = s.split("-");
  const x = ipToBig(a);
  const y = ipToBig(b);
  if (!x || !y || extra !== void 0 || x.v !== y.v || x.n > y.n) return null;
  return { v: x.v, lo: x.n, hi: y.n };
}
var LAT_FIELD = { path: "@latency", type: "latency" };
function tokenize(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const s = i;
    if (c === '"') {
      i++;
      let v = "";
      let closed = false;
      while (i < src.length) {
        if (src[i] === "\\" && (src[i + 1] === '"' || src[i + 1] === "\\")) {
          v += src[i + 1];
          i += 2;
          continue;
        }
        if (src[i] === '"') {
          closed = true;
          i++;
          break;
        }
        v += src[i++];
      }
      out.push({ t: "str", v, s, e: i, closed, raw: src.slice(s, i) });
      continue;
    }
    const prev = out[out.length - 1];
    const neg = c === "-" && /\d/.test(src[i + 1] || "") && prev && (prev.t === "op" || prev.t === "punct" && prev.v !== ")" || prev.t === "kw");
    if (/\d/.test(c) || neg) {
      const m = src.slice(i).match(/^-?\d+(?:\.\d+)?/)[0];
      i += m.length;
      if (/[smhd]/.test(src[i] || "") && !/[A-Za-z0-9_]/.test(src[i + 1] || "")) {
        i++;
        out.push({ t: "dur", v: m + src[i - 1], ms: Number(m) * UNIT[src[i - 1]], s, e: i, raw: src.slice(s, i) });
      } else out.push({ t: "num", v: Number(m), s, e: i, raw: m });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_](?:[A-Za-z0-9_.-]|\\\.)*/)[0];
      i += m.length;
      const up = m.toUpperCase();
      if (KW.has(up)) out.push({ t: "kw", v: up, s, e: i, raw: m });
      else if (up === "TRUE" || up === "FALSE") out.push({ t: "bool", v: up === "TRUE", s, e: i, raw: m });
      else out.push({ t: "word", v: m, s, e: i, raw: m });
      continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (op) {
      i += op.length;
      out.push({ t: "op", v: op, s, e: i, raw: op });
      continue;
    }
    i++;
    if (c === "-") out.push({ t: "minus", v: "-", s, e: i, raw: "-" });
    else if ("()[],".includes(c)) out.push({ t: "punct", v: c, s, e: i, raw: c });
    else out.push({ t: "bad", v: c, s, e: i, raw: c });
  }
  return out;
}
var near = (word, schema) => {
  const w = word.toLowerCase();
  const leaf = w.split(".").pop();
  const hits = schema.fields.filter((f) => f.path.toLowerCase().includes(leaf) || leaf.includes(f.path.split(".").pop().toLowerCase()));
  return hits.slice(0, 4).map((f) => f.path);
};
var lit = (v) => typeof v === "string" ? '"' + v.replace(/\\(?=[\\"]|$)/g, "\\\\").replace(/"/g, '\\"') + '"' : String(v);
function parse(src, schema) {
  const toks = tokenize(src);
  const errors = [];
  let p = 0;
  const peek = (o = 0) => toks[p + o];
  const isKw = (t, k) => t && t.t === "kw" && t.v === k;
  const isP = (t, v) => t && t.t === "punct" && t.v === v;
  const role = (t, r) => t && (t.role = r);
  const fail = (t, msg, extra) => {
    throw { s: t ? t.s : src.length, e: t ? t.e : src.length, msg, eof: !t, ...extra };
  };
  const word = (t) => t ? t.raw : "";
  const latencyAhead = () => {
    var _a, _b, _c;
    return isP(peek(), "(") && ((_a = peek(1)) == null ? void 0 : _a.t) === "word" && ((_b = peek(2)) == null ? void 0 : _b.t) === "minus" && ((_c = peek(3)) == null ? void 0 : _c.t) === "word" && isP(peek(4), ")");
  };
  const value = (allowBool = true, type) => {
    const t = peek();
    if (!t) fail(null, "Add a value");
    if (t.t === "str") {
      if (!t.closed) fail(t, "Close the quote", { at: t.e, fix: { s: t.e, e: t.e, text: '"', verb: "Add", label: '"' } });
      if (t.v.includes("\0")) errors.push({ s: t.s, e: t.e, msg: "Remove the hidden NUL character from this text" });
      role(t, "str");
    } else if (t.t === "num") role(t, "num");
    else if (t.t === "bool" && allowBool) role(t, "bool");
    else if (t.t !== "word" || type === "number" || type === "latency") fail(t, `Expected a ${type === "number" || type === "latency" ? "number" : "value"}, found ${word(t)}`);
    else fail(t, `Expected a value, found ${word(t)}`, { fix: (type === "boolean" ? ["true", "false"] : [lit(t.raw)]).map((x) => ({ s: t.s, e: t.e, text: x, verb: "Use", label: x })) });
    p++;
    return { v: t.v, raw: t.t === "str" ? t.raw : t.t === "bool" ? String(t.v) : t.raw, tok: t };
  };
  const list = (allowBool = true, type) => {
    const o = peek();
    if (!isP(o, "[")) fail(o, `Expected a list like ${type === "number" ? "[1, 2]" : type === "boolean" ? "[true, false]" : '["a", "b"]'}`, o && ["str", "num", "bool"].includes(o.t) ? { fix: { s: o.s, e: o.s, text: "[", verb: "Add", label: "[" } } : void 0);
    p++;
    const vals = [];
    if (isP(peek(), "]")) fail(peek(), "Add at least one value to the list");
    for (; ; ) {
      vals.push(value(allowBool, type));
      if (isP(peek(), ",")) {
        p++;
        continue;
      }
      if (isP(peek(), "]")) {
        const c2 = peek();
        p++;
        return { vals, e: c2.e };
      }
      const c = peek();
      const prev = peek(-1);
      const ins = (text, verb, label) => ({ s: prev.e, e: prev.e, text, verb, label });
      if (c && ["str", "num", "bool"].includes(c.t)) fail(c, `Separate list values with a comma, between ${prev.raw} and ${c.raw}`, { s: prev.s, at: prev.e, fix: ins(",", "Add", ",") });
      fail(c, `Close the list with ] after ${prev.raw}`, { s: o.s, e: o.e, at: prev.e, fix: ins("]", "Add", "]") });
    }
  };
  const typeFix = (f, val, display) => {
    if (!f) return;
    const t = val.tok;
    const isNumText = typeof val.v === "string" && /^-?\d+(\.\d+)?$/.test(val.v);
    if ((f.type === "string" || f.type === "numtext" || f.type === "ip") && t.t !== "str") {
      errors.push({ s: t.s, e: t.e, msg: `${display} is stored as text, so ${t.raw} never matches. Use "${t.raw}".`, fix: { s: t.s, e: t.e, text: `"${t.raw}"`, label: `"${t.raw}"` } });
    } else if (f.type === "number" && t.t !== "num") {
      if (isNumText) errors.push({ s: t.s, e: t.e, msg: `${display} is stored as a number, so ${t.raw} never matches. Use ${val.v}.`, fix: { s: t.s, e: t.e, text: val.v, label: val.v } });
      else errors.push({ s: t.s, e: t.e, msg: `${display} holds numbers, ${t.raw} is not one` });
    } else if (f.type === "boolean" && t.t !== "bool") {
      if (t.t === "str" && /^(true|false)$/i.test(val.v)) errors.push({ s: t.s, e: t.e, msg: `${display} is a boolean, write ${val.v.toLowerCase()} without quotes`, fix: { s: t.s, e: t.e, text: val.v.toLowerCase(), label: val.v.toLowerCase() } });
      else errors.push({ s: t.s, e: t.e, msg: `${display} is a boolean, use true or false` });
    }
  };
  const numFix = (val, display) => {
    const t = val.tok;
    if (t.t === "num") return;
    if (t.t === "str" && /^-?\d+(\.\d+)?$/.test(val.v)) errors.push({ s: t.s, e: t.e, msg: `Numeric operators take a bare number. Use ${val.v}.`, fix: { s: t.s, e: t.e, text: val.v, label: val.v } });
    else errors.push({ s: t.s, e: t.e, msg: `${display} needs a number here, found ${t.raw}` });
  };
  const condition = () => {
    const t = peek();
    let field;
    let fs = t.s;
    let fe;
    if (isP(t, "(")) {
      const a = peek(1);
      const b = peek(3);
      [t, a, peek(2), b, peek(4)].forEach((x) => role(x, "field"));
      if (a.v !== LAT_A || b.v !== LAT_B) errors.push({ s: t.s, e: peek(4).e, msg: `Latency is written ${LATENCY}`, fix: { s: t.s, e: peek(4).e, text: LATENCY, label: LATENCY } });
      field = "@latency";
      fe = peek(4).e;
      p += 5;
    } else if (isKw(t, "LATENCY")) {
      role(t, "field");
      field = "@latency";
      fe = t.e;
      p++;
    } else if (t.t === "word") {
      role(t, "field");
      field = t.v.replace(/\\\./g, ".");
      fe = t.e;
      p++;
      if (!schema.byPath[field]) {
        const n = near(field, schema);
        errors.push({ s: t.s, e: t.e, msg: `${field} is not a field in this index`, near: n });
      }
    } else fail(t, t.t === "kw" ? `${t.raw} needs a condition before it` : `Expected a field, found ${word(t)}`);
    const f = field === "@latency" ? LAT_FIELD : schema.byPath[field];
    const display = field === "@latency" ? "Latency" : field;
    const o = peek();
    if (!o && !f) throw errors.pop();
    if (!o) fail(null, `Add an operator after ${display}`);
    let op;
    if (o.t === "op") {
      op = o.v === "=" ? "==" : o.v;
      role(o, "op");
      p++;
    } else if (o.t === "kw" && ["CONTAINS", "PRESENT", "ABSENT", "BETWEEN", "ANYONE", "NONEOF"].includes(o.v)) {
      op = o.v;
      role(o, "op");
      p++;
    } else if (isKw(o, "NOT") && isKw(peek(1), "CONTAINS")) {
      op = "NOT CONTAINS";
      role(o, "op");
      role(peek(1), "op");
      p += 2;
    } else if (isKw(o, "IP") && (isKw(peek(1), "IN_RANGE") || isKw(peek(1), "NOT_IN_RANGE"))) {
      op = "IP " + peek(1).v;
      role(o, "op");
      role(peek(1), "op");
      p += 2;
    } else if (isKw(o, "IP")) fail(peek(1) || o, "After IP write IN_RANGE or NOT_IN_RANGE");
    else if (o.t === "minus") {
      const b = peek(1);
      const open = peek(-2);
      if ((b == null ? void 0 : b.t) === "word" && isP(open, "(")) fail(o, `Missing ) after ${b.raw}`, { s: open.s, e: open.e, at: b.e, fix: { s: b.e, e: b.e, text: ")", verb: "Add", label: ")" } });
      if ((b == null ? void 0 : b.t) === "word") fail(o, `Latency is written ${LATENCY}`, { s: t.s, e: b.e, at: b.e, fix: { s: t.s, e: b.e, text: LATENCY, verb: "Wrap in", label: "( )" } });
      fail(o, `Latency is written ${LATENCY}`);
    } else fail(o, `Expected an operator after ${display}, found ${word(o)}`);
    const node = { k: "cond", field, op, s: fs };
    if (f && !opsFor(f).includes(op)) {
      const why = f.type === "latency" ? "Latency takes >, <, >=, <= or BETWEEN" : op.startsWith("IP") ? "IP operators work only on fields that hold IP addresses" : CMP.has(op) || op === "BETWEEN" ? `${op} needs a number field, ${display} holds ${TYPE_LABEL[f.type]}` : `${op} does not apply to ${display} (${TYPE_LABEL[f.type]})`;
      const base = op.endsWith("*") && opsFor(f).includes(op.slice(0, -1)) ? op.slice(0, -1) : null;
      errors.push({ s: o.s, e: (peek(-1) || o).e, msg: base ? `${op} does not apply to ${display}, use ${base}` : why, ...base ? { fix: { s: o.s, e: o.e, text: base, verb: "Use", label: base } } : {} });
    }
    if (op === "PRESENT" || op === "ABSENT") {
      node.e = o.e;
      return node;
    }
    if (op === "BETWEEN") {
      const lo = value(false, "number");
      const a = peek();
      if (!isKw(a, "AND")) fail(a, "BETWEEN needs AND, like BETWEEN 200 AND 299", (a == null ? void 0 : a.t) === "num" ? { s: lo.tok.s, e: a.e, at: lo.tok.e, fix: { s: lo.tok.e, e: lo.tok.e, text: " AND", verb: "Add", label: "AND" } } : void 0);
      role(a, "op");
      p++;
      const hi = value(false, "number");
      numFix(lo, display);
      numFix(hi, display);
      if (Number(lo.v) > Number(hi.v)) errors.push({ s: lo.tok.s, e: hi.tok.e, msg: "The first number must be the smaller one", fix: { s: lo.tok.s, e: hi.tok.e, text: `${hi.raw} AND ${lo.raw}`, verb: "Swap to", label: `${hi.raw} AND ${lo.raw}` } });
      Object.assign(node, { lo, hi, e: hi.tok.e });
      return node;
    }
    if (op === "ANYONE" || op === "NONEOF") {
      const l = list(true, f == null ? void 0 : f.type);
      for (const v2 of l.vals) typeFix(f, v2, display);
      Object.assign(node, { vals: l.vals, e: l.e });
      return node;
    }
    if (op.startsWith("IP")) {
      let vals;
      if (isP(peek(), "[")) {
        const l = list(false);
        vals = l.vals;
        node.e = l.e;
        node.list = true;
      } else {
        const v2 = value(false);
        vals = [v2];
        node.e = v2.tok.e;
      }
      for (const v2 of vals) {
        if (v2.tok.t !== "str") errors.push({ s: v2.tok.s, e: v2.tok.e, msg: 'Write the range in quotes, like "10.0.0.0/8"' });
        else if (!v2.v.trim()) errors.push({ s: v2.tok.s, e: v2.tok.e, msg: 'Add a range, like "10.0.0.0/8" or "10.0.0.1-10.0.0.50"' });
        else if (!parseRange(v2.v.includes("/") || v2.v.includes("-") ? v2.v : v2.v + (v2.v.includes(":") ? "/128" : "/32"))) errors.push({ s: v2.tok.s, e: v2.tok.e, msg: `${v2.raw} is not a valid CIDR or range. Use "10.0.0.0/8" or "10.0.0.1-10.0.0.50".` });
      }
      node.vals = vals;
      return node;
    }
    const v = value(!TEXT_OPS.has(op), f == null ? void 0 : f.type);
    node.val = v;
    node.e = v.tok.e;
    if (TEXT_OPS.has(op) && v.tok.t !== "str") errors.push({ s: v.tok.s, e: v.tok.e, msg: `${op} takes text in quotes`, fix: { s: v.tok.s, e: v.tok.e, text: `"${v.tok.raw}"`, label: `"${v.tok.raw}"` } });
    else if (REGEX.has(op)) {
      try {
        new RegExp(v.v);
        const pg = pgRegex(v.v);
        if (pg) errors.push({ s: v.tok.s, e: v.tok.e, msg: pg.msg, ...pg.fix ? { fix: { s: v.tok.s, e: v.tok.e, text: lit(pg.fix), label: lit(pg.fix) } } : {} });
      } catch (err) {
        errors.push({ s: v.tok.s, e: v.tok.e, msg: `Invalid regex: ${String(err.message).replace(/^Invalid regular expression: /, "")}` });
      }
    } else if (CMP.has(op)) numFix(v, display);
    else if (op === "==" || op === "!=") typeFix(f, v, display);
    return node;
  };
  const primary = () => {
    const t = peek();
    if (!t) fail(null, "Add a condition");
    if (isP(t, "(") && !latencyAhead()) {
      role(t, "punct");
      p++;
      const x = orExpr();
      const c = peek();
      if (!isP(c, ")")) {
        const end = peek(-1).e;
        const ins = (text, label) => ({ s: end, e: end, text, verb: "Add", label });
        if (c) fail(c, `Expected ) or AND/OR before ${word(c)}`, { at: end, fix: [...toks.slice(p).some((x2) => isP(x2, ")")) ? [] : [ins(")", ")")], ins(" AND", "AND"), ins(" OR", "OR")] });
        fail(c, "Close the group with ). The highlighted ( is never closed.", { s: t.s, e: t.e, at: end, fix: [ins(")", ")"), { s: t.s, e: t.e, text: "", verb: "Remove", label: "this (" }] });
      }
      role(c, "punct");
      p++;
      return { k: "group", x, s: t.s, e: c.e };
    }
    return condition();
  };
  const notExpr = () => {
    const t = peek();
    if (isKw(t, "NOT")) {
      role(t, "kw");
      p++;
      const x = notExpr();
      return { k: "not", x, s: t.s, e: x.e };
    }
    return primary();
  };
  const join = (k, next) => () => {
    const items = [next()];
    while (isKw(peek(), k)) {
      role(peek(), "kw");
      p++;
      items.push(next());
    }
    return items.length === 1 ? items[0] : { k: k.toLowerCase(), items, s: items[0].s, e: items[items.length - 1].e };
  };
  const andExpr = join("AND", notExpr);
  const orExpr = join("OR", andExpr);
  let ast = null;
  let syntax = null;
  if (toks.length) {
    try {
      ast = orExpr();
      if (p < toks.length) {
        const t = peek();
        const end = peek(-1).e;
        if (isP(t, ")")) fail(t, "This ) has no matching (", { fix: { s: t.s, e: t.e, text: "", verb: "Remove", label: "this )" } });
        fail(t, `Join conditions with AND or OR before ${word(t)}`, { at: end, fix: [" AND", " OR"].map((x) => ({ s: end, e: end, text: x, verb: "Add", label: x.trim() })) });
      }
    } catch (err) {
      if (!err || err.msg === void 0) throw err;
      syntax = err;
      ast = null;
      const k = toks.findIndex((t, j) => {
        var _a;
        return t.t === "str" && t.closed && ((_a = toks[j + 1]) == null ? void 0 : _a.t) === "word" && toks[j + 1].s === t.e && /\s(?:AND|OR|ANYONE|NONEOF|CONTAINS|BETWEEN)\s|[=!<>~[]|,\s*$|\b(?:data|metadata)\./.test(t.v);
      });
      if (k >= 0 && toks[k].s <= Math.max(syntax.s, syntax.e, syntax.at ?? 0)) {
        const w = toks[k].raw.slice(1).match(/^[^\s",]*/)[0];
        const at = toks[k].s + 1 + w.length;
        syntax = { s: toks[k].s, e: at, at, msg: `Missing " after ${w}`, fix: { s: at, e: at, text: '"', verb: "Add", label: `" after ${w}` } };
      }
    }
  }
  const all = syntax ? [syntax, ...errors] : errors;
  all.sort((a, b) => a.s - b.s);
  return { ast, errors: all, toks };
}
function format(ast, name, pretty) {
  const f = (x) => x === "@latency" ? name ? name(x) : LATENCY : name ? name(x) : x;
  const one = (n, d = 0) => {
    if (n.k === "cond") {
      const head = `${f(n.field)} ${n.op}`;
      if (n.op === "PRESENT" || n.op === "ABSENT") return head;
      if (n.op === "BETWEEN") return `${head} ${n.lo.raw} AND ${n.hi.raw}`;
      if (n.vals && (n.list || !n.op.startsWith("IP"))) return `${head} [${n.vals.map((v) => v.raw).join(", ")}]`;
      if (n.vals) return `${head} ${n.vals[0].raw}`;
      return `${head} ${n.val.raw}`;
    }
    const ind = (k) => "\n" + "  ".repeat(k);
    if (n.k === "group") return pretty && n.x.items ? `(${ind(d + 1)}${one(n.x, d + 1)}${ind(d)})` : `(${one(n.x, d)})`;
    if (n.k === "not") return `NOT ${one(n.x, d)}`;
    if (pretty) return n.items.map((x, i) => (i ? `${ind(d)}${n.k.toUpperCase()} ` : "") + one(x, d)).join("");
    return n.items.map((x) => one(x)).join(` ${n.k.toUpperCase()} `);
  };
  return ast ? one(ast) : "";
}
var get = (row, path) => {
  const segs = path.replace(/\\\./g, ".").split(".");
  let o = row;
  let i = 0;
  while (i < segs.length) {
    if (o == null || typeof o !== "object") return void 0;
    let j = segs.length;
    while (j > i && !(segs.slice(i, j).join(".") in o)) j--;
    if (j === i) return void 0;
    o = o[segs.slice(i, j).join(".")];
    i = j;
  }
  return o;
};
var asNum = (v) => typeof v === "number" ? v : typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null;
var inRanges = (v, vals) => {
  const ip = ipToBig(v);
  if (!ip) return null;
  return vals.some((x) => {
    const r = parseRange(x.v.includes("/") || x.v.includes("-") ? x.v : x.v + (x.v.includes(":") ? "/128" : "/32"));
    return r && r.v === ip.v && ip.n >= r.lo && ip.n <= r.hi;
  });
};
function test(n, row) {
  if (n.k === "group") return test(n.x, row);
  if (n.k === "not") {
    const r = test(n.x, row);
    return r === null ? null : !r;
  }
  if (n.k === "and") {
    let unknown = false;
    for (const x2 of n.items) {
      const r = test(x2, row);
      if (r === false) return false;
      if (r === null) unknown = true;
    }
    return unknown ? null : true;
  }
  if (n.k === "or") {
    let unknown = false;
    for (const x2 of n.items) {
      const r = test(x2, row);
      if (r === true) return true;
      if (r === null) unknown = true;
    }
    return unknown ? null : false;
  }
  let v;
  if (n.field === "@latency") {
    const a = get(row, LAT_A);
    const b = get(row, LAT_B);
    v = typeof a === "number" && typeof b === "number" ? a - b : void 0;
  } else v = get(row, n.field);
  if (n.op === "PRESENT") return v !== void 0 && v !== null;
  if (n.op === "ABSENT") return v === void 0 || v === null;
  if (v === void 0 || v === null) return null;
  switch (n.op) {
    case "==":
      return v === n.val.v;
    case "!=":
      return v !== n.val.v;
    case "~":
    case "~*":
    case "!~":
    case "!~*": {
      const hit = new RegExp(n.val.v, n.op.endsWith("*") ? "i" : "").test(String(v));
      return n.op.startsWith("!") ? !hit : hit;
    }
    case "CONTAINS":
      return String(v).includes(n.val.v);
    case "NOT CONTAINS":
      return !String(v).includes(n.val.v);
    case "ANYONE":
      return n.vals.some((x2) => x2.v === v);
    case "NONEOF":
      return !n.vals.some((x2) => x2.v === v);
    case "IP IN_RANGE":
      return inRanges(v, n.vals);
    case "IP NOT_IN_RANGE": {
      const r = inRanges(v, n.vals);
      return r === null ? null : !r;
    }
  }
  const x = asNum(v);
  if (x === null) return null;
  if (n.op === "BETWEEN") return x >= Number(n.lo.v) && x <= Number(n.hi.v);
  const y = Number(n.val.v);
  return n.op === "<" ? x < y : n.op === "<=" ? x <= y : n.op === ">" ? x > y : x >= y;
}
function evaluate(ast, rows) {
  return { rows: ast ? rows.filter((r) => test(ast, r) === true) : rows };
}
function context(src, caret, schema) {
  const toks = tokenize(src.slice(0, caret));
  let part = null;
  const last = toks[toks.length - 1];
  if (last && last.e === caret && ["word", "kw", "bool", "op", "num", "dur"].includes(last.t)) part = toks.pop();
  else if (last && last.t === "str" && !last.closed) part = toks.pop();
  let st = "term";
  let depth = 0;
  let field = null;
  let op = null;
  let between = false;
  let used = [];
  let inList = false;
  let opTok = null;
  let eq = null;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    const kw = t.t === "kw" ? t.v : null;
    if (st === "term") {
      if (kw === "NOT") continue;
      if (t.v === "(" && t.t === "punct") depth++;
      else if (kw === "LATENCY") field = LAT_FIELD, st = "op";
      else if (t.t === "word") field = schema.byPath[t.v.replace(/\\\./g, ".")] || { path: t.v, type: null }, st = "op";
      else st = "bad";
    } else if (st === "op") {
      if (t.t === "minus") st = "lat2";
      else if (t.t === "op") op = t.v === "=" ? "==" : t.v, opTok = t, st = "value";
      else if (kw === "PRESENT" || kw === "ABSENT") st = "joiner";
      else if (kw === "CONTAINS") op = kw, st = "value";
      else if (kw === "NOT") st = "notc";
      else if (kw === "IP") st = "ipop";
      else if (kw === "BETWEEN") op = kw, between = true, st = "value";
      else if (kw === "ANYONE" || kw === "NONEOF") op = kw, opTok = t, st = "listStart";
      else st = "bad";
    } else if (st === "lat2") st = t.t === "word" ? "latClose" : "bad";
    else if (st === "latClose") {
      if (t.v === ")") depth = Math.max(0, depth - 1), field = LAT_FIELD, st = "op";
      else st = "bad";
    } else if (st === "notc") st = kw === "CONTAINS" ? (op = "NOT CONTAINS", "value") : "bad";
    else if (st === "ipop") st = kw === "IN_RANGE" || kw === "NOT_IN_RANGE" ? (op = "IP " + kw, "value") : "bad";
    else if (st === "listStart") st = t.v === "[" ? (used = [], inList = true, "list") : "bad";
    else if (st === "value") {
      if (t.v === "[" && t.t === "punct") used = [], inList = true, st = "list";
      else if (t.t === "str" || t.t === "num" || t.t === "bool") st = between ? "betAnd" : "joiner", eq = (op === "==" || op === "!=") && opTok ? { op, from: opTok.s, to: t.e, vals: [t.v] } : null;
      else st = "bad";
    } else if (st === "list") {
      if (t.t === "str" || t.t === "num" || t.t === "bool") used.push(t.v);
      else if (t.v === "]") inList = false, st = "joiner", eq = (op === "ANYONE" || op === "NONEOF") && opTok ? { op, from: opTok.s, to: t.e, vals: [...used] } : null;
      else if (t.v !== ",") st = "bad";
    } else if (st === "betAnd") st = kw === "AND" ? (between = false, "value") : "bad";
    else if (st === "joiner") {
      if (kw === "AND" || kw === "OR") st = "term", field = null, op = null, eq = null;
      else if (t.v === ")" && t.t === "punct") depth = Math.max(0, depth - 1);
      else st = "bad";
    }
  }
  let to = caret;
  const tail = src.slice(caret).match(/^(?:[A-Za-z0-9_.-]|\\\.)+/);
  if (part && part.t !== "str" && tail) to += tail[0].length;
  if (part && part.t === "str") {
    const m = src.slice(caret).match(/^(?:[^"\\\n]|\\.)*"/);
    if (m) to += m[0].length;
  }
  const from = part ? part.s : caret;
  const q = part ? (part.t === "str" ? part.v : part.raw).toLowerCase() : "";
  const before = src.slice(0, from);
  const pad = before && !/[\s([]$/.test(before) ? " " : "";
  const res = (kind, title, items, extra) => ({ kind, title, items, from, to, q, ...extra });
  const kws = (list, title) => res("kw", title, list.filter((x) => !q || x.label.toLowerCase().startsWith(q) || x.label.toLowerCase().includes(" " + q)));
  if (st === "term") {
    const items = [];
    const match = (s) => !q || s.toLowerCase().includes(q);
    for (const f of schema.fields) if (match(f.path)) items.push({ kind: "field", label: f.path, insert: f.path + " ", type: f.type, count: f.count, group: f.group, reopen: true });
    const at = items.findIndex((x) => x.group !== "Common");
    if (match("latency") || match(LATENCY)) items.splice(at < 0 ? items.length : at, 0, { kind: "field", label: LATENCY, sub: "latency in ms", insert: LATENCY + " ", type: "latency", group: "Common", reopen: true });
    if (match("not")) items.push({ kind: "kw", label: "NOT", sub: 'exclude matching calls, e.g. NOT data.request.verb == "GET"', insert: "NOT ", group: "Logic", reopen: true, pin: true });
    if (!q) items.push({ kind: "kw", label: "(", sub: "start a group", insert: "(", group: "Logic", reopen: true, pin: true });
    return res("fields", "Fields", items, { total: schema.fields.length });
  }
  if (st === "op") {
    if (!field || !field.type) return null;
    const allowed = opsFor(field);
    const ops = BUILD_OPS.flatMap(([g, list]) => list.flatMap((o) => o === "~" || o === "!~" ? [o, o + "*"] : [o]).map((o) => [o, g])).filter(([o]) => allowed.includes(o) && (!q || o.toLowerCase().startsWith(q) || OP_INFO[o].includes(q)));
    const hasValues = VALUE_FIELDS.includes(field.path);
    const after = src.slice(to);
    const valued = /^\s*(?:"|\[|-?\d|true\b|false\b)/i.test(after);
    const items = ops.map(([o, group]) => {
      let insert = o + " ";
      let caretAt = null;
      let reopen = false;
      if (o === "PRESENT" || o === "ABSENT" || o === "BETWEEN" || CMP.has(o)) reopen = true;
      else if (o === "ANYONE" || o === "NONEOF") insert = o + " []", caretAt = insert.length - 1, reopen = hasValues || field.type === "boolean";
      else if (o.startsWith("IP")) insert = o + ' ""', caretAt = insert.length - 1, reopen = true;
      else if (o === "==" || o === "!=") {
        if (hasValues || field.type === "boolean") reopen = true;
        else if (field.type !== "number" && field.type !== "latency") insert = o + ' ""', caretAt = insert.length - 1;
      } else if (TEXT_OPS.has(o)) insert = o + ' ""', caretAt = insert.length - 1, reopen = o.includes("~");
      if (valued) insert = o + (/^\s/.test(after) ? "" : " "), caretAt = null, reopen = false;
      return { kind: "op", label: o, sub: OP_INFO[o], insert, caretAt, reopen, group };
    });
    return res("ops", "Operators", items, { field });
  }
  if (st === "notc") return kws([{ kind: "op", label: "CONTAINS", sub: OP_INFO["NOT CONTAINS"], insert: 'CONTAINS ""', caretAt: 10 }], "Operators");
  if (st === "ipop") return kws(["IN_RANGE", "NOT_IN_RANGE"].map((x) => ({ kind: "op", label: x, sub: OP_INFO["IP " + x], insert: x + ' ""', caretAt: x.length + 2, reopen: true })), "Operators");
  const catalog = field && CATALOG[field.path];
  const another = (e) => catalog.filter((v) => !e.vals.includes(v)).map((v) => ({ kind: "value", label: lit(v), insert: `${e.op === "!=" || e.op === "NONEOF" ? "NONEOF" : "ANYONE"} [${[...e.vals, v].map(lit).join(", ")}] `, from: e.from, to: e.to, reopen: true, group: "Add another value" }));
  if (st === "value" && catalog && opTok && (op === "==" || op === "!=") && (part == null ? void 0 : part.t) === "str" && catalog.includes(part.v)) return res("values", "Add another value", another({ op, from: opTok.s, to, vals: [part.v] }));
  const ranges = {
    "data.response.statusCode": ["Informational", "Success", "Redirect", "Client error", "Server error"].map((n, i) => [`${i + 1}00 AND ${i + 1}99`, `${i + 1}XX \xB7 ${n}`]),
    "data.request.port": [["0 AND 1023", "Well-known ports"], ["1024 AND 49151", "Registered ports"], ["49152 AND 65535", "Dynamic ports"], ["8000 AND 8999", "8xxx app ports"]]
  };
  const nums = (list, title) => res("ops", title, list.map(([label, sub]) => ({ kind: "op", label: String(label), sub, insert: label + " ", num: true, reopen: true })).filter((x) => !q || x.label.startsWith(q)));
  if (st === "value" && between && (field == null ? void 0 : field.type) === "latency" && !q) return nums([["0 AND 100", "under 100 ms"], ["100 AND 500", "100 to 500 ms"], ["500 AND 1000", "500 ms to 1 s"], ["1000 AND 5000", "1 to 5 s"], ["5000 AND 10000", "5 to 10 s"]], "Example ranges \xB7 latency in ms");
  if (st === "value" && between && ranges[field == null ? void 0 : field.path]) return nums(ranges[field.path], `Example ranges \xB7 ${field.path}`);
  if ((st === "value" || st === "list") && (op == null ? void 0 : op.startsWith("IP"))) {
    const lastTok = toks[toks.length - 1];
    const lead = inList && !part && used.length && !(lastTok && lastTok.v === ",") ? ", " : "";
    return res("ops", `Example ranges \xB7 ${field == null ? void 0 : field.path}`, [["10.0.0.0/8", "Private network, 10.x.x.x"], ["172.16.0.0/12", "Private network, 172.16 to 172.31"], ["192.168.0.0/16", "Private network, 192.168.x.x"], ["127.0.0.0/8", "Loopback"], ["169.254.0.0/16", "Link-local"], ["10.0.0.1-10.0.0.50", "First to last address"]].filter(([v]) => !used.includes(v)).map(([v, sub]) => ({ kind: "op", label: `"${v}"`, sub, insert: lead + `"${v}"` + (inList ? "" : " "), str: true, reopen: true })).filter((x) => !q || x.label.includes(q)), { list: inList });
  }
  if (st === "value" && (op == null ? void 0 : op.includes("~")) && field) {
    const patterns = {
      "data.response.statusCode": [["^5\\d\\d$", "any 5XX code"], ["^4\\d\\d$", "any 4XX code"], ["^(401|403)$", "401 or 403"], ["^2", "starts with 2"]],
      "data.request.verb": [["^(GET|HEAD)$", "GET or HEAD"], ["^P", "POST, PUT or PATCH"], ["^(POST|PUT|PATCH|DELETE)$", "any write method"]]
    }[field.path];
    if (patterns) return res("ops", `Example patterns \xB7 ${field.path}`, patterns.map(([v, sub]) => ({ kind: "op", label: lit(v), sub, insert: lit(v) + " ", str: true, reopen: true })).filter((x) => !q || x.label.toLowerCase().includes(q)));
    if ((part == null ? void 0 : part.t) === "str") {
      const syntax = [["^", "start of text"], ["$", "end of text"], [".", "any one character"], ["\\d", "a digit"], ["\\w", "a letter, digit or _"], ["\\s", "a space"], ["[abc]", "one of a, b or c", "[]", 1], ["[^abc]", "anything except a, b or c", "[^]", 2], ["a|b", "a or b", "|"], ["(ab)", "a group", "()", 1], ["*", "zero or more of the previous"], ["+", "one or more of the previous"], ["?", "previous is optional"], ["{3}", "exactly 3 of the previous", "{}", 1], ["\\.", "a literal dot"]];
      return res("ops", `Regex syntax \xB7 ${field.path}`, syntax.map(([label, sub, ins = label, at]) => ({ kind: "op", label, sub, insert: ins, caretAt: at, from: caret, to: caret, str: true, reopen: true })));
    }
  }
  const bands = {
    "data.response.statusCode": [[100, 199, "1XX"], [200, 299, "2XX"], [300, 399, "3XX"], [400, 499, "4XX"], [500, 599, "5XX"], ""],
    "data.request.port": [[0, 1023, "well-known"], [1024, 49151, "registered"], [49152, 65535, "dynamic"], " ports"]
  }[field == null ? void 0 : field.path];
  if (st === "value" && CMP.has(op) && bands && !q) {
    const cls2 = bands.slice(0, -1);
    const suf = bands[bands.length - 1];
    const test2 = (x, t) => op === "<" ? x < t : op === "<=" ? x <= t : op === ">" ? x > t : x >= t;
    const label = (t) => {
      const cs = cls2.filter(([lo, hi]) => test2(lo, t) && test2(hi, t)).map(([, , n]) => n);
      return cs.length === 1 ? `${cs[0]}${suf} only` : `${cs[0]} ${cs.length === 2 ? "and" : "to"} ${cs[cs.length - 1]}${suf}`;
    };
    const edges = op === "<" || op === ">=" ? cls2.slice(1).map(([lo]) => lo) : cls2.slice(0, -1).map(([, hi]) => hi);
    return nums(edges.map((t) => [t, label(t)]), `Example thresholds \xB7 ${field.path}`);
  }
  if (st === "value" && CMP.has(op) && (field == null ? void 0 : field.type) === "latency" && !q) return nums([[100, "100 ms"], [250, "250 ms"], [500, "500 ms"], [1e3, "1 s"], [2e3, "2 s"], [5e3, "5 s"], [1e4, "10 s"]], "Example thresholds \xB7 latency in ms");
  if (st === "value" && !between && !(op == null ? void 0 : op.startsWith("IP")) && !CMP.has(op) || st === "list") {
    if (!field) return null;
    const fresh = (v) => !used.includes(v);
    let vals = [];
    if (catalog && (op === "==" || op === "!=" || inList)) vals = catalog.filter(fresh).map((v) => ({ v }));
    else if (field.type === "boolean" && (op === "==" || op === "!=" || inList)) vals = [true, false].filter(fresh).map((v) => ({ v }));
    if (!vals.length) return null;
    const lastTok = toks[toks.length - 1];
    const comma = inList && used.length && !(lastTok && lastTok.v === ",") ? ", " : "";
    const items = vals.filter((x) => !q || String(x.v).toLowerCase().startsWith(q.replace(/^"/, ""))).map((x) => ({ kind: "value", label: lit(x.v), insert: (part ? "" : comma) + lit(x.v) + (inList ? "" : " "), reopen: true }));
    return res("values", inList && used.length ? `Add another \xB7 ${field.path}` : `Values \xB7 ${field.path}`, items, { list: inList });
  }
  if (st === "betAnd") return kws([{ kind: "kw", label: "AND", sub: "then the upper bound", insert: pad + "AND " }], "Between");
  if (st === "joiner" || st === "end") {
    const items = [];
    if (st === "joiner") {
      items.push({ kind: "kw", label: "AND", sub: "both must match, e.g. AND data.response.statusCode >= 500", insert: pad + "AND ", reopen: true });
      items.push({ kind: "kw", label: "OR", sub: 'either can match, e.g. OR data.request.verb == "PUT"', insert: pad + "OR ", reopen: true });
      items.push({ kind: "kw", label: "AND NOT", sub: 'exclude matching calls, e.g. AND NOT data.request.path CONTAINS "/health"', insert: pad + "AND NOT ", reopen: true });
      if (depth > 0) items.push({ kind: "kw", label: ")", sub: "close the group, e.g. (A OR B) AND C", insert: ") ", trim: true, reopen: true });
    }
    if (st === "joiner" && eq && catalog && !q) return res("kw", "Combine", [...another(eq), ...items.map((x) => ({ ...x, group: "Join conditions", pin: true }))]);
    return kws(items, "Combine");
  }
  return null;
}
var uid = 0;
var nid = () => "b" + ++uid;
var RE_META = /[.*+?^${}()|[\]\\]/;
var escRe = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var unescRe = (p) => {
  let out = "";
  for (let i = 0; i < p.length; i++) {
    if (p[i] === "\\" && i + 1 < p.length && RE_META.test(p[i + 1])) out += p[++i];
    else if (RE_META.test(p[i])) return null;
    else out += p[i];
  }
  return out;
};
var BUILD_OPS = [
  ["Equality", ["==", "!=", "ANYONE", "NONEOF"]],
  ["Compare", ["<", "<=", ">", ">=", "BETWEEN"]],
  ["Text", ["CONTAINS", "NOT CONTAINS", "~", "!~"]],
  ["Existence", ["PRESENT", "ABSENT"]],
  ["Network", ["IP IN_RANGE", "IP NOT_IN_RANGE"]]
];
var arity = (op) => op === "PRESENT" || op === "ABSENT" ? "none" : op === "BETWEEN" ? "two" : op === "ANYONE" || op === "NONEOF" ? "list" : op.startsWith("IP") ? "ip" : "one";
var isComplete = (c) => {
  if (!c.field) return false;
  const a = arity(c.op);
  const vals = c.values.filter((v) => String(v).trim());
  return a === "none" || (a === "two" ? vals.length === 2 : vals.length > 0);
};
var newCond = () => ({ kind: "cond", id: nid(), field: "", op: "==", values: [], ci: false, not: false });
function toTree(ast) {
  const root = { kind: "group", id: nid(), join: "AND", not: false, items: [] };
  if (!ast) return root;
  const node = (n, not = false) => {
    if (n.k === "not") return node(n.x, !not);
    if (n.k === "group") return node(n.x, not);
    if (n.k === "and" || n.k === "or") return { kind: "group", id: nid(), join: n.k.toUpperCase(), not, items: n.items.map((x) => node(x)) };
    let op = n.op;
    let ci = false;
    if (op === "~*" || op === "!~*") ci = true, op = op.slice(0, -1);
    let values = n.op === "BETWEEN" ? [String(n.lo.v), String(n.hi.v)] : n.vals ? n.vals.map((v) => String(v.v)) : n.val ? [String(n.val.v)] : [];
    if (ci) {
      const plain = unescRe(values[0]);
      if (plain !== null) op = op === "~" ? "CONTAINS" : "NOT CONTAINS", values = [plain];
    }
    return { kind: "cond", id: nid(), field: n.field, op, values, ci, not };
  };
  if (ast.k === "and") root.items = ast.items.map((x) => node(x));
  else {
    const one = node(ast);
    if (one.kind === "group" && !one.not) root.join = one.join, root.items = one.items;
    else root.items = [one];
  }
  return root;
}
function fromTree(root, schema) {
  const quoted = (field) => {
    const f = field === "@latency" ? LAT_FIELD : schema.byPath[field];
    return !f || f.type !== "number" && f.type !== "boolean" && f.type !== "latency";
  };
  const cond = (c) => {
    const head = c.field === "@latency" ? LATENCY : c.field;
    const vals = c.values.map((v) => String(v).trim()).filter(Boolean);
    const val = (v) => quoted(c.field) ? lit(v) : v;
    const a = arity(c.op);
    let s;
    if (a === "none") s = `${head} ${c.op}`;
    else if (a === "two") s = `${head} BETWEEN ${vals[0]} AND ${vals[1]}`;
    else if (a === "list") s = `${head} ${c.op} [${vals.map(val).join(", ")}]`;
    else if (a === "ip") s = `${head} ${c.op} ${vals.length > 1 ? `[${vals.map(lit).join(", ")}]` : lit(vals[0])}`;
    else if (CMP.has(c.op)) s = `${head} ${c.op} ${vals[0]}`;
    else if (c.op === "CONTAINS" || c.op === "NOT CONTAINS") s = c.ci ? `${head} ${c.op === "CONTAINS" ? "~*" : "!~*"} ${lit(escRe(vals[0]))}` : `${head} ${c.op} ${lit(vals[0])}`;
    else if (c.op === "~" || c.op === "!~") s = `${head} ${c.op}${c.ci ? "*" : ""} ${lit(vals[0])}`;
    else s = `${head} ${c.op} ${val(vals[0])}`;
    return c.not ? `NOT ${s}` : s;
  };
  const group = (g, top) => {
    const parts = g.items.map((x) => [x.j || g.join, x.kind === "group" ? group(x, false) : isComplete(x) ? cond(x) : ""]).filter((x) => x[1]);
    if (!parts.length) return "";
    const body = parts.map(([j, x], i) => i ? ` ${j} ${x}` : x).join("");
    if (top) return body;
    if (parts.length === 1) return g.not ? `NOT ${body.startsWith("NOT ") ? `(${body})` : body}` : body;
    return `${g.not ? "NOT " : ""}(${body})`;
  };
  return group(root, true);
}

// src/react/QueryBox.jsx
var import_react2 = require("react");
var import_react3 = require("@phosphor-icons/react");

// src/react/Builder.jsx
var import_react = require("react");
var P = __toESM(require("@phosphor-icons/react"), 1);

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
var import_jsx_runtime = require("react/jsx-runtime");
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
var CATALOG2 = { "data.request.verb": METHODS, "data.response.statusCode": STATUS_CODES };
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
  const ref = (0, import_react.useRef)(null);
  const close = (0, import_react.useRef)(onClose);
  close.current = onClose;
  const [pos, setPos] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, style: { position: "fixed", zIndex: 70, width, ...pos }, className: "rounded-md border border-stroke-subsection bg-surface-default-l1 shadow-e300", children });
}
function FieldPicker({ value, schema, onPick, autoOpen, placeholder = "Add field" }) {
  const btn = (0, import_react.useRef)(null);
  const [open, setOpen] = (0, import_react.useState)(autoOpen);
  const [q, setQ] = (0, import_react.useState)("");
  const x = q.trim().toLowerCase();
  const common = [...schema.fields.filter((f) => f.group === "Common").map((f) => ({ path: f.path, hint: HINT[f.path] || "" })), { path: "@latency", hint: "Latency in ms" }].filter((c) => !x || (c.path === "@latency" ? LATENCY : c.path).toLowerCase().includes(x) || c.hint.toLowerCase().includes(x));
  const all = schema.fields.filter((f) => f.group !== "Common" && (!x || f.path.toLowerCase().includes(x))).slice(0, 80);
  const pick = (p) => {
    onPick(p);
    setOpen(false);
    setQ("");
  };
  const label = value === "@latency" ? LATENCY : value;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "relative min-w-0 shrink", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ref: btn, onClick: () => setOpen(!open), "aria-expanded": open, "data-pqb-tip": value ? void 0 : "Pick a field", className: `flex h-7 max-w-[440px] items-center rounded-md border text-left ${value ? `px-1 ${open ? "border-stroke-active bg-surface-default-ground" : "border-transparent hover:bg-surface-hover-l1-hover"}` : `border-dashed bg-surface-default-ground px-2 ${open ? "border-stroke-active" : "border-stroke-section hover:border-stroke-active"}`}`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `min-w-0 truncate text-interface-body-s-normal ${value ? "font-mono text-base-blue-1100" : "text-text-default-disabled"}`, children: value ? label : placeholder }) }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Menu, { anchor: btn, width: 420, onClose: () => setOpen(false), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.MagnifyingGlass, { size: 14, className: "text-icon-default" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-h-[280px] overflow-y-auto no-scrollbar pb-1", children: [
        [["Common", common], ...Object.entries(all.reduce((g, f) => ((g[f.group] ||= []).push(f), g), {}))].filter(([, list]) => list.length).map(([g, list]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { position: "sticky", top: 0, zIndex: 1 }, className: "flex items-center justify-between gap-3 bg-surface-default-l1 px-2.5 pb-0.5 pt-1.5 text-interface-titles-caption text-text-default-subdued", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "min-w-0 truncate", children: `FIELDS / ${g}`.toUpperCase() }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "shrink-0 text-interface-labels-xs-normal text-text-default-subtle", children: list.length })
          ] }),
          g === "Common" ? list.map((c) => {
            var _a;
            const Icon = TYPE_ICON[c.path === "@latency" ? "latency" : (_a = schema.byPath[c.path]) == null ? void 0 : _a.type] || P.TextT;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => pick(c.path), className: "flex w-full items-center gap-2 px-2.5 py-1 text-left hover:bg-surface-hover-l1-hover", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 12, className: "shrink-0 text-icon-subtle" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "min-w-0 flex-1 truncate font-mono text-code-editor-small text-text-default-regular", children: c.path === "@latency" ? LATENCY : c.path }),
              value === c.path && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Check, { size: 12, className: "shrink-0 text-icon-default" })
            ] }, c.path);
          }) : list.map((f) => {
            const Icon = TYPE_ICON[f.type] || P.TextT;
            return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => pick(f.path), className: "flex w-full items-center gap-2 px-2.5 py-1 text-left hover:bg-surface-hover-l1-hover", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 12, className: "shrink-0 text-icon-subtle" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "min-w-0 flex-1 truncate font-mono text-code-editor-small text-text-default-regular", children: f.path }),
              value === f.path && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Check, { size: 12, className: "shrink-0 text-icon-default" })
            ] }, f.path);
          })
        ] }, g)),
        !common.length && !all.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "px-2.5 py-2 text-interface-body-s-light text-text-default-subdued", children: [
          "No field matches \u201C",
          q,
          "\u201D"
        ] })
      ] })
    ] })
  ] });
}
function OpPicker({ value, type, onPick }) {
  const btn = (0, import_react.useRef)(null);
  const [open, setOpen] = (0, import_react.useState)(false);
  const [q, setQ] = (0, import_react.useState)("");
  const allowed = opsFor({ type });
  const x = q.trim().toLowerCase();
  const groups = BUILD_OPS.map(([name, ops]) => [name, ops.filter((o) => allowed.includes(o) && (!x || `${o} ${OP_INFO[o]}`.toLowerCase().includes(x)))]).filter(([, ops]) => ops.length);
  const pick = (o) => {
    onPick(o);
    setOpen(false);
    setQ("");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "relative shrink-0", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ref: btn, onClick: () => setOpen(!open), "aria-expanded": open, "data-pqb-tip": OP_INFO[value], className: `mt-[3px] flex h-[22px] min-w-[22px] items-center justify-center rounded px-1.5 bg-surface-color-blue-default-subtle hover:bg-surface-color-blue-hover-subtle ${open ? "ring-1 ring-stroke-active" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "whitespace-nowrap font-mono text-code-editor-small font-semibold text-text-color-blue", children: value }) }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Menu, { anchor: btn, width: 320, onClose: () => setOpen(false), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.MagnifyingGlass, { size: 14, className: "text-icon-default" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-h-[320px] overflow-y-auto no-scrollbar py-1", children: [
        groups.map(([name, ops]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "px-2.5 pb-0.5 pt-1.5 text-interface-titles-caption text-text-default-subdued", children: name.toUpperCase() }),
          ops.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { onClick: () => pick(o), className: `flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-surface-hover-l1-hover ${o === value ? "bg-surface-color-blue-default-subtle" : ""}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-[72px] shrink-0 truncate rounded bg-surface-default-underground px-1 py-0.5 text-center font-mono text-code-editor-small text-text-default-subtle", children: o.replace("IP ", "") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex min-w-0 flex-1 flex-col", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-interface-body-s-normal text-text-default-regular", children: OP_INFO[o] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "truncate font-mono text-interface-labels-xs-light text-text-default-subdued", children: EXAMPLE[o] })
            ] }),
            o === value && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Check, { size: 12, className: "shrink-0 text-icon-default" })
          ] }, o))
        ] }, name)),
        !groups.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "px-2.5 py-2 text-interface-body-s-light text-text-default-subdued", children: [
          "No operator matches \u201C",
          q,
          "\u201D"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "border-t border-stroke-subsection px-2.5 py-1.5 text-interface-labels-xs-light text-text-default-subdued", children: [
        "Showing operators for ",
        TYPE_LABEL[type],
        " fields"
      ] })
    ] })
  ] });
}
function Options({ list, value, field, quoted, onPick, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex max-h-[280px] flex-col gap-1 overflow-y-auto no-scrollbar p-2", children: [
    Object.entries(list.reduce((g, v) => ((g[/^\d{3}$/.test(v) ? v[0] + "XX" : ""] ||= []).push(v), g), {})).map(([k, vs]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex flex-wrap items-center gap-1", children: [
      k && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-8 shrink-0 text-interface-labels-xs-normal text-text-default-subdued", children: k }),
      vs.map((v) => {
        const st = valueStyle(v, field);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onMouseDown: (e) => e.preventDefault(), onClick: () => onPick(v), style: { ...st, outline: v === value ? "2px solid var(--color-stroke-active)" : "none", outlineOffset: 1 }, className: `h-6 rounded px-1.5 font-mono text-code-editor-small hover:opacity-80 ${(st == null ? void 0 : st.background) ? "" : "bg-surface-default-underground"} ${st ? "" : "text-text-default-regular"}`, children: quoted && !st ? `"${v}"` : v }, v);
      })
    ] }, k)),
    children
  ] });
}
function ValuePick({ value, options, quoted, onPick, add, field }) {
  const btn = (0, import_react.useRef)(null);
  const [open, setOpen] = (0, import_react.useState)(false);
  const [q, setQ] = (0, import_react.useState)("");
  const x = q.trim().toLowerCase();
  const list = options.filter((o) => !x || o.toLowerCase().includes(x));
  const show = (v) => {
    const st = valueStyle(v, field);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: st ? { ...st, padding: st.background ? "0 4px" : 0 } : void 0, children: quoted && !st ? `"${v}"` : v });
  };
  const pick = (v) => {
    onPick(v);
    setOpen(false);
    setQ("");
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "relative shrink-0", children: [
    add ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ref: btn, onClick: () => setOpen(!open), "aria-expanded": open, "data-pqb-tip": "Add a value", "aria-label": "Add a value", className: ACT, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Plus, { size: 14 }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { ref: btn, onClick: () => setOpen(!open), className: `flex h-7 min-w-[90px] items-center gap-1.5 rounded-md border px-1.5 text-left ${open ? "border-stroke-active" : "border-stroke-subsection hover:border-stroke-active"}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `min-w-0 flex-1 truncate ${value ? "font-mono text-code-editor-small text-text-default-regular" : "text-interface-body-s-normal text-text-default-disabled"}`, children: value ? show(value) : "Pick a value" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.CaretDown, { size: 12, className: "shrink-0 text-text-default-subtle" })
    ] }),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Menu, { anchor: btn, width: field === "data.response.statusCode" ? 420 : 300, onClose: () => setOpen(false), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-2.5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.MagnifyingGlass, { size: 14, className: "text-icon-default" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Options, { list, value, field, quoted, onPick: pick, children: !list.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "px-0.5 py-1 text-interface-body-s-light text-text-default-subdued", children: [
        "Enter adds \u201C",
        q,
        "\u201D"
      ] }) })
    ] })
  ] });
}
function Chips({ values, onValues, placeholder, quoted, field, options }) {
  const [draft, setDraft] = (0, import_react.useState)("");
  const [open, setOpen] = (0, import_react.useState)(false);
  const ref = (0, import_react.useRef)(null);
  const box = (0, import_react.useRef)(null);
  const x = draft.trim().toLowerCase();
  const list = (options || []).filter((o) => !values.includes(o) && (!x || o.toLowerCase().includes(x)));
  const add = (raw) => {
    const vals = raw.split(/[,\n]/).map((v) => v.trim().replace(/^"(.*)"$/s, "$1")).filter(Boolean);
    if (vals.length) onValues([...values, ...vals.filter((v) => !values.includes(v))]);
    setDraft("");
    setOpen(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { ref: box, onClick: () => {
    var _a;
    return (_a = ref.current) == null ? void 0 : _a.focus(), setOpen(true);
  }, className: "flex min-h-7 min-w-0 max-w-[420px] flex-1 cursor-text flex-wrap items-center gap-1 rounded-md border border-stroke-subsection bg-surface-default-ground px-1 py-0.5 focus-within:border-stroke-active", children: [
    values.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: valueStyle(v, field) || void 0, className: "flex h-5 items-center gap-1 rounded bg-surface-default-underground pl-1.5 pr-0.5 font-mono text-code-editor-small text-text-default-regular", children: [
      quoted && !valueStyle(v, field) ? `"${v}"` : v,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            onValues(values.filter((x2) => x2 !== v));
          },
          "aria-label": `Remove ${v}`,
          className: "grid h-4 w-4 place-items-center rounded text-icon-subtle hover:bg-surface-hover-l1-hover",
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.X, { size: 9 })
        }
      )
    ] }, v)),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        ref,
        value: draft,
        placeholder: values.length ? "" : `${placeholder}, then Enter`,
        onFocus: () => setOpen(true),
        onChange: (e) => (setOpen(true), e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value)),
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(x && list[0] ? list[0] : draft);
          }
          if (e.key === "Backspace" && !draft && values.length) onValues(values.slice(0, -1));
        },
        onBlur: () => draft && add(draft),
        className: "h-5 min-w-[90px] flex-1 bg-transparent px-1 font-mono text-code-editor-small text-text-default-regular outline-none placeholder:font-sans placeholder:text-text-default-disabled"
      }
    ),
    open && list.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { anchor: box, width: field === "data.response.statusCode" ? 420 : 300, onClose: () => setOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Options, { list, field, quoted, onPick: add }) })
  ] });
}
function Values({ cond, type, onChange }) {
  const a = arity(cond.op);
  const [one = "", two = ""] = cond.values;
  const set = (values) => onChange({ values });
  const catalog = CATALOG2[cond.field] || (type === "boolean" ? ["true", "false"] : null);
  const quoted = type !== "number" && type !== "boolean" && type !== "latency" && !["<", "<=", ">", ">="].includes(cond.op);
  const placeholder = cond.field === "data.response.statusCode" ? "404" : type === "number" || type === "latency" ? "Number" : type === "ip" ? "10.0.4.12" : type === "boolean" ? "true or false" : "Value";
  const hint = (t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pl-0.5 text-interface-labels-xs-light text-text-default-subdued", children: t });
  const textOp = ["CONTAINS", "NOT CONTAINS", "~", "!~"].includes(cond.op);
  if (a === "none") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex h-7 items-center px-1 text-interface-labels-xs-light text-text-default-subdued", children: "no value needed" });
  if (a === "two")
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex min-w-0 flex-1 items-center gap-1.5", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: one, onChange: (e) => set([e.target.value, two]), inputMode: "decimal", placeholder: "From", className: `${INPUT} w-24` }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-interface-body-s-normal text-text-default-subtle", children: "and" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: two, onChange: (e) => set([one, e.target.value]), inputMode: "decimal", placeholder: "To", className: `${INPUT} w-24` }),
      hint(type === "latency" ? "ms \xB7 both ends included" : "both ends included")
    ] });
  if (a === "list")
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, { values: cond.values, onValues: set, placeholder, quoted, field: cond.field, options: catalog }),
      catalog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ValuePick, { add: true, options: catalog.filter((v) => !cond.values.includes(v)), quoted, field: cond.field, onPick: (v) => set([...cond.values, v]) })
    ] });
  if (a === "ip")
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "flex min-w-0 flex-1 flex-col gap-0.5", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: cond.values.join(", "), onChange: (e) => set(e.target.value.split(",").map((v) => v.trim())), placeholder: "10.0.0.0/24 or 10.0.0.1-10.0.0.50, comma for several", className: `${INPUT} w-full max-w-[340px]` }) });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex min-w-0 flex-1 items-center gap-1.5", children: [
    catalog && (cond.op === "==" || cond.op === "!=") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ValuePick, { value: one, options: catalog, quoted, field: cond.field, onPick: (v) => set([v]) }) : quoted ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex h-7 w-[220px] min-w-0 items-center rounded-md border border-stroke-subsection font-mono text-code-editor-small hover:border-stroke-section focus-within:border-stroke-active", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pl-1.5 text-text-default-subdued", children: cond.op === "~" || cond.op === "!~" ? "/" : '"' }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: one, onChange: (e) => set([e.target.value.replace(/^"(.*)"$/s, "$1")]), placeholder, spellCheck: false, className: "h-full min-w-0 flex-1 bg-transparent px-0.5 text-text-default-regular outline-none placeholder:font-sans placeholder:text-text-default-disabled" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pr-1.5 text-text-default-subdued", children: cond.op === "~" || cond.op === "!~" ? "/" : '"' })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { value: one, onChange: (e) => set([e.target.value]), inputMode: type === "boolean" ? void 0 : "decimal", placeholder, className: `${INPUT} w-[180px]` }),
    type === "latency" && hint("ms"),
    textOp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onChange({ ci: !cond.ci }), "aria-pressed": cond.ci, "data-pqb-tip": cond.ci ? "Any case (click for exact case)" : "Exact case (click for any case)", className: `h-6 shrink-0 rounded px-1.5 font-mono text-interface-labels-xs-normal font-semibold ${cond.ci ? "bg-surface-color-blue-default-subtle text-text-color-blue" : "text-text-default-subtle hover:bg-surface-hover-l1-hover"}`, children: "Aa" })
  ] });
}
function RowActions({ item, depth, parentJoin, onRoot }) {
  const btn = (0, import_react.useRef)(null);
  const [open, setOpen] = (0, import_react.useState)(false);
  const row = "flex h-8 w-full items-center gap-2 px-2.5 text-left text-interface-body-s-normal text-text-default-regular hover:bg-surface-hover-l1-hover";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex shrink-0 items-center", children: [
    depth < 2 && item.kind === "cond" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onRoot((r) => update(r, item.id, (c) => ({ kind: "group", id: newCond().id, join: parentJoin === "AND" ? "OR" : "AND", not: false, items: [c, newCond()] }))), "data-pqb-tip": "Branch", "aria-label": "Branch from this condition", className: ACT, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.TreeView, { size: 14 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onRoot((r) => tidy(remove(r, item.id), true)), "data-pqb-tip": item.kind === "group" ? "Remove group" : "Remove condition", "aria-label": "Remove", className: `${ACT} hover:text-text-color-red`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Trash, { size: 14 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "relative", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { ref: btn, onClick: () => setOpen(!open), "aria-expanded": open, "aria-label": "More", "data-pqb-tip": "More", className: ACT, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.DotsThreeVertical, { size: 16, weight: "bold" }) }),
      open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { anchor: btn, width: 200, onClose: () => setOpen(false), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "py-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            onClick: () => {
              onRoot((r) => insertAfter(r, item.id, clone(item)));
              setOpen(false);
            },
            className: row,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Copy, { size: 14, className: "text-icon-default" }),
              "Duplicate"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            onClick: () => {
              onRoot((r) => update(r, item.id, (x) => ({ ...x, not: !x.not })));
              setOpen(false);
            },
            className: row,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Prohibit, { size: 14, className: "text-icon-default" }),
              item.not ? "Remove NOT" : "Negate with NOT"
            ]
          }
        )
      ] }) })
    ] })
  ] });
}
var NotChip = ({ onClick }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick, "data-pqb-tip": "Negated, click to remove NOT", className: "mt-[3px] h-[22px] shrink-0 rounded bg-surface-color-red-default-subtle px-1.5 font-mono text-code-editor-small font-semibold text-text-color-red", children: "NOT" });
function Row({ cond, depth, parentJoin, schema, errors, onRoot }) {
  const type = cond.field ? typeOf(cond.field, schema) : "string";
  const set = (patch) => onRoot((r) => update(r, cond.id, (c) => ({ ...c, ...patch })));
  const err = errors.get(cond.id);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "group/row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "inline-flex max-w-full items-start gap-1.5", children: [
      cond.not && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotChip, { onClick: () => set({ not: false }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
      cond.field && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
      cond.field && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Values, { cond, type, onChange: set }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowActions, { item: cond, depth, parentJoin, onRoot })
    ] }),
    err && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "flex items-center gap-1.5 pt-0.5 text-interface-labels-xs-normal text-text-color-red", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Warning, { size: 12, weight: "fill", className: "shrink-0" }),
      err
    ] })
  ] });
}
function Group({ group, depth, schema, errors, onRoot, parentJoin }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "relative pl-6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", className: `absolute left-2 ${depth > 0 ? "top-[14px]" : "top-0"} bottom-[9px] w-px bg-stroke-section` }),
    depth > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "group/row -ml-6 mb-1 flex items-center gap-1.5 pl-6", children: [
      group.not && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotChip, { onClick: () => onRoot((r) => update(r, group.id, (g) => ({ ...g, not: false }))) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-interface-labels-xs-light text-text-default-subdued", children: "Group" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowActions, { item: group, depth, parentJoin, onRoot })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "flex flex-col", children: group.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
      i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onRoot((r) => update(r, item.id, (x) => ({ ...x, j: (item.j || group.join) === "AND" ? "OR" : "AND" }))), "data-pqb-tip": `Switch to ${(item.j || group.join) === "AND" ? "OR" : "AND"}`, className: "relative -ml-6 my-1 block h-5 rounded bg-surface-color-blue-default-subtle px-1.5 text-interface-labels-xs-normal font-semibold text-text-color-blue hover:bg-surface-color-blue-hover-subtle", children: item.j || group.join }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "relative", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": "true", className: "absolute -left-4 top-[14px] h-px w-4 bg-stroke-section" }),
        item.kind === "cond" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { cond: item, depth, parentJoin: item.j || group.join, schema, errors, onRoot }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "-ml-2", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, { group: item, depth: depth + 1, schema, errors, onRoot, parentJoin: item.j || group.join }) })
      ] })
    ] }, item.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "relative -ml-6 mt-1 block h-[18px]", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => onRoot((r) => {
      var _a;
      return r.id === group.id ? { ...r, items: [...r.items, { ...newCond(), j: (_a = group.items[group.items.length - 1]) == null ? void 0 : _a.j }] } : update(r, group.id, (g) => {
        var _a2;
        return { ...g, items: [...g.items, { ...newCond(), j: (_a2 = group.items[group.items.length - 1]) == null ? void 0 : _a2.j }] };
      });
    }), "aria-label": "Add a condition", "data-pqb-tip": "Add a condition", className: "ml-[1px] grid h-[15px] w-[15px] place-items-center rounded-full border border-stroke-section bg-surface-default-l1 text-icon-subtle hover:border-stroke-active hover:text-text-color-blue", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Plus, { size: 9, weight: "bold" }) }) })
  ] });
}
function Builder({ text, schema, onApply, onCancel }) {
  var _a;
  const start = (0, import_react.useMemo)(() => {
    const p = parse(text, schema);
    const ok = text.trim() && !p.errors.length;
    const tree = toTree(ok ? p.ast : null);
    if (!tree.items.length) tree.items = [newCond()];
    return { tree, replaced: !!text.trim() && !ok };
  }, []);
  const [root, setRoot] = (0, import_react.useState)(start.tree);
  const [show, setShow] = (0, import_react.useState)(false);
  const onRoot = (fn) => setRoot((r) => fn(r));
  const out = (0, import_react.useMemo)(() => fromTree(root, schema), [root, schema]);
  const parsed = (0, import_react.useMemo)(() => out ? parse(out, schema) : null, [out, schema]);
  const clean = parsed && !parsed.errors.length ? format(parsed.ast) : out;
  const incomplete = (0, import_react.useMemo)(() => {
    let n = 0;
    const walk = (g) => g.items.forEach((x) => x.kind === "group" ? walk(x) : x.field && !isComplete(x) && n++);
    walk(root);
    return n;
  }, [root]);
  const error = (_a = parsed == null ? void 0 : parsed.errors[0]) == null ? void 0 : _a.msg;
  const blocked = incomplete > 0 || !!error;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "border-t border-stroke-subsection", onMouseDown: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "max-h-[380px] min-h-[96px] overflow-auto scroll-thin bg-surface-default-l1 px-3 pb-2 pt-3", children: [
      start.replaced && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "mb-2 text-interface-labels-xs-light text-text-default-subdued", children: "The query in the bar has an error, so the builder starts empty. Apply replaces it." }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Group, { group: root, depth: 0, schema, errors: /* @__PURE__ */ new Map(), onRoot })
    ] }),
    show && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-stroke-subsection px-3 py-2", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { style: { maxHeight: 200 }, className: "overflow-auto scroll-thin whitespace-pre-wrap break-all font-mono text-code-editor-small leading-5 text-text-default-subdued", children: clean ? paint(parsed && !parsed.errors.length ? format(parsed.ast, null, true) : clean, schema) : "No filter" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center gap-2 border-t border-stroke-subsection px-3 py-2", children: [
      incomplete > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex min-w-0 items-center gap-1.5 text-interface-labels-xs-normal text-text-color-red", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Warning, { size: 12, weight: "fill", className: "shrink-0" }),
        incomplete === 1 ? "Finish 1 condition to run" : `Finish ${incomplete} conditions to run`
      ] }) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "flex min-w-0 items-center gap-1.5 truncate text-interface-labels-xs-normal text-text-color-red", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(P.Warning, { size: 12, weight: "fill", className: "shrink-0" }),
        error
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ml-auto" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: () => setShow(!show), "aria-pressed": show, className: "h-6 shrink-0 rounded-[5px] border border-stroke-subsection bg-surface-default-ground px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-hover-l1-hover", children: show ? "Hide query" : "Show query" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onCancel, className: "h-6 shrink-0 rounded-[5px] border border-stroke-subsection bg-surface-default-ground px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-hover-l1-hover", children: "Cancel" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { disabled: blocked, onClick: () => onApply(clean || ""), className: "h-6 shrink-0 rounded-[5px] border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50", children: "Apply & run" })
    ] })
  ] });
}

// src/react/QueryBox.jsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var ROLE = { field: "text-base-blue-1100", op: "text-text-color-purple", kw: "font-semibold text-text-color-purple", str: "text-text-color-success", num: "text-text-color-cyan", bool: "text-text-color-orange", punct: "text-text-default-subtle" };
var DEFAULT = { kw: ROLE.kw, str: ROLE.str, num: ROLE.num, dur: ROLE.num, bool: ROLE.bool, op: ROLE.op, word: ROLE.field };
var cls = (t) => t.role === "op" && t.t === "op" ? "text-text-default-subdued" : ROLE[t.role] || DEFAULT[t.t] || "";
var TYPE_ICON2 = { string: import_react3.TextT, numtext: import_react3.TextT, number: import_react3.Hash, boolean: import_react3.ToggleLeft, ip: import_react3.Globe, latency: import_react3.Timer };
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
      tip ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "data-pqb-tip": tip, "data-mono": "", className: `${cls(t)} underline decoration-dotted`, children: t.raw }, t.s) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: cls(t), children: t.raw }, t.s)
    );
    at = t.e;
  }
  out.push(text.slice(at));
  return out;
}
function Tips({ root }) {
  const [tip, setTip] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { ref: place, role: "tooltip", style: { position: "fixed", zIndex: 100, left: -9999, top: -9999, background: "#000", fontSize: tip.mono ? 11 : 13, lineHeight: tip.mono ? "16px" : "18px" }, className: `pointer-events-none w-max max-w-[520px] whitespace-pre-wrap break-words rounded-md px-2.5 py-1.5 font-medium text-text-default-static shadow-e300 ${tip.mono ? "font-mono" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", style: { position: "absolute", width: 8, height: 8, background: "#000", transform: "rotate(45deg)" } }),
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
function QueryBox({ text, setText, schema, onRun, tools, actions, runErrors, setRunErrors, runRef, adv, setAdv, placeholder }) {
  var _a, _b, _c, _d;
  const ta = (0, import_react2.useRef)(null);
  const pre = (0, import_react2.useRef)(null);
  const list = (0, import_react2.useRef)(null);
  const nextCaret = (0, import_react2.useRef)(null);
  const stepped = (0, import_react2.useRef)(null);
  const last = (0, import_react2.useRef)(text);
  last.current = text;
  const [caret, setCaret] = (0, import_react2.useState)(0);
  const [focus, setFocus] = (0, import_react2.useState)(false);
  const [open, setOpen] = (0, import_react2.useState)(false);
  const [hl, setHl] = (0, import_react2.useState)(0);
  const sugg = (0, import_react2.useMemo)(() => focus && open ? context(text, caret, schema) : null, [focus, open, text, caret, schema]);
  const items = (sugg == null ? void 0 : sugg.items) || [];
  const parsed = (0, import_react2.useMemo)(() => parse(text, schema), [text, schema]);
  const [ranged, setRanged] = (0, import_react2.useState)(false);
  const startHl = (sugg == null ? void 0 : sugg.title) === "Combine" || (sugg == null ? void 0 : sugg.title) === "Add another value" || ((_a = sugg == null ? void 0 : sugg.title) == null ? void 0 : _a.startsWith("Regex syntax")) ? -1 : 0;
  (0, import_react2.useLayoutEffect)(() => {
    setHl(startHl);
    if (list.current) list.current.scrollTop = 0;
  }, [sugg == null ? void 0 : sugg.kind, sugg == null ? void 0 : sugg.title, sugg == null ? void 0 : sugg.from, startHl]);
  (0, import_react2.useLayoutEffect)(() => {
    if (nextCaret.current !== null && ta.current) {
      ta.current.setSelectionRange(nextCaret.current, nextCaret.current);
      setCaret(nextCaret.current);
      nextCaret.current = null;
    }
  }, [text]);
  (0, import_react2.useEffect)(() => {
    var _a2, _b2;
    (_b2 = (_a2 = list.current) == null ? void 0 : _a2.querySelector("[data-hl]")) == null ? void 0 : _b2.scrollIntoView({ block: "nearest" });
  }, [hl]);
  const visible = (0, import_react2.useMemo)(() => parsed.errors.filter((e) => runErrors || !e.eof && (e.e < caret || caret < e.s || !focus)), [parsed, runErrors, caret, focus]);
  const highlighted = (0, import_react2.useMemo)(() => {
    const out = [];
    let at = 0;
    const marked = visible.find((e) => e.at !== void 0);
    const mark = marked == null ? void 0 : marked.at;
    const lo = marked && Math.min(marked.s, mark);
    const hi = marked && Math.max(marked.e, mark);
    const tint = (a, b) => marked && a >= lo && b <= hi ? " bg-base-red-100" : "";
    const pin = (k) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "relative", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { position: "absolute", left: 0, top: -1, height: 20, width: 2, borderRadius: 1, background: "var(--color-text-color-red)" } }) }, "at" + k);
    for (const t of parsed.toks) {
      if (t.s > at) out.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: tint(at, t.s), children: text.slice(at, t.s) }, "g" + at));
      const bad = visible.some((e) => t.s < e.e && t.e > e.s);
      out.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: (bad ? "text-text-color-red underline decoration-dotted" : cls(t)) + tint(t.s, t.e), children: text.slice(t.s, t.e) }, t.s));
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
    if (e.key === " " && at === el.selectionEnd && live[at - 1] === " " && !((live.slice(0, at).match(/(?<!\\)"/g) || []).length % 2)) {
      e.preventDefault();
      return;
    }
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
    if (value.length === prev.length + 1 && value.slice(pos - 2, pos) === ". " && value.slice(0, pos - 2) + " " + value.slice(pos) === prev) {
      e.target.value = prev;
      setText(prev);
      skip(pos - 1);
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
  const showCard = !adv && focus && open && !ranged && items.length > 0;
  const err = visible[0];
  const showNotice = !adv && !showCard && err && (focus || runErrors);
  const fix = (s, e, t) => {
    edit(text.slice(0, s) + t + text.slice(e), s + t.length, true);
    ta.current.focus();
  };
  const lifted = focus || showNotice || adv;
  const kfmt = (n) => n >= 1e3 ? (n / 1e3).toFixed(2).replace(/\.?0+$/, "") + "k" : n;
  let lastGroup = sugg == null ? void 0 : sugg.title;
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
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
      head && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: `px-2 pb-1 text-interface-titles-caption text-text-default-subdued ${i > 0 ? "pt-2" : ""}`, children: head.toUpperCase() }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { "data-hl": i === hl || void 0, style: { scrollMarginTop: 28 }, onMouseMove: () => i !== hl && setHl(i), onClick: () => accept(it), className: `${row} ${i === hl ? "bg-surface-color-blue-default-subtle" : ""}`, children: [
        it.kind === "field" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          Icon && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { size: 13, className: "shrink-0 text-icon-subtle" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "min-w-0 truncate font-mono text-code-editor-small", children: it.sub ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "font-semibold text-base-blue-1100", children: it.label }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "text-text-default-subtle", children: [
              " ",
              it.sub
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "text-text-default-subtle", children: it.label.slice(0, dot) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "font-semibold text-base-blue-1100", children: it.label.slice(dot) })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "flex-1" }),
          it.count !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "w-9 shrink-0 text-right text-interface-labels-xs-normal text-text-default-subtle", children: kfmt(it.count) })
        ] }),
        (it.kind === "op" || it.kind === "kw") && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `shrink-0 font-mono text-code-editor-small font-semibold ${it.num ? ROLE.num : it.str ? ROLE.str : "text-text-color-purple"}`, children: it.label }),
          it.sub && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ml-auto min-w-0 truncate text-interface-body-s-normal text-text-default-subdued", children: it.sub })
        ] }),
        it.kind === "value" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          vs ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { ...vs, padding: vs.background ? "0 4px" : 0 }, className: "min-w-0 truncate font-mono text-code-editor-small", children: raw }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `min-w-0 truncate font-mono text-code-editor-small ${it.label.startsWith('"') ? ROLE.str : it.label === "true" || it.label === "false" ? ROLE.bool : ROLE.num}`, children: it.label }),
          it.total ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ml-auto h-1 w-14 shrink-0 overflow-hidden rounded-full bg-surface-hover-l1-hover", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "block h-full rounded-full bg-base-blue-500", style: { width: Math.max(4, it.count / it.total * 100) + "%" } }) }) : null,
          it.count !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "w-9 shrink-0 text-right text-interface-labels-xs-normal text-text-default-subtle", children: kfmt(it.count) })
        ] }),
        i === hl && (it.kind === "field" || it.kind === "value") && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("kbd", { className: `${it.kind === "field" || it.total ? "" : "ml-auto"} shrink-0 rounded border border-stroke-subsection bg-surface-default-ground px-1 font-sans text-[10px] leading-4 text-text-default-subtle`, children: "Enter" })
      ] })
    ] }, i);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { "data-qbox": "", className: "relative h-8 min-w-0 flex-1", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `absolute inset-x-0 top-0 rounded-md border ${lifted ? `z-40 bg-surface-default-l1 shadow-e300 ${showNotice && runErrors ? "border-stroke-red-regular" : "border-stroke-active"}` : `${runErrors && parsed.errors.length ? "border-stroke-red-regular" : "border-stroke-subsection"} bg-surface-default-underground`}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-start", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `flex h-[30px] shrink-0 items-center pl-2 ${adv ? "invisible" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react3.Funnel, { size: 14, className: "text-icon-default" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `group/filter relative min-w-0 flex-1 ${adv ? "invisible" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { ref: pre, "aria-hidden": "true", style: focus ? { maxHeight: 210 } : void 0, className: `pointer-events-none px-2 py-[5px] font-mono text-code-editor-small leading-5 ${focus ? "overflow-hidden whitespace-pre-wrap break-words" : "h-[30px] overflow-hidden whitespace-pre"}`, children: [
          highlighted,
          "\u200B"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "textarea",
          {
            ref: ta,
            rows: 1,
            wrap: focus ? "soft" : "off",
            value: text,
            spellCheck: false,
            "aria-label": "Filter",
            placeholder,
            onSelect: (e) => setRanged(e.target.selectionStart !== e.target.selectionEnd),
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
      text && !adv && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "flex h-[30px] shrink-0 items-center", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onMouseDown: (e) => e.preventDefault(), onClick: () => edit("", 0, true), "data-pqb-tip": "Clear filter", "aria-label": "Clear filter", className: "grid h-6 w-6 place-items-center rounded text-icon-default hover:bg-surface-hover-l1-hover", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react3.X, { size: 13 }) }),
        focus && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onMouseDown: (e) => e.preventDefault(), onClick: () => {
          var _a2;
          return (_a2 = navigator.clipboard) == null ? void 0 : _a2.writeText(text);
        }, "data-pqb-tip": "Copy query", "aria-label": "Copy query", className: "grid h-6 w-6 place-items-center rounded text-icon-default hover:bg-surface-hover-l1-hover", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react3.Copy, { size: 13 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "w-1" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "flex h-[30px] shrink-0 items-center gap-0.5 px-1", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { onMouseDown: (e) => e.preventDefault(), onClick: () => {
        if (!adv) ta.current.blur();
        setAdv(!adv);
      }, "aria-pressed": adv, "data-pqb-tip": "Build the filter with AND / OR groups", className: `flex h-6 items-center gap-1 rounded px-1.5 ${adv ? "bg-surface-color-blue-default-subtle text-text-color-blue" : "text-text-default-regular hover:bg-surface-hover-l1-hover"}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react3.TreeStructure, { size: 14, className: adv ? "" : "text-icon-default" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "whitespace-nowrap text-interface-body-s-heavy", children: "Advanced filter" })
      ] }) }),
      (tools || actions) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex shrink-0 self-stretch border-l border-stroke-subsection pl-1 pr-1", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "flex min-h-[30px] flex-col items-stretch", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "flex min-h-[30px] items-center", children: tools }),
        focus && !adv && actions
      ] }) })
    ] }),
    adv && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
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
    showCard && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "border-t border-stroke-subsection", onMouseDown: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: `${grouped || chips && ((_b = rowsOf[0]) == null ? void 0 : _b.head) ? "hidden" : "flex"} items-center justify-between gap-3 px-3 pb-1 pt-2`, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "min-w-0 truncate text-interface-titles-caption text-text-default-subdued", children: sugg.title.toUpperCase() }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { ref: list, style: { maxHeight: 180 }, className: "no-scrollbar overflow-y-auto px-1 pb-1", children: chips ? rowsOf.map((r) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
        r.head && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "px-2 pb-1 pt-2 text-interface-titles-caption text-text-default-subdued", children: (r === rowsOf[0] && r.head !== sugg.title ? `${sugg.title} / ${r.head}` : r.head).toUpperCase() }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex flex-wrap items-center gap-1 px-2 py-1", children: [
          r.cls && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "w-8 shrink-0 text-interface-labels-xs-normal text-text-default-subdued", children: r.cls }),
          r.items.map(([it, i]) => {
            const raw = it.label.replace(/^"(.*)"$/, "$1");
            const vs = valueStyle(raw);
            return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { "data-hl": i === hl || void 0, onMouseMove: () => i !== hl && setHl(i), onClick: () => accept(it), style: { ...vs, outline: i === hl ? "2px solid var(--color-stroke-active)" : "none", outlineOffset: 1 }, className: `h-6 rounded px-1.5 font-mono text-code-editor-small ${(vs == null ? void 0 : vs.background) ? "" : "bg-surface-default-underground"} ${vs ? "" : raw === "true" || raw === "false" ? ROLE.bool : ROLE.str}`, children: vs ? raw : it.label }, i);
          })
        ] })
      ] }, r.items[0][1])) : grouped ? groupsOf.map((g) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { position: "sticky", top: 0, zIndex: 1 }, className: "flex items-center justify-between gap-3 bg-surface-default-l1 px-2 pb-1 pt-2 text-interface-titles-caption text-text-default-subdued", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "min-w-0 truncate", children: (g.group ? `${sugg.title} / ${g.group}` : sugg.title).toUpperCase() }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { children: g.items.map(([it, i]) => renderRow(it, i, true)) })
      ] }, g.items[0][1])) : items.map((it, i) => !it.pin && renderRow(it, i)) }),
      items.some((it) => it.pin) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "border-t border-stroke-subsection px-1 pb-1", children: items.map((it, i) => it.pin && renderRow(it, i)) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "flex items-center gap-3 border-t border-stroke-subsection px-3 py-1.5 text-interface-labels-xs-light text-text-default-subdued", children: [
        ["\u2191\u2193", "move"],
        ["Enter", hl < 0 ? "run" : "add"],
        ["Esc", "close"],
        [MAC ? "\u2318 Enter" : "Ctrl Enter", "run"],
        [MAC ? "\u21E7 Enter" : "Shift Enter", "new line"]
      ].map(([k, l]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("kbd", { className: "rounded border border-stroke-subsection bg-surface-default-ground px-1 font-sans text-[10px] leading-4 text-text-default-subtle", children: k }),
        l
      ] }, k)) })
    ] }),
    showNotice && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "flex items-start gap-1.5 border-t border-stroke-subsection px-2.5 py-1.5", onMouseDown: (e) => e.preventDefault(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react3.Warning, { size: 14, weight: "fill", className: "mt-[3px] shrink-0 text-text-color-red" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "text-interface-labels-xs-normal leading-5 text-text-color-red", children: err.msg }),
        (err.fix || ((_c = err.near) == null ? void 0 : _c.length) > 0) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "mt-1 flex flex-wrap items-center gap-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "mr-1 text-interface-labels-xs-light text-text-default-subdued", children: "Suggestions" }),
          [].concat(err.fix || []).map((f) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { onClick: () => fix(f.s, f.e, f.text), style: { minHeight: 24 }, className: "max-w-full break-words rounded border border-stroke-subsection px-2 py-0.5 text-left font-mono text-interface-labels-xs-normal text-base-blue-1100 hover:bg-surface-hover-l1-hover", children: [
            f.verb || "Use",
            " ",
            f.label
          ] }, f.verb + f.label)),
          (_d = err.near) == null ? void 0 : _d.map((n) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => fix(err.s, err.e, n), style: { minHeight: 24 }, className: "max-w-full break-words rounded border border-stroke-subsection px-2 py-0.5 text-left font-mono text-interface-labels-xs-normal text-base-blue-1100 hover:bg-surface-hover-l1-hover", children: n }, n))
        ] }),
        visible.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "mt-1 text-interface-labels-xs-light text-text-default-subdued", children: [
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
var import_react4 = require("react");
var import_react5 = require("@phosphor-icons/react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var ICON = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
var PIN = "M9 3h6l-1 6 4 4H6l4-4zM12 13v8";
var FUNNEL = "M3 5h18l-7 8v6l-4 2v-8z";
var BELL = "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4";
var BOOKMARK = "M6 3h12v18l-6-4-6 4z";
function QueryChip({ query, schema }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("code", { style: { fontSize: 11, lineHeight: "16px", paddingTop: 1, paddingBottom: 1 }, className: "flex w-fit max-w-full items-center gap-1 rounded border border-stroke-subsection bg-surface-default-underground px-1.5 font-mono text-text-default-regular", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { ...ICON, width: 12, height: 12, className: "shrink-0 text-icon-default", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: FUNNEL }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "data-pqb-tip": query, "data-mono": "", "data-trunc": "", className: "min-w-0 truncate", children: paint(query.replace(/\s+/g, " ").trim(), schema) })
  ] });
}
function Saved({ saved, loading, schema, onPick, onPin, onDelete, onUpdate, onAlert, onSearch, onClose }) {
  const [q, setQ] = (0, import_react4.useState)("");
  const [editing, setEditing] = (0, import_react4.useState)(null);
  const [removing, setRemoving] = (0, import_react4.useState)(null);
  const ref = (0, import_react4.useRef)(null);
  const close = (0, import_react4.useRef)(onClose);
  close.current = onClose;
  (0, import_react4.useEffect)(() => {
    const out = (e) => {
      var _a;
      return !((_a = ref.current) == null ? void 0 : _a.contains(e.target)) && !e.target.closest("[data-pqb-saved]") && close.current();
    };
    document.addEventListener("mousedown", out, true);
    return () => document.removeEventListener("mousedown", out, true);
  }, []);
  const x = q.trim().toLowerCase();
  const hit = saved.filter((s) => !x || s.name.toLowerCase().includes(x) || s.query.toLowerCase().includes(x));
  const err = editing && editing.query.trim() ? parse(editing.query, schema).errors[0] : null;
  const nameTaken = editing && saved.some((s) => s.id !== editing.id && s.name === editing.name.trim());
  const submit = () => {
    if (!editing.name.trim() || !editing.query.trim() || err || nameTaken) return;
    onUpdate(saved.find((s) => s.id === editing.id), { name: editing.name.trim(), query: format(parse(editing.query, schema).ast) });
    setEditing(null);
  };
  const act = "grid h-6 w-6 place-items-center rounded text-text-default-subtle hover:bg-surface-default-l1 hover:text-text-default-regular";
  const item = (s) => removing === s.id ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { onKeyDown: (e) => e.key === "Escape" && (e.stopPropagation(), setRemoving(null)), className: "flex items-center gap-1 bg-surface-hover-l1-hover px-2.5 py-1.5", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "min-w-0 flex-1 truncate text-interface-body-s-heavy text-text-default-regular", children: [
      "Delete \u201C",
      s.name,
      "\u201D?"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { onClick: () => (onDelete(s), setRemoving(null)), className: "h-6 rounded px-2 text-interface-labels-xs-normal font-semibold text-text-color-red hover:bg-surface-default-l1", children: "Delete" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { autoFocus: true, onClick: () => setRemoving(null), className: "h-6 rounded border border-stroke-subsection bg-surface-default-l1 px-2 text-interface-labels-xs-normal font-semibold text-text-default-regular", children: "Cancel" })
  ] }, s.id) : (editing == null ? void 0 : editing.id) === s.id ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      onKeyDown: (e) => {
        if (e.key === "Escape") e.stopPropagation(), setEditing(null);
        else if (e.key === "Enter" && !e.shiftKey && e.target.tagName !== "BUTTON") e.preventDefault(), submit();
      },
      className: "flex flex-col gap-1.5 bg-surface-hover-l1-hover px-2.5 py-1.5",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { autoFocus: true, "aria-label": "Name", value: editing.name, onFocus: (e) => e.target.select(), onChange: (e) => setEditing({ ...editing, name: e.target.value }), className: "rounded border border-stroke-subsection bg-surface-default-l1 px-1.5 py-1 text-interface-body-s-heavy text-text-default-regular outline-none focus:border-stroke-active" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("textarea", { "aria-label": "Query", rows: 3, spellCheck: false, value: editing.query, onChange: (e) => setEditing({ ...editing, query: e.target.value }), style: { fontSize: 11, lineHeight: "16px" }, className: "resize-none rounded border border-stroke-subsection bg-surface-default-l1 px-1.5 py-1 font-mono text-text-default-regular outline-none focus:border-stroke-active" }),
        err && (() => {
          const t = editing.query.replace(/\n/g, " ");
          const from = Math.min(err.s, err.at ?? err.s);
          const to = Math.max(err.e, err.at ?? err.e);
          const lo = Math.max(0, from - 30);
          const hi = Math.min(t.length, to + 30);
          const fixes = [...[].concat(err.fix || []), ...(err.near || []).map((n) => ({ s: err.s, e: err.e, text: n, label: n, plain: true }))];
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-interface-labels-xs-normal text-text-color-red", children: err.msg }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("code", { style: { fontSize: 11, lineHeight: "16px" }, className: "whitespace-pre-wrap break-all rounded border border-stroke-subsection bg-surface-default-l1 px-1.5 py-0.5 font-mono text-text-default-subdued", children: [
              lo > 0 && "\u2026",
              t.slice(lo, from),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "rounded-sm bg-base-red-100 text-text-color-red", children: [
                t.slice(from, err.s),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { className: "font-semibold", children: t.slice(err.s, err.e) }),
                t.slice(err.e, to) || (from === to ? " " : "")
              ] }),
              t.slice(to, hi),
              hi < t.length && "\u2026"
            ] }),
            fixes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-wrap items-center gap-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "mr-1 text-interface-labels-xs-light text-text-default-subdued", children: "Suggestions" }),
              fixes.map((f) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { onClick: () => setEditing({ ...editing, query: editing.query.slice(0, f.s) + f.text + editing.query.slice(f.e) }), style: { minHeight: 24 }, className: "max-w-full break-words rounded border border-stroke-subsection bg-surface-default-l1 px-2 py-0.5 text-left font-mono text-interface-labels-xs-normal text-base-blue-1100 hover:bg-surface-default-underground", children: f.plain ? f.label : `${f.verb || "Use"} ${f.label}` }, (f.verb || "") + f.label))
            ] })
          ] });
        })(),
        !err && nameTaken && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "text-interface-labels-xs-normal text-text-color-red", children: [
          "A saved query is already called ",
          editing.name.trim()
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { onClick: () => setEditing(null), className: "h-6 rounded bg-surface-default-l1 px-2 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-default-underground", children: "Cancel" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { disabled: !editing.name.trim() || !editing.query.trim() || !!err || nameTaken, onClick: submit, className: "h-6 rounded-md border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50", children: "Save" })
        ] })
      ]
    },
    s.id
  ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "group flex items-start gap-2 px-2.5 py-1.5 hover:bg-surface-hover-l1-hover", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { onClick: () => onPick(s), style: { gap: 3 }, className: "flex min-w-0 flex-1 flex-col text-left", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "data-pqb-tip": s.name, "data-trunc": "", className: "max-w-full truncate text-interface-body-s-heavy text-text-default-regular", children: s.name }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(QueryChip, { query: s.query, schema })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "grid shrink-0 self-center", children: [
      s.pinned && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { ...ICON, width: 14, height: 14, role: "img", "aria-label": "Pinned", style: { gridArea: "1 / 1", justifySelf: "end", marginRight: 5 }, className: "text-text-color-blue group-hover:hidden", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: PIN, fill: "currentColor" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: { gridArea: "1 / 1" }, className: "hidden gap-0.5 group-hover:flex", children: [
        onPin && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { "aria-label": s.pinned ? `Unpin ${s.name}` : `Pin ${s.name}`, "data-pqb-tip": s.pinned ? "Unpin" : "Pin", onClick: () => onPin(s, !s.pinned), className: act, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { ...ICON, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: s.pinned ? PIN + "M4 4l16 16" : PIN }) }) }),
        onAlert && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { "aria-label": `Create an alert from ${s.name}`, "data-pqb-tip": "Create alert", onClick: () => onAlert(s.query), className: act, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { ...ICON, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: BELL }) }) }),
        onUpdate && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { "aria-label": `Edit ${s.name}`, "data-pqb-tip": "Edit", onClick: () => (setRemoving(null), setEditing({ id: s.id, name: s.name, query: s.query })), className: act, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { ...ICON, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" }) }) }),
        onDelete && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { "aria-label": `Delete ${s.name}`, "data-pqb-tip": "Delete", onClick: () => (setEditing(null), setRemoving(s.id)), className: `${act} hover:text-text-color-red`, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { ...ICON, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" }) }) })
      ] })
    ] })
  ] }, s.id);
  const pinned = hit.filter((s) => s.pinned);
  const rest = hit.filter((s) => !s.pinned);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { ref, className: "absolute right-0 top-9 z-50 flex w-[380px] flex-col rounded-md border border-stroke-subsection bg-surface-default-l1 shadow-e300", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex h-9 items-center gap-1.5 border-b border-stroke-subsection px-3", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_react5.MagnifyingGlass, { size: 14, className: "shrink-0 text-icon-default" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          autoFocus: true,
          value: q,
          onChange: (e) => {
            setQ(e.target.value);
            onSearch == null ? void 0 : onSearch(e.target.value);
          },
          onKeyDown: (e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "Enter" && hit[0]) onPick(hit[0]);
          },
          placeholder: "Search saved queries",
          className: "min-w-0 flex-1 bg-transparent text-interface-body-s-normal text-text-default-regular outline-none placeholder:text-text-default-disabled"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { maxHeight: "min(520px, 70vh)" }, className: "overflow-y-auto no-scrollbar py-1", children: [
      loading && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "px-3 py-3 text-interface-body-s-light text-text-default-subdued", children: "Loading saved queries" }),
      pinned.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "px-2.5 pb-0.5 pt-1 text-interface-titles-caption text-text-default-subdued", children: "PINNED" }),
        pinned.map(item)
      ] }),
      rest.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: pinned.length ? "mt-1 border-t border-stroke-subsection pt-1" : "", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "px-2.5 pb-0.5 pt-1 text-interface-titles-caption text-text-default-subdued", children: "ALL SAVED" }),
        rest.map(item)
      ] }),
      !loading && !hit.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "px-3 py-5 text-center text-interface-body-s-light text-text-default-subdued", children: q ? "No saved queries match." : "No saved queries yet. Type a filter and press Save." })
    ] })
  ] });
}

// src/react/PostgresQueryBox.jsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var PostgresQueryBox = (0, import_react6.forwardRef)(function PostgresQueryBox2({
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
  onUpdateSaved,
  onSavedSearch,
  onCreateAlert,
  className = ""
}, ref) {
  const root = (0, import_react6.useRef)(null);
  const runRef = (0, import_react6.useRef)(null);
  const [own, setOwn] = (0, import_react6.useState)(defaultValue);
  const text = value ?? own;
  const setText = (t) => {
    if (value === void 0) setOwn(t);
    onChange == null ? void 0 : onChange(t);
  };
  const [runErrors, setRunErrors] = (0, import_react6.useState)(false);
  const [adv, setAdvState] = (0, import_react6.useState)(false);
  const [panel, setPanelState] = (0, import_react6.useState)(false);
  const setAdv = (v) => {
    setAdvState(v);
    if (v) setPanelState(false);
  };
  const setPanel = (v) => {
    setPanelState(v);
    if (v) setAdvState(false);
  };
  const parsed = text.trim() ? parse(text, schema) : null;
  const valid = !!parsed && !parsed.errors.length;
  const clean = valid ? format(parsed.ast) : "";
  const match = onUpdateSaved && (saved == null ? void 0 : saved.find((s) => s.query === clean));
  const [draft, setDraft] = (0, import_react6.useState)(null);
  const popRef = (0, import_react6.useRef)(null);
  const taken = draft && (saved == null ? void 0 : saved.some((s) => s.id !== (match == null ? void 0 : match.id) && s.name === draft.name.trim()));
  (0, import_react6.useEffect)(() => {
    if (!draft) return;
    const out = (e) => {
      var _a;
      return !((_a = popRef.current) == null ? void 0 : _a.contains(e.target)) && setDraft(null);
    };
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, [!draft]);
  const submitDraft = () => {
    if (!draft.name.trim() || taken) return;
    if (match) onUpdateSaved(match, { name: draft.name.trim(), pinned: draft.pinned });
    else onSaveQuery({ name: draft.name.trim(), query: clean, pinned: draft.pinned });
    setDraft(null);
  };
  const openAlert = (q) => {
    var _a, _b;
    (_b = (_a = root.current) == null ? void 0 : _a.querySelector("textarea")) == null ? void 0 : _b.blur();
    setPanel(false);
    const p = parse(q, schema);
    onCreateAlert(format(p.ast), p.ast);
  };
  (0, import_react6.useImperativeHandle)(ref, () => ({
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
    const clean2 = p.errors.length ? s.query : format(p.ast);
    setText(clean2);
    (_a = runRef.current) == null ? void 0 : _a.call(runRef, clean2);
  };
  const extra = tools || saved ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    tools,
    saved && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "relative", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { "data-pqb-saved": "", onMouseDown: (e) => e.preventDefault(), onClick: () => setPanel(!panel), "aria-expanded": panel, "data-pqb-tip": "Saved queries", className: `flex h-6 items-center gap-1.5 rounded px-1.5 hover:bg-surface-hover-l1-hover ${panel ? "bg-surface-hover-l1-hover" : ""}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react7.BookmarksSimple, { size: 14, className: "shrink-0 text-icon-default" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "min-w-0 max-w-[200px] truncate text-interface-body-s-heavy text-text-default-regular", children: "Queries" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "rounded-full bg-surface-hover-l1-hover px-1.5 text-interface-labels-xxs-normal text-text-default-subdued", children: savedCount ?? saved.length }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react7.CaretDown, { size: 12, className: "shrink-0 text-text-default-subtle" })
      ] }),
      panel && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Saved, { saved, loading: savedLoading, schema, onPick: pick, onPin: onPinSaved, onDelete: onDeleteSaved, onUpdate: onUpdateSaved, onAlert: onCreateAlert && openAlert, onSearch: onSavedSearch, onClose: () => setPanel(false) })
    ] })
  ] }) : null;
  const actions = [
    onSaveQuery && ["Save", BOOKMARK, (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      setPanel(false);
      setDraft({ name: (match == null ? void 0 : match.name) ?? text.replace(/\b(?:data|metadata)\.[\w.-]+/g, (x) => x.split(".").pop()).replace(/\s+/g, " ").trim().slice(0, 60), pinned: !!(match == null ? void 0 : match.pinned), top: r.bottom + 6, left: Math.max(8, r.right - 280) });
    }],
    onCreateAlert && ["Create alert", BELL, () => openAlert(text)]
  ].filter(Boolean);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { ref: root, className: `pqb ${className}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex min-w-0 items-start gap-2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(QueryBox, { text, setText, schema, onRun, tools: extra, actions: actions.length > 0 && actions.map(([label, d, go]) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { disabled: !valid, onMouseDown: (e) => e.preventDefault(), onClick: go, className: "flex h-6 items-center gap-1.5 rounded px-1.5 text-left hover:bg-surface-hover-l1-hover disabled:cursor-not-allowed disabled:opacity-50", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("svg", { ...ICON, width: 14, height: 14, className: "shrink-0 text-icon-default", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "whitespace-nowrap text-interface-body-s-normal text-text-default-regular", children: label })
      ] }, label)), runErrors, setRunErrors, runRef, adv, setAdv, placeholder }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("button", { onClick: () => {
        var _a;
        return (_a = runRef.current) == null ? void 0 : _a.call(runRef);
      }, className: "flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-stroke-active bg-surface-default-action px-3 hover:bg-surface-default-action-hover", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_react7.Play, { size: 14, weight: "fill", className: "text-text-default-static" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "whitespace-nowrap text-interface-labels-xs-normal font-semibold text-text-default-static", children: runLabel })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Tips, { root }),
    draft && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "div",
      {
        ref: popRef,
        role: "dialog",
        "aria-label": "Save query as",
        onKeyDown: (e) => {
          if (e.key === "Escape") setDraft(null);
          else if (e.key === "Enter" && e.target.tagName !== "BUTTON") e.preventDefault(), submitDraft();
        },
        style: { position: "fixed", top: draft.top, left: draft.left, width: 280, zIndex: 60 },
        className: "flex flex-col gap-2 rounded-md border border-stroke-subsection bg-surface-default-l1 p-3 shadow-e300",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "text-interface-body-s-heavy text-text-default-regular", children: "Save query as" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { autoFocus: true, "aria-label": "Name", value: draft.name, onFocus: (e) => e.target.select(), onChange: (e) => setDraft({ ...draft, name: e.target.value }), className: "rounded-md border border-stroke-subsection bg-surface-default-underground px-2 py-1.5 text-interface-body-s-normal font-medium text-text-default-regular outline-none focus:border-stroke-active" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("label", { className: "flex cursor-pointer items-center gap-1.5 text-interface-labels-xs-normal font-medium text-text-default-subdued", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("input", { type: "checkbox", checked: draft.pinned, onChange: (e) => setDraft({ ...draft, pinned: e.target.checked }), style: { width: 14, height: 14, margin: 0, accentColor: "var(--color-stroke-active)" } }),
            "Pin to the top of Queries"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(QueryChip, { query: clean, schema }),
          taken && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { className: "text-interface-labels-xs-normal text-text-color-red", children: [
            "A saved query is already called ",
            draft.name.trim()
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { onClick: () => setDraft(null), className: "h-6 rounded px-2 text-interface-labels-xs-normal font-semibold text-text-default-regular hover:bg-surface-hover-l1-hover", children: "Cancel" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { disabled: !draft.name.trim() || taken, onClick: submitDraft, className: "h-6 rounded-md border border-stroke-active bg-surface-default-action px-2.5 text-interface-labels-xs-normal font-semibold text-text-default-static hover:bg-surface-default-action-hover disabled:cursor-not-allowed disabled:opacity-50", children: match ? "Update" : "Save" })
          ] })
        ]
      }
    )
  ] });
});
var PostgresQueryBox_default = PostgresQueryBox;

// src/core/sql.js
var OCT = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
var V4 = `(${OCT}\\.){3}${OCT}`;
var H = "[0-9a-f]{1,4}";
var V6 = [
  `(${H}:){7}${H}`,
  `(${H}:){1,7}:`,
  `(${H}:){1,6}:${H}`,
  `(${H}:){1,5}(:${H}){1,2}`,
  `(${H}:){1,4}(:${H}){1,3}`,
  `(${H}:){1,3}(:${H}){1,4}`,
  `(${H}:){1,2}(:${H}){1,5}`,
  `${H}:(:${H}){1,6}`,
  `:((:${H}){1,7}|:)`,
  `(${H}:){6}${V4}`,
  `(${H}:){1,5}:${V4}`,
  `::(${H}:){0,5}${V4}`
];
var IP_RE = `^(${V4}|${V6.join("|")})$`;
var NUM_RE = "^-?\\d+(\\.\\d+)?$";
var SQL_OP = { "==": "=", "!=": "<>", "<": "<", "<=": "<=", ">": ">", ">=": ">=" };
var str = (s) => {
  if (s.includes("\0")) throw new Error("Text values cannot contain a NUL character");
  return "'" + s.replace(/'/g, "''") + "'";
};
function toSql(ast, schema) {
  const segs = (field) => {
    var _a, _b;
    return ((_b = (_a = schema == null ? void 0 : schema.byPath) == null ? void 0 : _a[field]) == null ? void 0 : _b.segs) || field.split(".");
  };
  const path = (field, last) => {
    const s = segs(field).map(str);
    return `data${s.slice(0, -1).map((k) => `->${k}`).join("")}${last}${s[s.length - 1]}`;
  };
  const json = (field) => `NULLIF(${path(field, "->")},'null'::jsonb)`;
  const text = (field) => path(field, "->>");
  const num = (field) => {
    if (field === "@latency") {
      const a = path(LAT_A, "->");
      const b = path(LAT_B, "->");
      return `(CASE WHEN jsonb_typeof(${a}) = 'number' AND jsonb_typeof(${b}) = 'number' THEN (${a})::numeric - (${b})::numeric END)`;
    }
    const t = text(field);
    return `(CASE WHEN ${t} ~ '${NUM_RE}' THEN (${t})::numeric END)`;
  };
  const numLit = (x) => /^-?\d+(\.\d+)?$/.test(x.raw) ? x.raw : String(Number(x.v));
  const jv = (x) => `to_jsonb(${typeof x.v === "string" ? str(x.v) + "::text" : typeof x.v === "boolean" ? String(x.v) : numLit(x)})`;
  const ipCond = (field, vals) => {
    const t = text(field);
    const v = `(${t})::inet`;
    const m = `(CASE WHEN ${v}<<='::ffff:0.0.0.0/96' THEN '0.0.0.0'::inet+(${v}-'::ffff:0.0.0.0'::inet) ELSE ${v} END)`;
    const nets = vals.filter((x) => !x.includes("-"));
    const tests = vals.filter((x) => x.includes("-")).map((x) => `${m} BETWEEN ${str(x.split("-")[0])}::inet AND ${str(x.split("-")[1])}::inet`);
    if (nets.length) tests.unshift(`${m}<<=ANY(ARRAY[${nets.map(str).join(",")}]::inet[])`);
    return `(CASE WHEN ${t}~*'${IP_RE}' THEN ${tests.join(" OR ")} END)`;
  };
  const cond = (n) => {
    const { field, op } = n;
    if (op === "PRESENT") return `${text(field)} IS NOT NULL`;
    if (op === "ABSENT") return `${text(field)} IS NULL`;
    if (op === "BETWEEN") return `${num(field)} BETWEEN ${numLit(n.lo)} AND ${numLit(n.hi)}`;
    if (op === "ANYONE" || op === "NONEOF") return `${json(field)} ${op === "NONEOF" ? "NOT IN" : "IN"} (${n.vals.map(jv).join(", ")})`;
    if (op.startsWith("IP")) return `${op === "IP NOT_IN_RANGE" ? "NOT " : ""}${ipCond(field, n.vals.map((x) => x.v))}`;
    const v = n.val.v;
    if (op === "CONTAINS") return `strpos(${text(field)}, ${str(v)}) > 0`;
    if (op === "NOT CONTAINS") return `strpos(${text(field)}, ${str(v)}) = 0`;
    if (op.includes("~")) return `${text(field)} ${op} ${str(v)}`;
    if (op === "==" || op === "!=") return `${json(field)} ${SQL_OP[op]} ${jv(n.val)}`;
    return `${num(field)} ${SQL_OP[op]} ${numLit(n.val)}`;
  };
  const one = (n) => {
    if (n.k === "cond") return cond(n);
    if (n.k === "group") return `(${one(n.x)})`;
    if (n.k === "not") return `NOT (${one(n.x)})`;
    return n.items.map(one).join(` ${n.k.toUpperCase()} `);
  };
  return { where: ast ? `(${one(ast)})` : "" };
}

// src/core/index.js
var validate = (text, schema) => {
  var _a;
  return text.trim() ? ((_a = parse(text, schema).errors[0]) == null ? void 0 : _a.msg) || "" : "";
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LATENCY,
  LAT_FIELD,
  METHODS,
  OP_INFO,
  PostgresQueryBox,
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
  toSql,
  toTree,
  tokenize,
  validate
});
//# sourceMappingURL=index.cjs.map