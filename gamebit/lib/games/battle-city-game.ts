import { GameEngine } from '../game-engine'
import { SpriteRenderer } from '../sprites'
import { BATTLE_CITY_SPRITES, BATTLE_CITY_BULLET_SPRITES } from '../sprites/battle-city-sprites'
import { 
  TankBulletManager, 
  TankEnemyManager, 
  TankLevelGenerator,
  TankPlayer
} from './battle_city'

export class BattleCityGame extends GameEngine {
  // 游戏状态
  player: TankPlayer
  keys: { [key: string]: boolean } = {}
  score: number = 0
  gameOverTimer: number = 0
  showingGameOver: boolean = false
  
  // 管理器
  bulletManager: TankBulletManager
  enemyManager: TankEnemyManager
  spriteRenderer: SpriteRenderer
  
  // 游戏对象
  walls = TankLevelGenerator.generateWalls()
  playerBase = { x: 384, y: 416, width: 32, height: 32, health: 1, maxHealth: 1 }
  
  // 游戏设置
  gameTimer: number = 60
  totalEnemies: number = 10
  lastShot: number = 0

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    
    this.player = new TankPlayer(256, 448)
    this.bulletManager = new TankBulletManager()
    this.enemyManager = new TankEnemyManager()
    this.spriteRenderer = new SpriteRenderer()
    
