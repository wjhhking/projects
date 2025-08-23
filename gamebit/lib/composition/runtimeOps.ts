// RuntimeOps schema for data-driven preview/runtime

export interface WorldGridConfig {
  tileSize: number
  width: number
  height: number
  wrapEdges?: boolean
}

export interface SystemOp {
  type: string // e.g., 'gridInput', 'foodSpawner', 'hudBasic', 'tetrisCore', 'breakoutCore'
  params?: Record<string, unknown>
}

export type ComponentOp =
  | { type: 'sprite'; spriteId?: string; color?: number }
  | { type: 'snakeBody'; startLength: number; growPerFood: number }
  | { type: 'paddle'; speed: number; sticky?: boolean }
  | { type: 'ball'; speed: number; angleRandomness?: number }
  | { type: 'brickField'; rows: number; cols: number; layoutRef?: string }
  | { type: 'tetrominoes'; allowHold?: boolean; rotationSystem?: 'SRS' | 'none'; showGhost?: boolean }

export interface EntityOp {
  id: string
  name?: string
  components: ComponentOp[]
}

export interface RuntimeOps {
  world: WorldGridConfig
  systems: SystemOp[]
  entities: EntityOp[]
}
