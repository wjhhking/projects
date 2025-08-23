import { GameLevel } from '../game-engine'
import { BaseGame } from './base-game'
import { SpriteRenderer } from '../sprites'
import { FLOORS_SPRITES } from '../sprites/floors-sprites'

interface MovingPlatform {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  minX: number
  maxX: number
  minY: number
  maxY: number
  type: 'horizontal' | 'vertical' | 'circular'
  timer?: number
}

interface Trap {
  x: number
  y: number
  width: number
  height: number
  type: 'spikes' | 'fire' | 'saw'
  active: boolean
  timer: number
}

interface PowerUp {
  x: number
  y: number
  width: number
  height: number
  type: 'jump_boost' | 'speed' | 'invincibility'
  collected: boolean
  duration?: number
}

interface Portal {
  x: number
  y: number
  width: number
  height: number
  targetFloor: number
  active: boolean
}

export class HundredFloorsGame extends BaseGame {
  currentFloor: number = 1
  maxFloor: number = 100
  movingPlatforms: MovingPlatform[] = []
  traps: Trap[] = []
  powerUps: PowerUp[] = []
  portals: Portal[] = []
  
  // 玩家状态
  jumpBoostTimer: number = 0
  speedBoostTimer: number = 0
  invincibilityTimer: number = 0
  
  spriteRenderer: SpriteRenderer
  
