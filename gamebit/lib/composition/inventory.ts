import { MetaTemplate } from './types'

// Initial catalog of meta-templates. This is intentionally concise.

export const metaTemplates: Record<string, MetaTemplate> = {
  'mt.grid.world': {
    id: 'mt.grid.world',
    title: 'Grid World',
    summary: 'Discrete grid with tile size, bounds, and tick clock.',
    category: 'world',
    provides: ['grid'],
    events: { emits: ['grid:tick'] },
    params: [
      { name: 'tileSize', type: 'number', required: true, min: 4, max: 128, default: 16 },
      { name: 'width', type: 'number', required: true, min: 4, max: 256, default: 20 },
      { name: 'height', type: 'number', required: true, min: 4, max: 256, default: 20 },
      { name: 'wrapEdges', type: 'boolean', default: false },
      { name: 'stepHz', type: 'number', default: 8, min: 1, max: 60 }
    ]
  },
  'mt.physics.platformer': {
    id: 'mt.physics.platformer',
    title: 'Platformer Physics',
    summary: 'Continuous 2D physics with gravity and platform collisions.',
    category: 'world',
    provides: ['physics.platformer'],
    events: { emits: ['phys:collision', 'phys:grounded'], listens: ['move:input', 'jump:input'] },
    params: [
      { name: 'gravityY', type: 'number', default: 800 },
      { name: 'maxVelocity', type: 'number', default: 600 },
      { name: 'friction', type: 'percent', default: 0.1, min: 0, max: 1 },
      { name: 'coyoteMs', type: 'seconds', default: 0.08, min: 0, max: 0.2 }
    ]
  },
  'mt.world.scrollerInfinite': {
    id: 'mt.world.scrollerInfinite',
    title: 'Infinite Scroller',
    summary: 'Horizontal autoscroll with spawn lanes and recycling.',
    category: 'world',
    params: [
      { name: 'scrollSpeed', type: 'number', default: 120 },
      { name: 'lanesY', type: 'vector', description: 'One or more lane Y positions' },
      { name: 'spawnWindow', type: 'number', default: 600 }
    ]
  },
  'mt.world.wrapScreen': {
    id: 'mt.world.wrapScreen',
    title: 'Screen Wrap',
    summary: 'Toroidal wrapping at world edges for entities.',
    category: 'world',
    params: [
      { name: 'wrapMargin', type: 'number', default: 0 }
    ]
  },
  'mt.control.orthogonalStep': {
    id: 'mt.control.orthogonalStep',
    title: 'Orthogonal Step Control',
    summary: 'Grid-stepped movement (up/down/left/right).',
    category: 'movement',
    requires: ['mt.grid.world'],
    params: [
      { name: 'stepPerSecond', type: 'number', default: 8, min: 1, max: 60 },
      { name: 'allowReverse', type: 'boolean', default: false },
      { name: 'inputBufferMs', type: 'seconds', default: 0.1, min: 0, max: 0.5 },
      // Extended keys seen in LLM outputs
      { name: 'dasTicks', type: 'number', default: 10 },
      { name: 'arrTicks', type: 'number', default: 2 },
      { name: 'softDropFactor', type: 'number', default: 10 },
      { name: 'hardDrop', type: 'boolean', default: true }
    ]
  },
  'mt.control.platformer': {
    id: 'mt.control.platformer',
    title: 'Platformer Control',
    summary: 'Left/right run and jump input mapping.',
    category: 'movement',
    requires: ['mt.physics.platformer'],
    params: [
      { name: 'runSpeed', type: 'number', default: 240 },
      { name: 'airControl', type: 'percent', default: 0.4, min: 0, max: 1 },
      { name: 'jumpImpulse', type: 'number', default: 380 },
      { name: 'maxJumps', type: 'number', default: 1, min: 1, max: 3 }
    ]
  },
  'mt.control.singleButtonImpulse': {
    id: 'mt.control.singleButtonImpulse',
    title: 'Single-Button Impulse',
    summary: 'Flap/impulse upward on a single button.',
    category: 'movement',
    params: [
      { name: 'impulse', type: 'number', default: 280 },
      { name: 'cooldownMs', type: 'seconds', default: 0.15, min: 0, max: 1 }
    ]
  },
  'mt.actor.snakeBody': {
    id: 'mt.actor.snakeBody',
    title: 'Snake Body',
    summary: 'Head-tail body that grows and follows positions.',
    category: 'entities',
    requires: ['mt.grid.world', 'mt.control.orthogonalStep'],
    params: [
      { name: 'startLength', type: 'number', default: 3, min: 1, max: 100 },
      { name: 'growPerFood', type: 'number', default: 1, min: 1, max: 10 }
    ],
    events: { emits: ['snake:selfCollision', 'snake:ate'], listens: ['grid:tick'] }
  },
  'mt.actor.tetrominoes': {
    id: 'mt.actor.tetrominoes',
    title: 'Tetrominoes',
    summary: '7 Tetris pieces with rotations.',
    category: 'entities',
    requires: ['mt.grid.world'],
    params: [
      { name: 'allowHold', type: 'boolean', default: true },
      { name: 'rotationSystem', type: 'enum', enum: ['SRS', 'none'], default: 'SRS' },
      { name: 'showGhost', type: 'boolean', default: true },
      // Extended keys seen in LLM outputs
      { name: 'rotation', type: 'enum', enum: ['SRS', 'none'], default: 'SRS' },
      { name: 'previewCount', type: 'number', default: 3 },
      { name: 'gravityTicks', type: 'number', default: 48 },
      { name: 'lockDelayTicks', type: 'number', default: 30 },
      { name: 'ghostPiece', type: 'boolean', default: true },
      { name: 'holdPiece', type: 'boolean', default: true },
      { name: 'spawnPos', type: 'vector' },
      { name: 'spawn', type: 'string', default: 'standard' }
    ],
    events: { emits: ['piece:spawned', 'piece:locked'] }
  },
  'mt.rules.lineClear': {
    id: 'mt.rules.lineClear',
    title: 'Line Clear',
    summary: 'Detect and clear full rows with scoring and speed-up.',
    category: 'objective',
    requires: ['mt.grid.world', 'mt.actor.tetrominoes'],
    params: [
      { name: 'linesPerLevel', type: 'number', default: 10 },
      { name: 'scorePerLine', type: 'number', default: 100 },
      // Extended keys
      { name: 'mode', type: 'string', default: 'standard' },
      { name: 'scoring', type: 'string', default: 'single:100,double:300,triple:500,tetris:800' }
    ],
    events: { emits: ['line:cleared', 'level:up'], listens: ['piece:locked'] }
  },
  'mt.rules.growthOnEat': {
    id: 'mt.rules.growthOnEat',
    title: 'Growth on Eat',
    summary: 'Eating food grows body and increases score.',
    category: 'rules',
    requires: ['mt.actor.snakeBody'],
    params: [
      { name: 'scorePerFood', type: 'number', default: 10 }
    ],
    events: { emits: ['score:delta'], listens: ['food:consumed'] }
  },
  'mt.spawn.foodUniform': {
    id: 'mt.spawn.foodUniform',
    title: 'Uniform Food Spawn',
    summary: 'Uniform random food spawn avoiding occupied tiles.',
    category: 'spawning',
    requires: ['mt.grid.world'],
    params: [
      { name: 'spawnEverySteps', type: 'number', default: 1 },
      { name: 'maxFood', type: 'number', default: 1 },
      { name: 'avoidRadius', type: 'number', default: 0 }
    ],
    events: { emits: ['food:spawned', 'food:consumed'], listens: ['grid:tick', 'snake:ate'] }
  },
  'mt.field.brickLayout': {
    id: 'mt.field.brickLayout',
    title: 'Brick Layout',
    summary: 'Brick matrix with hitpoints and colors.',
    category: 'entities',
    params: [
      { name: 'rows', type: 'number', default: 6 },
      { name: 'cols', type: 'number', default: 10 },
      { name: 'hpByRow', type: 'number', default: 1 },
      { name: 'layoutSlot', type: 'string' }
    ],
    slots: [
      { name: 'layout', kind: 'layout', description: 'Brick matrix or pattern reference' }
    ],
    events: { emits: ['brick:destroyed'], listens: ['ball:hit'] }
  },
  'mt.actor.ballBounce': {
    id: 'mt.actor.ballBounce',
    title: 'Ball Bounce',
    summary: 'Reflective continuous ball projectile.',
    category: 'projectile',
    params: [
      { name: 'speed', type: 'number', default: 280 },
      { name: 'angleRandomness', type: 'percent', default: 0.1, min: 0, max: 1 }
    ],
    events: { emits: ['ball:hit', 'life:lost'] }
  },
  'mt.actor.paddle': {
    id: 'mt.actor.paddle',
    title: 'Paddle',
    summary: 'Horizontal paddle with optional sticky.',
    category: 'entities',
    params: [
      { name: 'speed', type: 'number', default: 220 },
      { name: 'sticky', type: 'boolean', default: false }
    ],
    events: { emits: ['paddle:collide'], listens: ['input:axis'] }
  },
  'mt.enemy.invaderFormation': {
    id: 'mt.enemy.invaderFormation',
    title: 'Invader Formation',
    summary: 'Stepping/descending formation with firing.',
    category: 'entities',
    params: [
      { name: 'colsRows', type: 'vector' },
      { name: 'stepPeriodMs', type: 'seconds', default: 0.6 },
      { name: 'descendRows', type: 'number', default: 1 },
      { name: 'fireRate', type: 'number', default: 0.2 }
    ],
    events: { emits: ['invader:cleared'], listens: ['projectile:hit'] }
  },
  'mt.rules.goalFlag': {
    id: 'mt.rules.goalFlag',
    title: 'Goal Flag',
    summary: 'Reach a flag/portal to end the level.',
    category: 'objective',
    requires: ['mt.physics.platformer'],
    params: [
      { name: 'levels', type: 'number', default: 1 },
      { name: 'goalX', type: 'number', default: 1000 },
      { name: 'timeLimitSec', type: 'seconds', default: 0 }
    ],
    events: { emits: ['level:complete', 'game:win'], listens: ['player:overlap:flag'] }
  },
  'mt.ui.hudBasic': {
    id: 'mt.ui.hudBasic',
    title: 'Basic HUD',
    summary: 'Score/lives/time readouts.',
    category: 'ui',
    params: [
      { name: 'showLives', type: 'boolean', default: true },
      { name: 'showTime', type: 'boolean', default: false },
      { name: 'font', type: 'string', default: 'PressStart2P' },
      { name: 'theme', type: 'string', default: 'light' },
      // Extended convenience
      { name: 'show', type: 'string', default: 'score,lines,level' }
    ]
  }
}

export type MetaTemplateId = keyof typeof metaTemplates
