import { GameEngine, GameLevel } from '../game-engine'
import { Player } from '../player'
import { AudioManager } from '../audio'
import { SpriteRenderer, GOOMBA_SPRITES, COIN_SPRITES, renderFlag } from '../sprites'

export abstract class BaseGame extends GameEngine {
  player: Player
  currentLevel: number = 0
  levels: GameLevel[] = []
  keys: { [key: string]: boolean } = {}
  score: number = 0

  audioManager: AudioManager
  gameOverTimer: number = 0
  showingGameOver: boolean = false
  
  // 精灵系统
  protected spriteRenderer: SpriteRenderer
  protected goombaSprite: ImageData
  protected coinSprite: ImageData
  
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
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      
      if (this.showingGameOver && e.code === 'KeyR') {
        this.restart()
        return
      }
      
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
  }

  // 抽象方法，子类必须实现
  abstract generateLevels(): void

  update(deltaTime: number) {
    if (this.showingGameOver) {
      this.gameOverTimer += deltaTime
      return
    }

    this.handleInput()
    this.player.update(deltaTime)
    this.updateCamera()
    this.updateEnemies(deltaTime)
    this.checkCollisions()
  }

  handleInput() {
    if (this.player.isDead) return

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.moveLeft()
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.moveRight()
    } else {
      this.player.stop()
    }

    if (this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) {
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
    const targetX = this.player.x - this.width / 2
    const currentLevel = this.levels[this.currentLevel]
    this.camera.x = Math.max(0, Math.min(targetX, currentLevel.width - this.width))
  }

  updateEnemies(deltaTime: number) {
    const currentLevel = this.levels[this.currentLevel]
    
    currentLevel.enemies.forEach(enemy => {
      if (enemy.alive) {
        enemy.x += enemy.direction * 50 * deltaTime
        
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
        if (this.player.vy > 0 && this.player.y < platform.y) {
          this.player.y = platform.y - this.player.height
          this.player.vy = 0
          this.player.grounded = true
          this.player.jumping = false
        }
      }
    })

    // 收集品碰撞
    currentLevel.collectibles.forEach(collectible => {
      if (!collectible.collected && this.checkCollision(this.player, collectible)) {
        collectible.collected = true
        this.score += 100
      }
    })

    // 敌人碰撞
    currentLevel.enemies.forEach(enemy => {
      if (enemy.alive && this.checkCollision(this.player, enemy)) {
        if (this.player.vy > 0 && 
            this.player.y < enemy.y && 
            enemy.canBeStomped) {
          enemy.alive = false
          this.player.vy = -200
          this.score += 200
        } else {
          // Immediate game over on enemy collision
          this.player.die()
          setTimeout(() => {
            this.gameOver()
          }, 2000)
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
    this.ctx.fillStyle = this.levels[this.currentLevel].background
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.ctx.save()
    this.ctx.translate(-this.camera.x, -this.camera.y)
    
    this.renderLevel()
    this.player.render(this.ctx)
    
    this.ctx.restore()
    this.renderUI()
    
    if (this.showingGameOver) {
      this.renderGameOver()
    }
  }

  // 可以被子类重写的渲染方法
  renderLevel() {
    const currentLevel = this.levels[this.currentLevel]
    
    // 渲染平台
    currentLevel.platforms.forEach(platform => {
      if (platform.type === 'ground') {
        this.ctx.fillStyle = '#8b4513'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      } else {
        this.ctx.fillStyle = '#ff6600'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      }
    })

    // 渲染敌人
    currentLevel.enemies.forEach(enemy => {
      if (enemy.alive) {
        this.spriteRenderer.renderSprite(this.ctx, this.goombaSprite, enemy.x, enemy.y, 2)
      } else {
        this.ctx.fillStyle = '#654321'
        this.ctx.fillRect(enemy.x, enemy.y + 24, enemy.width, 8)
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

  renderUI() {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '16px "Press Start 2P"'
    this.ctx.fillText(`Score: ${this.score}`, 10, 30)
    this.ctx.fillText(`Level: ${this.currentLevel + 1}`, 10, 60)
  }

  renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    if (Math.floor(this.gameOverTimer * 4) % 2 === 0) {
      this.ctx.strokeStyle = '#ff0000'
      this.ctx.lineWidth = 8
      this.ctx.strokeRect(20, 20, this.width - 40, this.height - 40)
    }
    
    this.ctx.fillStyle = '#ff0000'
    this.ctx.font = '32px "Press Start 2P"'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    this.ctx.fillStyle = '#800000'
    this.ctx.fillText('GAME OVER', this.width / 2 + 3, this.height / 2 - 47)
    
    this.ctx.fillStyle = '#ff0000'
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50)
    
    this.ctx.font = '16px "Press Start 2P"'
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2)
    
    this.ctx.font = '12px "Press Start 2P"'
    this.ctx.fillStyle = '#ffff00'
    this.ctx.fillText(`Level Reached: ${this.currentLevel + 1}`, this.width / 2, this.height / 2 + 30)
    
    if (this.gameOverTimer > 1.0) {
      const alpha = Math.sin(this.gameOverTimer * 3) * 0.5 + 0.5
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      this.ctx.font = '10px "Press Start 2P"'
      this.ctx.fillText('Press R to Restart', this.width / 2, this.height / 2 + 60)
    }
    
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'alphabetic'
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
    this.currentLevel = 0
    this.score = 0
    this.showingGameOver = false
    this.gameOverTimer = 0
    
    this.player.reset()
    this.player.x = 50
    this.player.y = 300
    
    this.camera.x = 0
    this.camera.y = 0
    
    this.generateLevels()
    this.start()
  }
}