    this.setupControls()
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      if (this.showingGameOver && e.code === 'KeyR') {
        this.restart()
      }
    })
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
  }

  handleInput() {
    if (this.player.isDead) return

    const speed = 150
    this.player.vx = 0
    this.player.vy = 0

    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.player.direction = 'up'
      this.player.vy = -speed
    } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      this.player.direction = 'down'
      this.player.vy = speed
    } else if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.direction = 'left'
      this.player.vx = -speed
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.direction = 'right'
      this.player.vx = speed
    }

    if (this.keys['Space'] || this.keys['KeyX']) {
      this.shoot()
    }
  }

  shoot() {
    const now = performance.now() / 1000
    if (now - this.lastShot < 0.5) return
    
    this.lastShot = now
    this.bulletManager.createBullet(
      this.player.x + 14, this.player.y + 14,
      this.player.direction, true
    )
  }

  updatePlayer(deltaTime: number) {
    const newX = this.player.x + this.player.vx * deltaTime
    const newY = this.player.y + this.player.vy * deltaTime
    
    if (newX >= 0 && newX <= this.width - 32) {
      if (!TankLevelGenerator.checkWallCollision({ x: newX, y: this.player.y, width: 32, height: 32 }, this.walls)) {
        this.player.x = newX
      }
    }
    
    if (newY >= 0 && newY <= this.height - 32) {
      if (!TankLevelGenerator.checkWallCollision({ x: this.player.x, y: newY, width: 32, height: 32 }, this.walls)) {
        this.player.y = newY
      }
    }
    
    this.player.update(deltaTime)
  }

  update(deltaTime: number) {
    if (this.showingGameOver) {
      this.gameOverTimer += deltaTime
      return
    }

    this.gameTimer -= deltaTime
    this.handleInput()
    this.updatePlayer(deltaTime)
    
    this.bulletManager.update(deltaTime, this.width, this.height)
    this.enemyManager.update(deltaTime, this.width, this.height, this.walls, this.player, this.playerBase, 
      (enemy) => this.bulletManager.createBullet(enemy.x + 14, enemy.y + 14, enemy.direction, false)
    )
    
    // 生成敌人
    this.enemyManager.enemySpawnTimer += deltaTime
    if (this.enemyManager.enemySpawnTimer > 3.0) {
      this.enemyManager.enemySpawnTimer = 0
      this.enemyManager.spawnEnemy(0, this.totalEnemies)
    }
    
    // 碰撞检测
    this.bulletManager.handleBulletCollisions(
      this.walls, this.enemyManager.enemies, this.player, this.playerBase,
      (points) => { this.score += points },
      () => { this.player.takeDamage(); if (this.player.isDead) this.gameOver() },
      () => { this.gameOver() }
    )
    
    // 游戏结束检查
    if (this.enemyManager.getDestroyedCount() >= this.totalEnemies) {
      this.victory()
    } else if (this.gameTimer <= 0) {
      this.gameOver()
    }
  }

  render() {
    // 背景
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // 墙体
    this.walls.forEach(wall => {
      if (wall.health > 0) {
        const sprite = wall.type === 'brick' ? 
          this.spriteRenderer.createPixelSprite(BATTLE_CITY_SPRITES.brick_wall, BATTLE_CITY_SPRITES.colors) :
          this.spriteRenderer.createPixelSprite(BATTLE_CITY_SPRITES.steel_wall, BATTLE_CITY_SPRITES.colors)
        this.spriteRenderer.renderSprite(this.ctx, sprite, wall.x, wall.y, 2)
      }
    })

    // 敌方坦克
    this.enemyManager.enemies.forEach(enemy => {
      if (enemy.alive) {
        const sprite = this.spriteRenderer.createPixelSprite(
          BATTLE_CITY_SPRITES[`enemy_tank_${enemy.direction}`], 
          BATTLE_CITY_SPRITES.colors
        )
        this.spriteRenderer.renderSprite(this.ctx, sprite, enemy.x, enemy.y, 2)
      }
    })

    // 子弹
    this.bulletManager.bullets.forEach(bullet => {
      if (bullet.active) {
        const sprite = this.spriteRenderer.createPixelSprite(BATTLE_CITY_BULLET_SPRITES.shell, BATTLE_CITY_BULLET_SPRITES.colors)
        this.spriteRenderer.renderSprite(this.ctx, sprite, bullet.x, bullet.y, 1)
      }
    })
    
    // 基地
    if (this.playerBase.health > 0) {
      const sprite = this.spriteRenderer.createPixelSprite(BATTLE_CITY_SPRITES.base_eagle, BATTLE_CITY_SPRITES.colors)
      this.spriteRenderer.renderSprite(this.ctx, sprite, this.playerBase.x, this.playerBase.y, 2)
    }
    
    // 玩家坦克
    const playerSprite = this.spriteRenderer.createPixelSprite(
      BATTLE_CITY_SPRITES[`player_tank_${this.player.direction}`], 
      BATTLE_CITY_SPRITES.colors
    )
    this.spriteRenderer.renderSprite(this.ctx, playerSprite, this.player.x, this.player.y, 2)
    
    // UI
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '16px monospace'
    this.ctx.fillText(`Score: ${this.score}`, 10, 30)
    this.ctx.fillText(`Lives: ${this.player.health}`, 10, 60)
    this.ctx.fillText(`Time: ${Math.max(0, Math.ceil(this.gameTimer))}`, this.width - 150, 30)
    this.ctx.fillText(`Enemies: ${this.totalEnemies - this.enemyManager.getDestroyedCount()}`, 10, 90)
    
    if (this.showingGameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      this.ctx.fillRect(0, 0, this.width, this.height)
      this.ctx.fillStyle = '#ff0000'
      this.ctx.font = 'bold 48px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2)
      this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 60)
      this.ctx.textAlign = 'left'
    }
  }

  gameOver() {
    this.showingGameOver = true
  }

  victory() {
    this.showingGameOver = true
  }

  restart() {
    this.showingGameOver = false
    this.gameOverTimer = 0
    this.score = 0
    this.gameTimer = 60
    this.player.reset()
    this.player.x = 256
    this.player.y = 448
    this.playerBase.health = this.playerBase.maxHealth
    this.enemyManager.clear()
    this.bulletManager.clear()
    this.walls = TankLevelGenerator.generateWalls()
  }
}

export { BattleCityGame as TankBattleGame }