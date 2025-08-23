export interface EventPayloadMap {
  [eventType: string]: unknown
}

export interface EventBus<T extends EventPayloadMap = EventPayloadMap> {
  emit<K extends keyof T & string>(type: K, payload: T[K]): void
  on<K extends keyof T & string>(type: K, handler: (payload: T[K]) => void): () => void
  off<K extends keyof T & string>(type: K, handler: (payload: T[K]) => void): void
}

export interface WorldContext {
  time: { delta: number; elapsed: number }
  events: EventBus
  resources: ResourceRegistry
}

export type EntityId = string

export interface Transform {
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
}

export interface Component {
  readonly type: string
  onAttach?(entity: Entity, world: World): void
  onDetach?(entity: Entity, world: World): void
  update?(entity: Entity, world: WorldContext): void
}

export interface Entity {
  id: EntityId
  name?: string
  transform: Transform
  tags?: string[]
  components: Component[]
}

export interface System {
  readonly id: string
  priority?: number
  init?(world: World): void
  update(world: WorldContext): void
  dispose?(world: World): void
}

export interface World {
  addEntity(entity: Entity): Entity
  removeEntity(id: EntityId): void
  getEntity(id: EntityId): Entity | undefined
  addSystem(system: System): void
  removeSystem(id: string): void
  tick(delta: number): void
  events: EventBus
  resources: ResourceRegistry
}

export interface SpriteResource {
  id: string
  src: string
  frames?: number
}

export interface SoundResource {
  id: string
  src: string
  loop?: boolean
}

export interface TilemapResource {
  id: string
  src: string
  format: 'json' | 'csv'
}

export interface ResourceRegistry {
  sprites: Record<string, SpriteResource>
  sounds: Record<string, SoundResource>
  tilemaps: Record<string, TilemapResource>
  palettes?: Record<string, { colors: string[] }>
  layouts?: Record<string, unknown>
}

// Common components
export interface SpriteComponent extends Component {
  type: 'sprite'
  spriteId: string
  z?: number
  frame?: number
  flipX?: boolean
  flipY?: boolean
}

export interface PhysicsBodyComponent extends Component {
  type: 'physicsBody'
  velocity?: { x: number; y: number }
  gravity?: { x: number; y: number }
  immovable?: boolean
}

export interface ColliderComponent extends Component {
  type: 'collider'
  shape: 'aabb' | 'circle'
  isSensor?: boolean
  onCollideEvent?: string
}

export interface StateMachineComponent<State extends string = string> extends Component {
  type: 'stateMachine'
  state: State
  transitions: Array<{ from: State; to: State; when: (e: Entity, w: WorldContext) => boolean }>
}
