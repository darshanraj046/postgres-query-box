import type { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react'
import type { Ast, Schema } from './core'

export * from './core'

export interface SavedQuery {
  id: string
  name: string
  query: string
  pinned?: boolean
}

export interface PostgresQueryBoxHandle {
  focus(): void
  run(): void
  setText(text: string): void
  getText(): string
}

export interface PostgresQueryBoxProps {
  schema: Schema
  value?: string
  defaultValue?: string
  onChange?: (text: string) => void
  onRun?: (text: string, ast: Ast | null) => void
  placeholder?: string
  runLabel?: string
  tools?: ReactNode
  saved?: SavedQuery[]
  savedCount?: number
  savedLoading?: boolean
  onSelectSaved?: (saved: SavedQuery) => void
  onPinSaved?: (saved: SavedQuery, pinned: boolean) => void
  onSaveQuery?: (draft: { name: string; query: string; pinned: boolean }) => void
  onDeleteSaved?: (saved: SavedQuery) => void
  onSavedSearch?: (text: string) => void
  className?: string
}

export declare const PostgresQueryBox: ForwardRefExoticComponent<PostgresQueryBoxProps & RefAttributes<PostgresQueryBoxHandle>>
