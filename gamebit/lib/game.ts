import { GameEngine, GameLevel, Platform, Enemy, Collectible } from './game-engine'
import { Player } from './player'
import { AudioManager } from './audio'
import { SpriteRenderer, GOOMBA_SPRITES, COIN_SPRITES, renderFlag } from './sprites'

export class Game extends GameEngine {
  player: Player
  currentLevel: number = 0
  levels: GameLevel[] = []
  keys: { [key: string]: boolean } = {}
  score: number = 0
  lives: number = 3
  audioManager: AudioManager
  gameOverTimer: number = 0
  showingGameOver: boolean = false
  
  // 精灵系统
  private spriteRenderer: SpriteRenderer
  private goombaSprite: ImageData
  private coinSprite: ImageData
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.player = new Player()
    this.audioManager = new AudioManager()
    
    // 初始化精灵系统
    this.spriteRenderer = new SpriteRenderer()
    this.goombaSprite = this.spriteRenderer.createPixelSprite(
      GOOMBA_SPRITES.walking,
      GOOMBA_SPRITES.colors
    )
    this.coinSprite = this.spriteRenderer.createPixelSprite(
      COIN_SPRITES.spinning,
      COIN_SPRITES.colors
    )
    
    this.setupControls()
    this.generateLevels()
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      
      // 游戏结束时按R重新开始
      if (this.showingGameOver && e.code === 'KeyR') {
        this.restart()
        return
      }
      
