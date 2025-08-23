import { GameLevel } from '../game-engine'
import { BaseGame } from './base-game'
import { renderFlag } from '../sprites'

export class MarioGame extends BaseGame {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.generateLevels()
  }

  generateLevels() {
    this.levels = []
    
    // Mario 风格：经典平台跳跃，适中难度
    for (let i = 0; i < 8; i++) {
      const levelWidth = 2400 + i * 200
      const level: GameLevel = {
        width: levelWidth,
        platforms: [],
        enemies: [],
        collectibles: [],
        background: '#87ceeb', // 经典天空蓝
        flagPosition: { x: levelWidth - 100, y: 336 }
      }

      // 地面
      level.platforms.push({
        x: 0, y: 400, width: levelWidth, height: 80, type: 'ground'
      })

      // 经典马里奥式平台布局
      const platformPositions = [
        { x: 300, y: 320 }, { x: 500, y: 280 }, { x: 800, y: 240 },
        { x: 1200, y: 300 }, { x: 1500, y: 260 }, { x: 1800, y: 320 }
      ]
      
      platformPositions.forEach(pos => {
        if (pos.x < levelWidth - 200) {
          level.platforms.push({
            x: pos.x, y: pos.y, width: 120, height: 20, type: 'platform'
          })
        }
      })

      // Goomba 敌人分布
      const enemyPositions = [400, 700, 1000, 1300, 1600]
      enemyPositions.forEach(x => {
        if (x < levelWidth - 200) {
          level.enemies.push({
            x, y: 368, width: 32, height: 32,
            type: 'goomba', direction: -1, alive: true, canBeStomped: true
          })
        }
      })

      // 金币收集
      const coinPositions = [350, 550, 850, 1250, 1550]
      coinPositions.forEach(x => {
        if (x < levelWidth - 200) {
          level.collectibles.push({
            x, y: 360, width: 16, height: 16, type: 'coin', collected: false
          })
        }
      })

      this.levels.push(level)
    }
  }

  renderLevel() {
    const currentLevel = this.levels[this.currentLevel]
    
    // 渲染平台
    currentLevel.platforms.forEach(platform => {
      if (platform.type === 'ground') {
        this.ctx.fillStyle = '#8b4513'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        
        // 地面纹理
        this.ctx.fillStyle = '#654321'
        for (let x = platform.x; x < platform.x + platform.width; x += 16) {
          this.ctx.fillRect(x, platform.y + 4, 2, 2)
          this.ctx.fillRect(x + 8, platform.y + 8, 2, 2)
        }
      } else {
        // 砖块平台
        this.ctx.fillStyle = '#ff6600'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        
        this.ctx.fillStyle = '#cc4400'
        const brickWidth = 16
        const brickHeight = 8
        
        for (let x = platform.x; x < platform.x + platform.width; x += brickWidth) {
          for (let y = platform.y; y < platform.y + platform.height; y += brickHeight) {
            this.ctx.fillRect(x, y, brickWidth, 1)
            this.ctx.fillRect(x, y + brickHeight - 1, brickWidth, 1)
            this.ctx.fillRect(x, y, 1, brickHeight)
            this.ctx.fillRect(x + brickWidth - 1, y, 1, brickHeight)
          }
        }
        
        this.ctx.fillStyle = '#ff9933'
        this.ctx.fillRect(platform.x, platform.y, platform.width, 2)
      }
    })

    // 渲染敌人
    currentLevel.enemies.forEach(enemy => {
      if (enemy.alive) {
        this.spriteRenderer.renderSprite(this.ctx, this.goombaSprite, enemy.x, enemy.y, 2)
      } else {
        // 死敌人
        this.ctx.fillStyle = '#654321'
        this.ctx.fillRect(enemy.x, enemy.y + 24, enemy.width, 8)
        
        this.ctx.fillStyle = '#000000'
        this.ctx.fillRect(enemy.x + 8, enemy.y + 26, 2, 2)
        this.ctx.fillRect(enemy.x + 22, enemy.y + 26, 2, 2)
      }
    })

    // 渲染收集品
    currentLevel.collectibles.forEach(collectible => {
      if (!collectible.collected) {
        this.spriteRenderer.renderSprite(this.ctx, this.coinSprite, collectible.x, collectible.y, 2)
      }
    })
    
    // 渲染终点旗子
    if (currentLevel.flagPosition) {
      renderFlag(this.ctx, currentLevel.flagPosition.x, currentLevel.flagPosition.y)
    }
  }
}
