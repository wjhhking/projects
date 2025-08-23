import { CompositionPlan, MetaTemplate, ParamType, TemplateSelection, Vector2 } from './types'
import { metaTemplates } from './inventory'

export interface ValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const isVector2 = (v: unknown): v is Vector2 => {
  return typeof v === 'object' && v !== null && 'x' in (v as any) && 'y' in (v as any)
}

function validateParamType(name: string, type: ParamType, value: unknown, errors: string[]) {
  switch (type) {
    case 'number':
    case 'percent':
    case 'seconds':
      if (typeof value !== 'number') errors.push(`Param ${name} must be number`)
      break
    case 'string':
      if (typeof value !== 'string') errors.push(`Param ${name} must be string`)
      break
    case 'boolean':
      if (typeof value !== 'boolean') errors.push(`Param ${name} must be boolean`)
      break
    case 'enum':
      // enum validation handled using template param enum list
      break
    case 'vector':
      if (!isVector2(value)) errors.push(`Param ${name} must be Vector2 {x,y}`)
      break
    default:
      break
  }
}

export function validateSelection(selection: TemplateSelection, tpl: MetaTemplate): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const paramDefs = tpl.params ?? []
  const provided = selection.params ?? {}

  // required params
  for (const p of paramDefs) {
    if (p.required && !(p.name in provided)) {
      errors.push(`Missing required param ${p.name} for template ${tpl.id}`)
    }
  }

  // validate each provided param
  for (const [key, value] of Object.entries(provided)) {
    const def = paramDefs.find(d => d.name === key)
    if (!def) {
      warnings.push(`Unknown param ${key} for template ${tpl.id}`)
      continue
    }

    validateParamType(key, def.type, value, errors)

    if (def.type === 'enum' && def.enum && typeof value === 'string') {
      if (!def.enum.includes(value)) {
        errors.push(`Param ${key} must be one of ${def.enum.join(', ')}`)
      }
    }

    if (typeof value === 'number') {
      if (typeof def.min === 'number' && value < def.min) warnings.push(`Param ${key} < min ${def.min}`)
      if (typeof def.max === 'number' && value > def.max) warnings.push(`Param ${key} > max ${def.max}`)
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}

export function validateCompositionPlan(plan: CompositionPlan, inventory: Record<string, MetaTemplate> = metaTemplates): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // target runtime
  if (plan.targetRuntime !== 'phaser') {
    errors.push(`Unsupported targetRuntime ${plan.targetRuntime}`)
  }

  // template existence
  for (const sel of plan.templates) {
    const tpl = inventory[sel.id]
    if (!tpl) {
      errors.push(`Unknown template id ${sel.id}`)
      continue
    }
    const res = validateSelection(sel, tpl)
    errors.push(...res.errors)
    warnings.push(...res.warnings)
  }

  // requires present
  const presentIds = new Set(plan.templates.map(t => t.id))
  for (const sel of plan.templates) {
    const tpl = inventory[sel.id]
    if (!tpl) continue
    const req = tpl.requires ?? []
    for (const r of req) {
      if (!presentIds.has(r)) {
        errors.push(`Template ${sel.id} requires ${r} which is not present`)
      }
    }
  }

  // conflicts
  for (let i = 0; i < plan.templates.length; i++) {
    for (let j = i + 1; j < plan.templates.length; j++) {
      const a = plan.templates[i]
      const b = plan.templates[j]
      const ta = inventory[a.id]
      const tb = inventory[b.id]
      if (!ta || !tb) continue
      const cfa = new Set(ta.conflicts ?? [])
      const cfb = new Set(tb.conflicts ?? [])
      if (cfa.has(b.id) || cfb.has(a.id)) {
        warnings.push(`Conflict between ${a.id} and ${b.id}`)
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}
