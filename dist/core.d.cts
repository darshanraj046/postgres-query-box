export type FieldType = 'string' | 'number' | 'boolean' | 'ip' | 'numtext' | 'latency'

export interface FieldInput {
  path: string
  type?: FieldType
  segs?: string[]
  group?: string
  count?: number
}

export interface Field extends Required<Omit<FieldInput, 'segs'>> {
  segs: string[]
  values: { v: unknown; n: number }[]
}

export interface Schema {
  fields: Field[]
  byPath: Record<string, Field>
  short: Record<string, string>
  total: number
}

export interface QueryError {
  s: number
  e: number
  msg: string
  at?: number
  eof?: boolean
  near?: string[]
  fix?: Fix | Fix[]
}

export interface Fix {
  s: number
  e: number
  text: string
  verb?: string
  label: string
}

export type Ast = Record<string, unknown> & { k: 'cond' | 'and' | 'or' | 'not' | 'group' | 'count' }

export interface Parsed {
  ast: Ast | null
  errors: QueryError[]
  toks: unknown[]
}

export interface Suggestions {
  kind: string
  title: string
  items: { kind: string; label: string; sub?: string; insert: string; group?: string }[]
  from: number
  to: number
}

export declare function buildSchema(rows: { data?: unknown; metadata?: unknown }[]): Schema
export declare function schemaFromFields(fields: FieldInput[], total?: number): Schema
export declare function parse(text: string, schema: Schema): Parsed
export declare function format(ast: Ast | null, name?: ((path: string) => string) | null, pretty?: boolean): string
export declare function validate(text: string, schema: Schema): string
export declare function evaluate(ast: Ast | null, rows: object[]): { rows: object[]; count?: unknown }
export declare function context(text: string, caret: number, schema: Schema): Suggestions | null
export declare function tokenize(text: string): unknown[]
export declare function toTree(ast: Ast | null): unknown
export declare function fromTree(tree: unknown, schema: Schema): string
export declare function opsFor(field: { type: FieldType } | null): string[]
export declare function ipToBig(ip: string): { v: 4 | 6; n: bigint } | null
export declare function parseRange(range: string): { v: 4 | 6; lo: bigint; hi: bigint } | null
export declare const LATENCY: string
export declare const LAT_FIELD: { path: '@latency'; type: 'latency' }
export declare const OP_INFO: Record<string, string>
export declare const METHODS: string[]
export declare const STATUS_CODES: number[]
export declare const TYPE_LABEL: Record<FieldType, string>

export interface SqlCount {
  op: '=' | '<' | '<=' | '>' | '>='
  value: number
  window: number
  by: string[] | null
}

export declare function toSql(ast: Ast | null, schema: Schema): { where: string; count: SqlCount | null }
