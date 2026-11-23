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

Pass `saved` and the box shows a Queries button with a panel: search, pinned queries first, then the rest. Each action appears only when you pass its callback. The box never calls an API itself. You save, pin, edit or delete, then pass the new list back in.

While the box is focused, Save and Create alert sit under the Queries button. They are enabled only when the query is valid. Save opens a "Save query as" popover with the name filled in and a pin checkbox. If the query is already saved and you pass `onUpdateSaved`, the popover updates that saved query instead.

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
  onUpdateSaved={(s, changes) => api.update(s.id, changes).then(reload)}
  onSavedSearch={(text) => setSearch(text)}
  onCreateAlert={(query) => openAlertForm(query)}
/>
```

A saved query is `{ id, name, query, pinned }`. Clicking one loads it into the box and runs it. Each row also has Pin, Create alert, Edit (name and query, checked as you type, with the same fixes as the box) and Delete (asks first).

`onUpdateSaved` gets `{ name, query }` from Edit and `{ name, pinned }` from the Save popover.

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

Join conditions with `AND`, `OR` and `NOT`, and group them with brackets. `AND` binds tighter than `OR`, as in SQL.

## What the box gives you, and what it does not

`onRun` hands you the query text in a tidy one-line form, plus a parsed tree (`ast`). Send the text, turn the tree into SQL with `toSql`, or build your own request from the tree.

## Turning a query into SQL

`toSql` turns the tree into a Postgres `WHERE` condition for a table that keeps each log as one JSONB document:

```js
import { parse, toSql } from 'postgres-query-box/core'

const { where } = toSql(parse(text, schema).ast, schema)
// where: "(NULLIF(data -> 'data' -> 'request' -> 'verb', 'null'::jsonb) = to_jsonb('GET'::text) AND ...)"
```

- Fields are read from a JSONB column called `data`.
- `where` is one bracketed condition, ready to follow `AND` or `WHERE`. It is an empty string when the query has no conditions.
- Values are written into the SQL as quoted literals, so `where` can be added to a statement with no extra parameters. Quotes in values are escaped. This relies on `standard_conforming_strings`, which is on by default in Postgres.
- `?` only appears inside quoted text, so the SQL can go through JDBC and other drivers that treat `?` as a placeholder.
- A row that does not fit a condition is left out instead of failing the whole query. For example, a text value in a number field, or something that is not an IP address in an IP field.

The box checks everything Postgres would reject, so a query it accepts does not fail when it runs:

- Regex follows Postgres rules. The box shows an error for patterns Postgres rejects, such as named groups `(?<name>...)`, `\p{L}`, `[^]`, repeats over 255 or patterns too large to compile. It also flags patterns Postgres reads differently from JavaScript. For example, `\b` is a backspace in Postgres, so the box offers `\y` for a word boundary.
- Text with a hidden NUL character shows an error, because Postgres text cannot hold one. `toSql` throws if it is given one.
- Very long numbers are passed through as typed, so they never overflow.

`toSql` and `evaluate` give the same rows. `test/sqlcheck.mjs` checks this against a real Postgres, and also checks that 5,000 random regexes the box accepts all compile there. It needs `psql` on your path and the usual `PG*` connection settings, and it only creates a temporary table.

Escaping makes the SQL safe for the query it was made from. A server that takes SQL text from the browser still runs whatever it is sent, so build the SQL on the server when you can.

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
npm test                   # query rules and component tests
node test/sqlcheck.mjs     # toSql against a real Postgres
npm run css                # regenerates src/styles.css
npm run build              # writes dist/
```

`test/qcheck.mjs` covers the language: every example query, every error message and its fix, and what is suggested at each step. Run the tests after changing `src/core/engine.js`. `dist/` is committed so the package can be installed straight from git, so rebuild before committing.

`src/styles.css` is generated, so do not edit it by hand. `npm run css` reads the design system's Tailwind output in `scripts/tailwind.css`, keeps only the rules for classes used in `src`, scopes them under `.pqb` and writes the result. Run it whenever you add, remove or rename a class in a component. A class that is missing from `scripts/tailwind.css` is not styled. The script lists unknown class-like names at the end of its output. To use a newer Tailwind build, pass its path: `npm run css -- path/to/tailwind.css`. Colour names that start with `mds-` are renamed to `base-` as it reads them. Every rule matches elements inside `.pqb`, so a class on the element that carries `pqb` itself is not styled. Put layout classes on an inner element.

### Releasing

1. Update `version` in `package.json` and add the changes to `CHANGELOG.md`. Run `npm run css` and `npm run build` if anything changed.
2. Commit, tag `vX.Y.Z` with the same version, and push the commit and the tag.
3. Create a GitHub release from the tag. Mark it as a pre-release to publish under the `next` tag instead of `latest`.
4. The Publish workflow checks the tag, runs the tests, checks `toSql` against Postgres and stages the version on npm with provenance.
5. Approve it on npmjs.com or with `npm stage approve <id>`. Approving needs 2FA.

`npm publish` from your own machine is refused on purpose, so every version comes from the workflow and carries provenance.

## License

MIT
