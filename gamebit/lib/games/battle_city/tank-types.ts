// Tank Battle 游戏类型定义

export interface TankBullet {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  damage: number
  isPlayerBullet: boolean
  active: boolean
}

export interface TankEnemy {
  x: number
  y: number
  width: number
  height: number
  direction: 'up' | 'down' | 'left' | 'right'
  health: number
  maxHealth: number
  alive: boolean
  lastShot: number
  shootCooldown: number
  lastMove: number
  moveCooldown: number
  ai: 'patrol' | 'hunt' | 'guard'
}

export interface Wall {
  x: number
  y: number
  width: number
  height: number
  type: 'brick' | 'steel'
  health: number
  maxHealth: number
}

export interface Base {
  x: number
  y: number
  width: number
  height: number
  health: number
  maxHealth: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'
export type AIType = 'patrol' | 'hunt' | 'guard'
