// Composition and MetaTemplate type definitions

export type ParamType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'enum'
  | 'percent'
  | 'seconds'
  | 'vector'

export interface MetaTemplateParam {
  name: string
  type: ParamType
  required?: boolean
  default?: unknown
  enum?: string[]
  min?: number
  max?: number
  step?: number
  description?: string
}

export type SlotKind =
  | 'sprite'
  | 'spritesheet'
  | 'sound'
  | 'tilemap'
  | 'pattern'
  | 'color'
  | 'layout'
  | 'aiProfile'

export interface MetaTemplateSlot {
  name: string
  kind: SlotKind
  description?: string
}

export type MetaTemplateCategory =
  | 'world'
  | 'movement'
  | 'entities'
  | 'objective'
  | 'rules'
  | 'spawning'
  | 'ui'
  | 'projectile'
  | 'camera'

export interface MetaTemplateEvents {
  emits?: string[]
  listens?: string[]
}

export interface MetaTemplate {
  id: string
  title: string
  summary: string
  category: MetaTemplateCategory
  requires?: string[]
  conflicts?: string[]
  provides?: string[]
  events?: MetaTemplateEvents
  params?: MetaTemplateParam[]
  slots?: MetaTemplateSlot[]
  priority?: number
}

// Composition Plan

export type Vector2 = { x: number; y: number }

export type ParamValue = string | number | boolean | Vector2 | string[]

export interface TemplateSelection {
  id: string
  params?: Record<string, ParamValue>
  slots?: Record<string, string>
  enabled?: boolean
}

export type ConflictStrategy = 'priority' | 'last-wins' | 'merge'
export type ConflictTieBreak = 'keep-first' | 'keep-last' | 'error'

export interface ConflictPolicy {
  strategy: ConflictStrategy
  tieBreak?: ConflictTieBreak
  allowUnsafe?: boolean
}

export interface AssetManifest {
  sprites?: Record<string, { src: string; kind?: 'sprite' | 'spritesheet'; frames?: number }>
  sounds?: Record<string, { src: string; loop?: boolean }>
  tilemaps?: Record<string, { src: string; format: 'json' | 'csv' }>
  palettes?: Record<string, { colors: string[] }>
  layouts?: Record<string, unknown>
}

export type ControlScheme = 'keyboard' | 'touch' | 'mixed'

export interface ControlMapping {
  scheme: ControlScheme
  actions: Record<string, string | string[]>
}

export type RuntimeTarget = 'phaser'

export interface CompositionPlan {
  planVersion: '1.0'
  title: string
  description?: string
  targetRuntime: RuntimeTarget
  templates: TemplateSelection[]
  assets?: AssetManifest
  controls?: ControlMapping
  conflictPolicy?: ConflictPolicy
  telemetry?: { debug?: boolean }
}
