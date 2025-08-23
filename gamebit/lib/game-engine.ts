export interface GameObject {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  grounded: boolean
  render(ctx: CanvasRenderingContext2D): void
  update(deltaTime: number): void
}

export interface GameLevel {
  width: number
  platforms: Platform[]
  enemies: Enemy[]
  collectibles: Collectible[]
  background: string
  flagPosition?: { x: number; y: number }
}

export interface Platform {
  x: number
  y: number
  width: number
  height: number
  type: 'ground' | 'platform' | 'pipe'
}

export interface Enemy {
  x: number
  y: number
  width: number
  height: number
  type: 'goomba' | 'koopa' | 'bullet'
  direction: number
  alive: boolean
  canBeStomped: boolean
}

export interface Collectible {
  x: number
  y: number
  width: number
  height: number
  type: 'coin' | 'powerup' | 'star'
  collected: boolean
}

export class GameEngine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: { x: number; y: number }
  gravity: number = 0.8
  running: boolean = false
  lastTime: number = 0
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = canvas.width
    this.height = canvas.height
    this.camera = { x: 0, y: 0 }
    
    // 设置像素化渲染
    this.ctx.imageSmoothingEnabled = false
  }

  start() {
    this.running = true
    this.lastTime = performance.now()
    this.gameLoop()
  }

  stop() {
    this.running = false
  }

  gameLoop = () => {
    if (!this.running) return
    
    const currentTime = performance.now()
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016) // 限制最大帧时间
    this.lastTime = currentTime
    
    this.update(deltaTime)
    this.render()
    
    requestAnimationFrame(this.gameLoop)
  }

  update(deltaTime: number) {
    // 游戏逻辑更新将在子类中实现
  }

  render() {
    // 清空画布
    this.ctx.fillStyle = '#87ceeb' // 天空蓝
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // 渲染逻辑将在子类中实现
  }

  // 碰撞检测
  checkCollision(obj1: GameObject, obj2: GameObject | Enemy | Collectible | {x: number, y: number, width: number, height: number}): boolean {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y
  }

  // 平台碰撞检测
  checkPlatformCollision(obj: GameObject, platform: Platform): boolean {
    return obj.x < platform.x + platform.width &&
           obj.x + obj.width > platform.x &&
           obj.y < platform.y + platform.height &&
           obj.y + obj.height > platform.y
  }
}
