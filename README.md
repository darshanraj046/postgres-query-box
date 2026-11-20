# postgres-query-box

A React search box for API transaction logs. People type a query such as `data.response.statusCode >= 500 AND data.request.verb == "POST"` and the box helps them as they go: it suggests fields, operators and values, explains mistakes and offers one-click fixes, and has an Advanced filter for building the same query visually. Saved queries are built in.

The box only handles the query. Your app keeps the results table, the API calls and everything else, and the box tells you when someone runs a query or changes a saved one.

## Install

The package is not on npm yet. Install it from the folder or from your git host:

```
npm install ../postgres-query-box
```

It needs React 18 or newer.

## Quick start

```jsx
import { PostgresQueryBox, schemaFromFields } from 'postgres-query-box'
import 'postgres-query-box/styles.css'

const schema = schemaFromFields([
  { path: 'data.request.verb', type: 'string' },
  { path: 'data.request.path', type: 'string' },
  { path: 'data.response.statusCode', type: 'numtext' },
  { path: 'data.request.port', type: 'number' },
  { path: 'metadata.clientIp', type: 'ip' }
])

export function Search() {
  return <PostgresQueryBox schema={schema} onRun={(text, ast) => loadResults(text)} />
}
```

## Telling the box about your fields

The box needs the list of fields people can search. You have two options:

- `schemaFromFields(fields)` when you already have a list of indexed fields. Each field has a `path` and a `type`. Optional: `group` (the heading it shows under), `count`, and `segs`.
- `buildSchema(rows)` to work the fields out from a sample of records shaped like `{ data, metadata }`.

Field types:

| Type | Use it for |
| --- | --- |
| `string` | text |
| `numtext` | numbers stored as text, such as status codes |
| `number` | real numbers, such as ports |
| `boolean` | true or false |
| `ip` | IP addresses, enables `IP IN_RANGE` |

Some keys contain dots, for example `host.ip` under `metadata.additionalMetadata`. Pass `segs` for those so the box knows where the key starts: `{ path: 'metadata.additionalMetadata.host.ip', segs: ['metadata', 'additionalMetadata', 'host.ip'], type: 'ip' }`. If your field list escapes dots (`host\.ip`), unescape them first.

## Props

| Prop | What it does |
| --- | --- |
| `schema` | The fields, from `schemaFromFields` or `buildSchema`. Required. |
| `value`, `onChange` | Control the text yourself. Leave them out and the box keeps its own text. |
| `defaultValue` | Starting text when you do not pass `value`. |
| `onRun(text, ast)` | Called when someone runs a valid query with Enter, Cmd or Ctrl and Enter, or the Run button. Nothing is called while the query has mistakes. |
| `placeholder`, `runLabel` | Text for the empty box and the Run button. |
| `tools` | Extra buttons shown inside the box, next to Queries. |
| `className` | Added to the outer element. |

The box also has a ref with `focus()`, `run()`, `setText(text)` and `getText()`.

## Saved queries

Pass `saved` and the box shows a Queries button with a panel: search, pinned queries first, then the rest. Each action appears only when you pass its callback. The box never calls an API itself. You save, pin or delete, then pass the new list back in.

```jsx
<PostgresQueryBox
  schema={schema}
  onRun={run}
  saved={saved}
  savedCount={total}
  savedLoading={loading}
  onSelectSaved={(s) => track(s.id)}
  onPinSaved={(s, pinned) => api.pin(s.id, pinned).then(reload)}
  onSaveQuery={({ name, query }) => api.create(name, query).then(reload)}
  onDeleteSaved={(s) => api.remove(s.id).then(reload)}
  onSavedSearch={(text) => setSearch(text)}
/>
```

A saved query is `{ id, name, query, pinned }`. Clicking one loads it into the box and runs it.

## The query language

| What you want | Example |
| --- | --- |
| Exact match | `data.request.verb == "GET"`, `data.response.statusCode != "404"` |
| Compare numbers | `data.response.statusCode >= 500`, `data.request.port < 1024` |
| Range | `data.response.statusCode BETWEEN 400 AND 499` |
| Any of a list | `data.request.verb ANYONE ["PUT", "PATCH"]`, `... NONEOF ["GET"]` |
| Text | `data.request.path CONTAINS "/health"`, `... NOT CONTAINS "/ping"` |
| Pattern | `data.request.path ~ "^/api/v1/.*"`, `~*` ignores case, `!~` and `!~*` negate |
| Field exists | `data.request.headerParams.x-apikey PRESENT`, `... ABSENT` |
| Latency in ms | `(metadata.responseTimestamp - metadata.requestTimestamp) > 2000` |
| IP address | `metadata.clientIp IP IN_RANGE "10.0.0.0/8"`, `... NOT_IN_RANGE ["10.0.0.0/8", "192.168.0.0/16"]` |
| Count | `data.response.statusCode == "401" AND COUNT() > 20 WITHIN 5m GROUP BY metadata.clientIp` |

Join conditions with `AND`, `OR` and `NOT`, and group them with brackets. `AND` binds tighter than `OR`, as in SQL. `COUNT()` goes last.

## What the box gives you, and what it does not

`onRun` hands you the query text in a tidy one-line form, plus a parsed tree (`ast`). Send the text, or build your own request from the tree.

The box does not turn queries into SQL. Turning the text or tree into a Postgres filter is up to your backend.

## Using the engine on its own

Everything the box uses is also available without React, for example to check a saved query on a form or to format text:

```js
import { parse, format, validate, schemaFromFields } from 'postgres-query-box/core'

validate('(data.request.verb == "GET"', schema)
format(parse(text, schema).ast)
format(parse(text, schema).ast, null, true)
```

`validate` returns the first problem in plain words, or an empty string. `format(ast, null, true)` gives the one-condition-per-line layout the box shows while you edit.

## Styling

Import `postgres-query-box/styles.css` once. Every rule is scoped under the box's `.pqb` class, so it does not touch the rest of your page and your page's classes do not leak in. The box uses Inter and Roboto Mono when they are available and falls back to system fonts. It does not load any fonts itself.

## Working on the package

```
npm install
npm test         # query rules and component tests
npm run build    # writes dist/
```

`test/qcheck.mjs` covers the language: every example query, every error message and its fix, and what is suggested at each step. Run the tests after changing `src/core/engine.js`. `dist/` is committed so the package can be installed straight from git, so rebuild before committing.

## License

MIT
