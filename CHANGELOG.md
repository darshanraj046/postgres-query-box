# Changelog

## 0.1.1

- Releases are published from GitHub through the Publish workflow, with npm provenance. The README explains the steps.
- New `typecheck` script, run as part of `npm run check`.

## 0.1.0

First version.

- Query box with suggestions for fields, operators and values, and coloured chips for methods and status codes.
- Mistakes are highlighted where they happen, with a plain message and one-click fixes.
- Long queries are laid out one condition per line while editing.
- Advanced filter for building queries visually.
- Saved queries driven by your callbacks: a Save popover, pinning, Edit and Create alert on each row, and a delete confirmation.
- Engine available on its own from `postgres-query-box/core`.
- `toSql` turns a query into a Postgres `WHERE` condition for a JSONB column, with `COUNT()` returned separately.
- Regex is checked against Postgres rules, with a fix from `\b` to `\y`. Text with a NUL character is an error.
- Suggestions: regex example and syntax cards, threshold examples for status codes, ports and latency, latency `BETWEEN`, operators grouped like the Advanced filter, more one-click fixes.
- Advanced filter: list values suggest as you type, and changing an operator keeps the existing value.