  // 精灵缓存
  private warriorSprite!: ImageData
  private spikesSprite!: ImageData
  private movingPlatformSprite!: ImageData
  private jumpBoostSprite!: ImageData
  private portalSprite!: ImageData

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, 'hundred-floors')
    this.spriteRenderer = new SpriteRenderer()
    this.initializeSprites()
    this.generateLevels()
    this.player.health = 3
    
    // 设置玩家初始位置
    this.player.x = 50
    this.player.y = 60
    this.player.jumpPower = 400
  }

  protected initializeSprites() {
    this.warriorSprite = this.spriteRenderer.createPixelSprite(
      FLOORS_SPRITES.miner,
      FLOORS_SPRITES.colors
    )
    
    this.spikesSprite = this.spriteRenderer.createPixelSprite(
      FLOORS_SPRITES.spikes,
      FLOORS_SPRITES.colors
    )
    
    this.movingPlatformSprite = this.spriteRenderer.createPixelSprite(
      FLOORS_SPRITES.moving_platform,
      FLOORS_SPRITES.colors
    )
    
    this.jumpBoostSprite = this.spriteRenderer.createPixelSprite(
      FLOORS_SPRITES.jump_boost,
      FLOORS_SPRITES.colors
    )
    
    this.portalSprite = this.spriteRenderer.createPixelSprite(
      FLOORS_SPRITES.portal,
      FLOORS_SPRITES.colors
    )
  }

  generateLevels() {
    this.levels = []
    
    // 生成100层楼，每层都有不同的挑战
    for (let floor = 1; floor <= this.maxFloor; floor++) {
      const level: GameLevel = {
        width: this.width,
        platforms: [],
        enemies: [],
        collectibles: [],
        background: this.getFloorBackground(floor),
        flagPosition: undefined
      }

      this.generateFloor(level, floor)
      this.levels.push(level)
    }
  }

  getFloorBackground(floor: number): string {
    // 根据楼层高度改变背景颜色
    if (floor <= 20) return '#87CEEB' // 天空蓝
    if (floor <= 40) return '#4682B4' // 钢蓝色
    if (floor <= 60) return '#2F4F4F' // 暗石板灰
    if (floor <= 80) return '#191970' // 午夜蓝
    return '#000000' // 黑色 (最高层)
  }

  generateFloor(level: GameLevel, floor: number) {
    // 清空之前的数据
    this.movingPlatforms = []
    this.traps = []
    this.powerUps = []
    this.portals = []
    
    // 基础地面
    level.platforms.push({
      x: 0, y: 450, width: this.width, height: 30, type: 'ground'
    })
    
    // 根据楼层难度生成不同的挑战
    const difficulty = Math.min(floor / 10, 10) // 1-10的难度等级
    
    // 生成平台
    this.generatePlatforms(level, floor, difficulty)
    
    // 生成陷阱
    this.generateTraps(floor, difficulty)
    
    // 生成道具
    this.generatePowerUps(floor)
    
    // 生成传送门 (每10层一个)
    if (floor % 10 === 0 && floor < this.maxFloor) {
      this.generatePortal(floor)
    }
    
    // 最终楼层的特殊设置
    if (floor === this.maxFloor) {
      this.generateFinalFloor(level)
    }
  }

  generatePlatforms(level: GameLevel, floor: number, difficulty: number) {
    const platformCount = Math.min(3 + Math.floor(difficulty), 8)
    
    for (let i = 0; i < platformCount; i++) {
      const x = 100 + (i * (this.width - 200)) / platformCount
      const y = 120 + (i % 3) * 80 + Math.random() * 50
      const width = Math.max(80, 120 - difficulty * 5)
      
      level.platforms.push({
        x, y, width, height: 20, type: 'platform'
      })
      
      // 高层添加移动平台
      if (floor > 20 && Math.random() < 0.3) {
        const movingPlatform: MovingPlatform = {
          x, y: y - 40,
          width: 64, height: 16,
          vx: (Math.random() - 0.5) * 100,
          vy: 0,
          minX: Math.max(0, x - 100),
          maxX: Math.min(this.width - 64, x + 100),
          minY: y - 40,
          maxY: y - 40,
          type: 'horizontal'
        }
        this.movingPlatforms.push(movingPlatform)
      }
    }
    
    // 底部出口平台（靠近底部，便于向下通关）
    level.platforms.push({
      x: this.width - 170, y: this.height - 90, width: 120, height: 20, type: 'platform'
    })
  }

  generateTraps(floor: number, difficulty: number) {
    const trapCount = Math.floor(difficulty / 2)
    
    for (let i = 0; i < trapCount; i++) {
      const x = 150 + Math.random() * (this.width - 300)
      const y = 400 + Math.random() * 30
      
      const trap: Trap = {
        x, y, width: 32, height: 16,
        type: 'spikes',
        active: true,
        timer: 0
      }
      
      this.traps.push(trap)
    }
  }

  generatePowerUps(floor: number) {
    // 每5层生成一个道具
    if (floor % 5 === 0) {
      const types: PowerUp['type'][] = ['jump_boost', 'speed', 'invincibility']
      const type = types[Math.floor(Math.random() * types.length)]
      
      const powerUp: PowerUp = {
        x: 200 + Math.random() * (this.width - 400),
        y: 300 + Math.random() * 100,
        width: 32, height: 32,
        type,
        collected: false,
        duration: 10 // 10秒效果
      }
      
      this.powerUps.push(powerUp)
    }
  }

  generatePortal(floor: number) {
    const portal: Portal = {
      x: this.width - 100,
      y: this.height - 80,
      width: 32, height: 48,
      targetFloor: floor + 10,
      active: true
    }
    
    this.portals.push(portal)
  }

  generateFinalFloor(level: GameLevel) {
    // 最终楼层的特殊设计
    level.platforms = [
      { x: 0, y: 450, width: this.width, height: 30, type: 'ground' },
      { x: this.width / 2 - 50, y: 200, width: 100, height: 20, type: 'platform' }
    ]
    
    // 胜利区域
    level.flagPosition = { x: this.width / 2 - 25, y: 150 }
  }

  handleInput() {
    if (this.player.isDead) return

    const speed = this.speedBoostTimer > 0 ? 250 : 150
    const jumpPower = this.jumpBoostTimer > 0 ? 600 : this.player.jumpPower

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.vx = -speed
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.vx = speed
    } else {
      this.player.vx = 0
    }

    if (this.keys['KeyZ'] || this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']) {
      if (this.player.grounded) {
        this.player.vy = -jumpPower
        this.player.grounded = false
        this.player.jumping = true
      }
    }
  }

  update(deltaTime: number) {
    if (this.showingGameOver) {
      this.gameOverTimer += deltaTime
      return
    }

    this.handleInput()
    this.updatePlayer(deltaTime)
    this.updateMovingPlatforms(deltaTime)
    this.updatePowerUpTimers(deltaTime)
    this.checkCollisions()
    this.checkFloorCompletion()
  }

  updatePlayer(deltaTime: number) {
    // 应用重力
    if (!this.player.grounded) {
      this.player.vy += 800 * deltaTime // 重力
    }
    
    // 更新位置
    this.player.x += this.player.vx * deltaTime
    this.player.y += this.player.vy * deltaTime
    
    // 边界检查
    if (this.player.x < 0) this.player.x = 0
    if (this.player.x > this.width - this.player.width) {
      this.player.x = this.width - this.player.width
    }
    
    // 掉落检查
    if (this.player.y > this.height) {
      this.player.takeDamage()
      this.resetPlayerPosition()
      
      if (this.player.health <= 0) {
        this.player.die()
        setTimeout(() => {
          this.gameOver()
        }, 2000)
      }
    }
  }

  updateMovingPlatforms(deltaTime: number) {
    this.movingPlatforms.forEach(platform => {
      switch (platform.type) {
        case 'horizontal':
          platform.x += platform.vx * deltaTime
          if (platform.x <= platform.minX || platform.x >= platform.maxX) {
            platform.vx *= -1
          }
          break
        case 'vertical':
          platform.y += platform.vy * deltaTime
          if (platform.y <= platform.minY || platform.y >= platform.maxY) {
            platform.vy *= -1
          }
          break
        case 'circular':
          // 圆形移动逻辑
          const centerX = (platform.minX + platform.maxX) / 2
          const centerY = (platform.minY + platform.maxY) / 2
          const radius = (platform.maxX - platform.minX) / 2
          platform.timer = (platform.timer || 0) + deltaTime
          platform.x = centerX + Math.cos(platform.timer) * radius
          platform.y = centerY + Math.sin(platform.timer) * radius
          break
      }
    })
  }

  updatePowerUpTimers(deltaTime: number) {
    if (this.jumpBoostTimer > 0) {
      this.jumpBoostTimer -= deltaTime
    }
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= deltaTime
    }
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= deltaTime
    }
  }

  checkCollisions() {
    const currentLevel = this.levels[this.currentLevel]
    
    // 平台碰撞
    let onPlatform = false
    
    currentLevel.platforms.forEach(platform => {
      if (this.checkPlatformCollision(this.player, platform)) {
        if (this.player.vy > 0 && this.player.y < platform.y) {
          this.player.y = platform.y - this.player.height
          this.player.vy = 0
          this.player.grounded = true
          this.player.jumping = false
          onPlatform = true
        }
      }
    })
    
    // 移动平台碰撞
    this.movingPlatforms.forEach(platform => {
      if (this.checkCollision(this.player, { x: platform.x, y: platform.y, width: platform.width, height: platform.height })) {
        if (this.player.vy > 0 && this.player.y < platform.y) {
          this.player.y = platform.y - this.player.height
          this.player.vy = 0
          this.player.grounded = true
          this.player.jumping = false
          onPlatform = true
          
          // 玩家跟随移动平台
          this.player.x += platform.vx * 0.016 // 假设60fps
        }
      }
    })
    
    if (!onPlatform) {
      this.player.grounded = false
    }
    
    // 陷阱碰撞
    if (this.invincibilityTimer <= 0) {
      this.traps.forEach(trap => {
        if (trap.active && this.checkCollision(this.player, trap)) {
          this.player.takeDamage()
          this.invincibilityTimer = 2 // 2秒无敌时间
          
          if (this.player.health <= 0) {
            this.player.die()
            setTimeout(() => {
              this.gameOver()
            }, 2000)
          }
        }
      })
    }
    
    // 道具碰撞
    this.powerUps.forEach(powerUp => {
      if (!powerUp.collected && this.checkCollision(this.player, powerUp)) {
        powerUp.collected = true
        this.collectPowerUp(powerUp)
      }
    })
    
    // 传送门碰撞
    this.portals.forEach(portal => {
      if (portal.active && this.checkCollision(this.player, portal)) {
        this.jumpToFloor(portal.targetFloor)
      }
    })
    
    // 旗子碰撞 (最终楼层)
    if (currentLevel.flagPosition) {
      const flagHitbox = {
        x: currentLevel.flagPosition.x,
        y: currentLevel.flagPosition.y,
        width: 50,
        height: 50
      }
      
      if (this.checkCollision(this.player, flagHitbox)) {
        this.victory()
      }
    }
  }

  collectPowerUp(powerUp: PowerUp) {
    switch (powerUp.type) {
      case 'jump_boost':
        this.jumpBoostTimer = powerUp.duration || 10
        break
      case 'speed':
        this.speedBoostTimer = powerUp.duration || 10
        break
      case 'invincibility':
        this.invincibilityTimer = powerUp.duration || 10
        break
    }
    
    this.score += 500
  }

  checkFloorCompletion() {
    // 检查是否到达楼层底部（向下通关）
    if (this.player.y + this.player.height > this.height - 30) {
      this.nextFloor()
    }
  }

  nextFloor() {
    if (this.currentFloor < this.maxFloor) {
      this.currentFloor++
      this.currentLevel = this.currentFloor - 1
      this.resetPlayerPosition()
      this.generateFloor(this.levels[this.currentLevel], this.currentFloor)
      this.score += 100 * this.currentFloor
    } else {
      this.victory()
    }
  }

  jumpToFloor(targetFloor: number) {
    if (targetFloor <= this.maxFloor) {
      this.currentFloor = targetFloor
      this.currentLevel = this.currentFloor - 1
      this.resetPlayerPosition()
      this.generateFloor(this.levels[this.currentLevel], this.currentFloor)
      this.score += 1000 // 传送门奖励
    }
  }

  resetPlayerPosition() {
    this.player.x = 50
    this.player.y = 60
    this.player.vx = 0
    this.player.vy = 0
    this.player.grounded = false
  }

  renderLevel() {
    const currentLevel = this.levels[this.currentLevel]
    
    // 渲染平台
    currentLevel.platforms.forEach(platform => {
      if (platform.type === 'ground') {
        this.ctx.fillStyle = '#654321'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      } else {
        this.ctx.fillStyle = '#8B4513'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        
        // 平台边框
        this.ctx.strokeStyle = '#A0522D'
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)
      }
    })
    
    // 渲染移动平台
    this.movingPlatforms.forEach(platform => {
      this.spriteRenderer.renderSprite(this.ctx, this.movingPlatformSprite, platform.x, platform.y, 2)
    })
    
    // 渲染陷阱
    this.traps.forEach(trap => {
      if (trap.active) {
        this.spriteRenderer.renderSprite(this.ctx, this.spikesSprite, trap.x, trap.y, 2)
      }
    })
    
    // 渲染道具
    this.powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        this.spriteRenderer.renderSprite(this.ctx, this.jumpBoostSprite, powerUp.x, powerUp.y, 2)
      }
    })
    
    // 渲染传送门
    this.portals.forEach(portal => {
      if (portal.active) {
        this.spriteRenderer.renderSprite(this.ctx, this.portalSprite, portal.x, portal.y, 2)
      }
    })
    
    // 渲染终点旗子
    if (currentLevel.flagPosition) {
      this.ctx.fillStyle = '#FFD700'
      this.ctx.fillRect(currentLevel.flagPosition.x, currentLevel.flagPosition.y, 50, 50)
      
      this.ctx.fillStyle = '#000000'
      this.ctx.font = '12px monospace'
      this.ctx.fillText('WIN!', currentLevel.flagPosition.x + 10, currentLevel.flagPosition.y + 30)
    }
  }

  render() {
    // 背景
    this.ctx.fillStyle = this.levels[this.currentLevel].background
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.renderLevel()
    
    // 渲染玩家 (带无敌闪烁效果)
    if (this.invincibilityTimer <= 0 || Math.floor(this.invincibilityTimer * 10) % 2 === 0) {
      this.spriteRenderer.renderSprite(this.ctx, this.warriorSprite, this.player.x, this.player.y, 2)
    }
    
    this.renderUI()
    
    if (this.showingGameOver) {
      this.renderGameOver()
    }
  }

  renderUI() {
    // Hundred Floors 游戏不显示 UI，保持纯净的游戏画面
  }

  renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.ctx.fillStyle = '#ff0000'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText(`Reached Floor: ${this.currentFloor}`, this.width / 2, this.height / 2)
    
    // 重置文本对齐
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'alphabetic'
  }

  victory() {
    this.stop()
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    this.ctx.fillText('VICTORY!', this.width / 2, this.height / 2 - 50)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText('You conquered all 100 floors!', this.width / 2, this.height / 2)
    this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 40)
    
    // 重置文本对齐
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'alphabetic'
  }
}
