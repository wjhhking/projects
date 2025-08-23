import type { RuntimeOps } from './runtimeOps'

export interface OpsValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const ALLOWED_SYSTEMS = new Set([
  'gridInput',
  'foodSpawner',
  'hudBasic',
  'tetrisCore',
  'lineClear',
  'paddleCore',
  'ballCore',
  'brickFieldCore',
  // generic interpreter ops
  'inputAxis',
  'spawnRect',
  'moveAxis',
  // grid-based gameplay ops
  'gridStep',
  'spawnFood',
  'collectOnOverlap',
  'growTail',
  'wrapOrBounds',
  'selfCollision'
])

const NORMALIZE: Record<string, string> = {
  'tetrominoes': 'tetrisCore',
  'rules.lineClear': 'lineClear',
  'controls.orthogonalStep': 'gridStep',
  'controls.inputAxis': 'inputAxis',
  'controller.orthogonalStep': 'gridStep',
  'controller.inputAxis': 'inputAxis',
  'controller.rotate': 'tetrisCore',
  'spawn.tetromino': 'tetrisCore',
  'hud.basic': 'hudBasic',
  'ui.hudBasic': 'hudBasic',
  'tick': 'gridStep',
  'stepper': 'gridStep'
}

export function validateRuntimeOps(ops: any): OpsValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (typeof ops !== 'object' || ops === null) {
    return { ok: false, errors: ['runtimeOps must be an object'], warnings }
  }

  // world
  if (!ops.world || typeof ops.world !== 'object') {
    errors.push('world must be an object')
  } else {
    const { tileSize, width, height, wrapEdges } = ops.world
    if (typeof tileSize !== 'number' || tileSize < 4 || tileSize > 64) errors.push('world.tileSize must be number 4..64')
    if (typeof width !== 'number' || width < 4 || width > 60) errors.push('world.width must be number 4..60')
    if (typeof height !== 'number' || height < 4 || height > 60) errors.push('world.height must be number 4..60')
    if (wrapEdges != null && typeof wrapEdges !== 'boolean') errors.push('world.wrapEdges must be boolean')
  }

  // systems
  if (!Array.isArray(ops.systems)) {
    errors.push('systems must be an array')
  } else {
    ops.systems.forEach((s: any, i: number) => {
      if (!s || typeof s !== 'object') {
        errors.push(`systems[${i}] must be object`)
        return
      }
      const originalType = s.type
      if (typeof originalType !== 'string') {
        errors.push(`systems[${i}].type must be string`)
        return
      }
      const normalized = NORMALIZE[originalType] || originalType
      if (normalized !== originalType) {
        s.type = normalized
        warnings.push(`systems[${i}].type '${originalType}' normalized to '${normalized}'`)
      }
      if (!ALLOWED_SYSTEMS.has(s.type)) warnings.push(`systems[${i}].type '${s.type}' is not in allowlist; will be ignored by preview`)
      if (s.params != null && typeof s.params !== 'object') errors.push(`systems[${i}].params must be object when present`)
    })
    if (ops.systems.length > 50) warnings.push('too many systems (>50), preview may ignore extras')
  }

  // entities (optional)
  if (ops.entities != null) {
    if (!Array.isArray(ops.entities)) {
      errors.push('entities must be an array when present')
    } else if (ops.entities.length > 200) {
      warnings.push('too many entities (>200), preview may ignore extras')
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}
