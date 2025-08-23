import { CompositionPlan } from './types'
import { RuntimeOps, SystemOp } from './runtimeOps'

export function buildRuntimeOps(plan: CompositionPlan): RuntimeOps {
  // Defaults
  let tileSize = 16
  let width = 20
  let height = 15
  let wrapEdges = false

  const gridSel = plan.templates.find(t => t.id === 'mt.grid.world')
  if (gridSel?.params) {
    tileSize = (gridSel.params['tileSize'] as number) ?? tileSize
    width = (gridSel.params['width'] as number) ?? width
    height = (gridSel.params['height'] as number) ?? height
    wrapEdges = (gridSel.params['wrapEdges'] as boolean) ?? wrapEdges
  }

  const systems: SystemOp[] = plan.templates.map(t => ({ type: `tpl:${t.id}`, params: t.params as any }))

  return {
    world: { tileSize, width, height, wrapEdges },
    systems,
    entities: []
  }
}