      // 防止页面滚动
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
  }

  generateLevels() {
    // 生成10个关卡
    for (let i = 0; i < 10; i++) {
      this.levels.push(this.createLevel(i))
    }
  }

  // 创建固定的预设游戏
  generatePresetGame(gameType: 'mario' | 'contra' | 'raiden') {
    this.levels = []
    
    switch (gameType) {
      case 'mario':
        this.levels = this.createMarioLevels()
        break
      case 'contra':
        this.levels = this.createContraLevels()
        break
      case 'raiden':
        this.levels = this.createRaidenLevels()
        break
    }
  }

  createMarioLevels(): GameLevel[] {
    const levels: GameLevel[] = []
    
    // Mario 风格：经典平台跳跃，适中难度
    for (let i = 0; i < 8; i++) {
      const levelWidth = 2400 + i * 200
      const level: GameLevel = {
        width: levelWidth,
        platforms: [],
        enemies: [],
        collectibles: [],
        background: '#87ceeb',
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

      levels.push(level)
    }
    
    return levels
  }

  createContraLevels(): GameLevel[] {
    const levels: GameLevel[] = []
    
    // Contra 风格：更多敌人，更具挑战性
    for (let i = 0; i < 6; i++) {
      const levelWidth = 3000 + i * 300
      const level: GameLevel = {
        width: levelWidth,
        platforms: [],
        enemies: [],
        collectibles: [],
        background: '#2d4a2d', // 军绿色背景
        flagPosition: { x: levelWidth - 100, y: 336 }
      }

      // 地面
      level.platforms.push({
        x: 0, y: 400, width: levelWidth, height: 80, type: 'ground'
      })

      // 战壕式平台
      for (let x = 200; x < levelWidth - 200; x += 180) {
        level.platforms.push({
          x, y: 320 + (Math.sin(x / 200) * 40), width: 100, height: 20, type: 'platform'
        })
      }

      // 更多敌人 (Contra 风格)
      for (let x = 250; x < levelWidth - 200; x += 150) {
        level.enemies.push({
          x, y: 368, width: 32, height: 32,
          type: 'goomba', direction: Math.random() > 0.5 ? 1 : -1,
          alive: true, canBeStomped: true
        })
      }

      // 武器道具 (用金币代替)
      for (let x = 300; x < levelWidth - 200; x += 200) {
        level.collectibles.push({
          x, y: 350, width: 16, height: 16, type: 'coin', collected: false
        })
      }

      levels.push(level)
    }
    
    return levels
  }

  createRaidenLevels(): GameLevel[] {
    const levels: GameLevel[] = []
    
    // Raiden 风格：高速移动，空中平台
    for (let i = 0; i < 5; i++) {
      const levelWidth = 3500 + i * 400
      const level: GameLevel = {
        width: levelWidth,
        platforms: [],
        enemies: [],
        collectibles: [],
        background: '#1a1a2e', // 深空背景
        flagPosition: { x: levelWidth - 100, y: 336 }
      }

      // 地面
      level.platforms.push({
        x: 0, y: 400, width: levelWidth, height: 80, type: 'ground'
      })

      // 高空平台 (飞行感)
      for (let x = 150; x < levelWidth - 200; x += 200) {
        const height = 150 + Math.sin(x / 300) * 100
        level.platforms.push({
          x, y: height, width: 80, height: 15, type: 'platform'
        })
      }

      // 快速移动的敌人
      for (let x = 300; x < levelWidth - 200; x += 250) {
        level.enemies.push({
          x, y: 368, width: 32, height: 32,
          type: 'goomba', direction: Math.random() > 0.5 ? 2 : -2, // 更快速度
          alive: true, canBeStomped: true
        })
      }

      // 能量核心 (金币)
      for (let x = 200; x < levelWidth - 200; x += 300) {
        level.collectibles.push({
          x, y: 200 + Math.sin(x / 200) * 50, width: 16, height: 16,
          type: 'coin', collected: false
        })
      }

      levels.push(level)
    }
    
    return levels
  }

  createLevel(levelIndex: number): GameLevel {
    const levelWidth = 3200
    const level: GameLevel = {
      width: levelWidth, // 每个关卡宽度
      platforms: [],
      enemies: [],
      collectibles: [],
      background: '#87ceeb',
      flagPosition: { x: levelWidth - 100, y: 336 } // 终点旗子位置
    }

    // 地面平台
    level.platforms.push({
      x: 0,
      y: 400,
      width: level.width,
      height: 80,
      type: 'ground'
    })

    // 随机生成平台
    for (let x = 200; x < level.width - 200; x += 150 + Math.random() * 100) {
      if (Math.random() > 0.3) {
        level.platforms.push({
          x: x,
          y: 250 + Math.random() * 100,
          width: 80 + Math.random() * 40,
          height: 20,
          type: 'platform'
        })
      }
    }

    // 生成敌人
    for (let x = 300; x < level.width - 300; x += 200 + Math.random() * 200) {
      if (Math.random() > 0.4) {
        level.enemies.push({
          x: x,
          y: 368,
          width: 32,
          height: 32,
          type: 'goomba',
          direction: Math.random() > 0.5 ? 1 : -1,
          alive: true,
          canBeStomped: true // Goomba 可以被踩死
        })
      }
    }

    // 生成收集品
    for (let x = 150; x < level.width - 150; x += 100 + Math.random() * 100) {
      if (Math.random() > 0.6) {
        level.collectibles.push({
          x: x,
          y: 350 + Math.random() * 50,
          width: 16,
          height: 16,
          type: 'coin',
          collected: false
        })
      }
    }

    return level
  }

  update(deltaTime: number) {
    if (this.showingGameOver) {
      this.gameOverTimer += deltaTime
      // 游戏结束后3秒自动重置或等待用户输入
      if (this.gameOverTimer > 3.0) {
        // 可以在这里添加重新开始逻辑
      }
      return
    }

    this.handleInput()
    this.player.update(deltaTime)
    this.updateCamera()
    this.updateEnemies(deltaTime)
    this.checkCollisions()
  }

  handleInput() {
    // 如果玩家死亡，不处理移动输入
    if (this.player.isDead) return

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.moveLeft()
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.moveRight()
    } else {
      this.player.stop()
    }

    if (this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) {
      // if (this.player.grounded) {
      //   this.audioManager.playJump()
      // }
      this.player.jump()
    }

    if (this.keys['KeyZ']) {
      this.player.actionA()
    }

    if (this.keys['KeyX']) {
      this.player.actionB()
    }
  }

  updateCamera() {
    // 相机跟随玩家，但限制在关卡范围内
    const targetX = this.player.x - this.width / 2
    const currentLevel = this.levels[this.currentLevel]
    
    this.camera.x = Math.max(0, Math.min(targetX, currentLevel.width - this.width))
  }

  updateEnemies(deltaTime: number) {
    const currentLevel = this.levels[this.currentLevel]
    
    currentLevel.enemies.forEach(enemy => {
      if (enemy.alive) {
        enemy.x += enemy.direction * 50 * deltaTime
        
        // 简单的AI：碰到边界就转向
        if (enemy.x <= 0 || enemy.x >= currentLevel.width - enemy.width) {
          enemy.direction *= -1
        }
      }
    })
  }

  checkCollisions() {
    const currentLevel = this.levels[this.currentLevel]
    
    // 平台碰撞
    currentLevel.platforms.forEach(platform => {
      if (this.checkPlatformCollision(this.player, platform)) {
        // 从上方落到平台上
        if (this.player.vy > 0 && this.player.y < platform.y) {
          this.player.y = platform.y - this.player.height
          this.player.vy = 0
          this.player.grounded = true
          this.player.jumping = false
        }
        // 从下方撞到平台
        else if (this.player.vy < 0 && this.player.y > platform.y) {
          this.player.y = platform.y + platform.height
          this.player.vy = 0
        }
        // 从左侧撞到平台
        else if (this.player.vx > 0 && this.player.x < platform.x) {
          this.player.x = platform.x - this.player.width
          this.player.vx = 0
        }
        // 从右侧撞到平台
        else if (this.player.vx < 0 && this.player.x > platform.x) {
          this.player.x = platform.x + platform.width
          this.player.vx = 0
        }
      }
    })

    // 收集品碰撞
    currentLevel.collectibles.forEach(collectible => {
      if (!collectible.collected && this.checkCollision(this.player, collectible)) {
        collectible.collected = true
        this.score += 100
        // this.audioManager.playCoin()
      }
    })

    // 敌人碰撞
    currentLevel.enemies.forEach(enemy => {
      if (enemy.alive && this.checkCollision(this.player, enemy)) {
        // 检查是否从上方踩到敌人
        if (this.player.vy > 0 && 
            this.player.y < enemy.y && 
            enemy.canBeStomped) {
          // 踩死敌人
          enemy.alive = false
          this.player.vy = -200 // 小跳跃
          this.score += 200
          console.log('🦶 Stomped enemy!')
        } else {
          // 侧面碰撞 - 受伤
          this.lives--
          // this.audioManager.playHit()
          
          // 击退效果
          if (this.player.x < enemy.x) {
            this.player.x -= 20
          } else {
            this.player.x += 20
          }
          
          if (this.lives <= 0) {
            this.player.die() // 触发死亡动画
            setTimeout(() => {
              this.gameOver()
            }, 2000) // 2秒后显示游戏结束
          }
        }
      }
    })
    
    // 旗子碰撞检测
    if (currentLevel.flagPosition) {
      const flagHitbox = {
        x: currentLevel.flagPosition.x,
        y: currentLevel.flagPosition.y,
        width: 28,
        height: 64
      }
      
      if (this.checkCollision(this.player, flagHitbox)) {
        this.nextLevel()
      }
    }
  }

  render() {
    // 清空画布
    this.ctx.fillStyle = this.levels[this.currentLevel].background
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // 保存当前变换状态
    this.ctx.save()
    
    // 应用相机变换
    this.ctx.translate(-this.camera.x, -this.camera.y)
    
    this.renderLevel()
    this.player.render(this.ctx)
    
    // 恢复变换状态
    this.ctx.restore()
    
    this.renderUI()
    
    // 渲染游戏结束界面
    if (this.showingGameOver) {
      this.renderGameOver()
    }
  }

  renderGameOver() {
    // 半透明黑色覆盖层
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // 闪烁的红色边框
    if (Math.floor(this.gameOverTimer * 4) % 2 === 0) {
      this.ctx.strokeStyle = '#ff0000'
      this.ctx.lineWidth = 8
      this.ctx.strokeRect(20, 20, this.width - 40, this.height - 40)
    }
    
    // 主标题 - GAME OVER
    this.ctx.fillStyle = '#ff0000'
    this.ctx.font = '32px "Press Start 2P"'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    // 文字阴影效果
    this.ctx.fillStyle = '#800000'
    this.ctx.fillText('GAME OVER', this.width / 2 + 3, this.height / 2 - 47)
    
    // 主文字
    this.ctx.fillStyle = '#ff0000'
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50)
    
    // 分数显示
    this.ctx.font = '16px "Press Start 2P"'
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2)
    
    // 生存时间
    this.ctx.font = '12px "Press Start 2P"'
    this.ctx.fillStyle = '#ffff00'
    this.ctx.fillText(`Level Reached: ${this.currentLevel + 1}`, this.width / 2, this.height / 2 + 30)
    
    // 重新开始提示
    if (this.gameOverTimer > 1.0) {
      const alpha = Math.sin(this.gameOverTimer * 3) * 0.5 + 0.5
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      this.ctx.font = '10px "Press Start 2P"'
      this.ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 60)
    }
    
    // 重置文本对齐
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'alphabetic'
  }

  renderLevel() {
    const currentLevel = this.levels[this.currentLevel]
    
    // 渲染平台
    currentLevel.platforms.forEach(platform => {
      if (platform.type === 'ground') {
        // 地面 - 棕色土地
        this.ctx.fillStyle = '#8b4513'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        
        // 地面纹理
        this.ctx.fillStyle = '#654321'
        for (let x = platform.x; x < platform.x + platform.width; x += 16) {
          this.ctx.fillRect(x, platform.y + 4, 2, 2)
          this.ctx.fillRect(x + 8, platform.y + 8, 2, 2)
        }
      } else {
        // 砖块平台 - 橙红色砖块
        this.ctx.fillStyle = '#ff6600'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        
        // 砖块纹理
        this.ctx.fillStyle = '#cc4400'
        const brickWidth = 16
        const brickHeight = 8
        
        for (let x = platform.x; x < platform.x + platform.width; x += brickWidth) {
          for (let y = platform.y; y < platform.y + platform.height; y += brickHeight) {
            // 砖块边框
            this.ctx.fillRect(x, y, brickWidth, 1) // 顶边
            this.ctx.fillRect(x, y + brickHeight - 1, brickWidth, 1) // 底边
            this.ctx.fillRect(x, y, 1, brickHeight) // 左边
            this.ctx.fillRect(x + brickWidth - 1, y, 1, brickHeight) // 右边
          }
        }
        
        // 高光效果
        this.ctx.fillStyle = '#ff9933'
        this.ctx.fillRect(platform.x, platform.y, platform.width, 2)
      }
    })

    // 渲染敌人 (使用精灵)
    currentLevel.enemies.forEach(enemy => {
      if (enemy.alive) {
        this.spriteRenderer.renderSprite(this.ctx, this.goombaSprite, enemy.x, enemy.y, 2)
      } else {
        // 渲染死敌人 (压扁效果)
        this.ctx.fillStyle = '#654321'
        this.ctx.fillRect(enemy.x, enemy.y + 24, enemy.width, 8)
        
        // 死敌人的眼睛 (X形状)
        this.ctx.fillStyle = '#000000'
        this.ctx.fillRect(enemy.x + 8, enemy.y + 26, 2, 2)
        this.ctx.fillRect(enemy.x + 10, enemy.y + 24, 2, 2)
        this.ctx.fillRect(enemy.x + 10, enemy.y + 28, 2, 2)
        this.ctx.fillRect(enemy.x + 12, enemy.y + 26, 2, 2)
        
        this.ctx.fillRect(enemy.x + 18, enemy.y + 26, 2, 2)
        this.ctx.fillRect(enemy.x + 20, enemy.y + 24, 2, 2)
        this.ctx.fillRect(enemy.x + 20, enemy.y + 28, 2, 2)
        this.ctx.fillRect(enemy.x + 22, enemy.y + 26, 2, 2)
      }
    })

    // 渲染收集品 (使用精灵)
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

  renderUI() {
    // 分数
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '16px "Press Start 2P"'
    this.ctx.fillText(`Score: ${this.score}`, 10, 30)
    
    // 生命值
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 60)
    
    // 关卡
    this.ctx.fillText(`Level: ${this.currentLevel + 1}`, 10, 90)
  }

  gameOver() {
    this.stop()
    this.showingGameOver = true
    this.gameOverTimer = 0
  }

  nextLevel() {
    if (this.currentLevel < this.levels.length - 1) {
      this.currentLevel++
      this.player.x = 50
      this.player.y = 300
      this.camera.x = 0
    } else {
      this.victory()
    }
  }

  victory() {
    this.stop()
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.ctx.fillStyle = '#00ff00'
    this.ctx.font = '24px "Press Start 2P"'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('VICTORY!', this.width / 2, this.height / 2)
    
    this.ctx.font = '12px "Press Start 2P"'
    this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 40)
  }

  restart() {
    // 重置游戏状态
    this.currentLevel = 0
    this.score = 0
    this.lives = 3
    this.showingGameOver = false
    this.gameOverTimer = 0
    
    // 重置玩家
    this.player.reset()
    this.player.x = 50
    this.player.y = 300
    
    // 重置相机
    this.camera.x = 0
    this.camera.y = 0
    
    // 重新生成关卡
    this.generateLevels()
    
    // 重新开始游戏循环
    this.start()
  }
}
