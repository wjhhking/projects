import { GameLevel } from '../game-engine'
import { BaseGame } from './base-game'
import { SpriteRenderer } from '../sprites'
import { RAIDEN_SPRITES, BULLET_SPRITES } from '../sprites/raiden-sprites'

interface RaidenBullet {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  damage: number
  isPlayerBullet: boolean
  active: boolean
  type: 'normal' | 'laser' | 'spread'
}

interface RaidenEnemy {
  x: number
  y: number
  width: number
  height: number
  type: 'fighter' | 'bomber' | 'boss'
  health: number
  maxHealth: number
  vx: number
  vy: number
  alive: boolean
  lastShot: number
  shootCooldown: number
  ai: 'straight' | 'zigzag' | 'circle' | 'dive'
  aiTimer: number
}

interface PowerUp {
  x: number
  y: number
  width: number
  height: number
  type: 'weapon' | 'speed' | 'health'
  collected: boolean
}

export class RaidenGame extends BaseGame {
  bullets: RaidenBullet[] = []
  raidenEnemies: RaidenEnemy[] = []
  powerUps: PowerUp[] = []
  enemySpawnTimer: number = 0
  powerUpSpawnTimer: number = 0
  lastShot: number = 0
  weaponLevel: number = 1
  maxWeaponLevel: number = 3
  scrollSpeed: number = 100
  spriteRenderer: SpriteRenderer
  
  // 精灵缓存
  private playerSprite!: ImageData
  private enemySmallSprite!: ImageData
  private enemyLargeSprite!: ImageData
  private explosionSprite!: ImageData
  private powerUpSprite!: ImageData
  private playerBulletSprite!: ImageData
  private enemyBulletSprite!: ImageData
  private laserSprite!: ImageData

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, 'raiden')
    this.spriteRenderer = new SpriteRenderer()
    this.initializeSprites()
    this.generateLevels()
    this.player.health = 3
    
    // 设置玩家初始位置 (左侧中央)
    this.player.x = 100
    this.player.y = this.height / 2 - this.player.height / 2
  }

  protected initializeSprites() {
    this.playerSprite = this.spriteRenderer.createPixelSprite(
      RAIDEN_SPRITES.player,
      RAIDEN_SPRITES.colors
    )
    // 设置玩家碰撞盒与渲染比例一致（渲染缩放为2x）
    this.player.width = this.playerSprite.width * 2
    this.player.height = this.playerSprite.height * 2

    this.enemySmallSprite = this.spriteRenderer.createPixelSprite(
      RAIDEN_SPRITES.enemy_small,
      RAIDEN_SPRITES.colors
    )
    this.enemyLargeSprite = this.spriteRenderer.createPixelSprite(
      RAIDEN_SPRITES.enemy_large,
      RAIDEN_SPRITES.colors
    )
    this.explosionSprite = this.spriteRenderer.createPixelSprite(
      RAIDEN_SPRITES.explosion,
      RAIDEN_SPRITES.colors
    )
    this.powerUpSprite = this.spriteRenderer.createPixelSprite(
      RAIDEN_SPRITES.power_up,
      RAIDEN_SPRITES.colors
    )
    this.playerBulletSprite = this.spriteRenderer.createPixelSprite(
      BULLET_SPRITES.player_bullet,
      BULLET_SPRITES.colors
    )
    this.enemyBulletSprite = this.spriteRenderer.createPixelSprite(
      BULLET_SPRITES.enemy_bullet,
      BULLET_SPRITES.colors
    )
    this.laserSprite = this.spriteRenderer.createPixelSprite(
      BULLET_SPRITES.laser_beam,
      BULLET_SPRITES.colors
    )
  }

  generateLevels() {
    this.levels = []
    
    // Raiden 风格：水平飞行射击，无平台
    for (let i = 0; i < 5; i++) {
      const levelWidth = 4000 + i * 1000
      const level: GameLevel = {
        width: levelWidth,
        platforms: [], // 雷电游戏没有平台
        enemies: [], // 敌人动态生成
        collectibles: [], // 道具动态生成
        background: '#001122', // 深蓝太空背景
        flagPosition: { x: levelWidth - 100, y: this.height / 2 }
      }

      this.levels.push(level)
    }
  }

  handleInput() {
    if (this.player.isDead) return

    // 飞机移动 - 可以上下左右移动
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.vx = -200
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.vx = 200
    } else {
      this.player.vx = 0
    }

    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.player.vy = -200
    } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      this.player.vy = 200
    } else {
      this.player.vy = 0
    }

    // 射击
    if (this.keys['KeyX'] || this.keys['Space']) {
      this.shoot()
    }
  }

  shoot() {
    const now = performance.now() / 1000
    const fireRate = Math.max(0.1, 0.3 - (this.weaponLevel - 1) * 0.05)
    
    if (now - this.lastShot < fireRate) return
    
    this.lastShot = now
    
    // 根据武器等级发射不同的子弹
    switch (this.weaponLevel) {
      case 1:
        this.createBullet(this.player.x + this.player.width, this.player.y + this.player.height / 2, 'normal')
        break
      case 2:
        // 双发
        this.createBullet(this.player.x + this.player.width, this.player.y + 8, 'normal')
        this.createBullet(this.player.x + this.player.width, this.player.y + this.player.height - 8, 'normal')
        break
      case 3:
        // 三发散射
        this.createBullet(this.player.x + this.player.width, this.player.y + this.player.height / 2, 'normal')
        this.createBullet(this.player.x + this.player.width, this.player.y + 4, 'normal', -0.2)
        this.createBullet(this.player.x + this.player.width, this.player.y + this.player.height - 4, 'normal', 0.2)
        break
    }
  }

  createBullet(x: number, y: number, type: 'normal' | 'laser' | 'spread', angleOffset: number = 0) {
    const bullet: RaidenBullet = {
      x,
      y,
      vx: 400,
      vy: angleOffset * 200,
      width: type === 'laser' ? 2 : 4,
      height: type === 'laser' ? 12 : 8,
      damage: this.weaponLevel,
      isPlayerBullet: true,
      active: true,
      type
    }
    
    this.bullets.push(bullet)
  }

  update(deltaTime: number) {
    if (this.showingGameOver) {
      this.gameOverTimer += deltaTime
      return
    }

    this.handleInput()
    this.updatePlayer(deltaTime)
    this.updateCamera(deltaTime)
    this.updateBullets(deltaTime)
    this.updateEnemies(deltaTime)
    this.updatePowerUps(deltaTime)
    this.spawnEnemies(deltaTime)
    this.spawnPowerUps(deltaTime)
    this.checkCollisions()
    this.checkBulletCollisions()
  }

  updatePlayer(deltaTime: number) {
    // 更新玩家位置
    this.player.x += this.player.vx * deltaTime
    this.player.y += this.player.vy * deltaTime
    
    // 限制玩家在屏幕范围内
    this.player.x = Math.max(0, Math.min(this.player.x, this.width - this.player.width))
    this.player.y = Math.max(0, Math.min(this.player.y, this.height - this.player.height))
  }

  updateCamera(deltaTime: number) {
    // 水平自动滚屏
    this.camera.x += this.scrollSpeed * deltaTime
    const currentLevel = this.levels[this.currentLevel]
    
    // 检查关卡结束
    if (this.camera.x >= currentLevel.width - this.width) {
      this.nextLevel()
    }
  }

  updateBullets(deltaTime: number) {
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.active) return false
      
      bullet.x += bullet.vx * deltaTime
      bullet.y += bullet.vy * deltaTime
      
      // 移除超出屏幕的子弹
      if (bullet.x < this.camera.x - 50 || 
          bullet.x > this.camera.x + this.width + 50 ||
          bullet.y < -50 || bullet.y > this.height + 50) {
        return false
      }
      
      return true
    })
  }

  updateEnemies(deltaTime: number) {
    const now = performance.now() / 1000
    
    this.raidenEnemies = this.raidenEnemies.filter(enemy => {
      if (!enemy.alive) return false
      
      // AI 行为
      enemy.aiTimer += deltaTime
      
      switch (enemy.ai) {
        case 'straight':
          enemy.x += enemy.vx * deltaTime
          break
        case 'zigzag':
          enemy.x += enemy.vx * deltaTime
          enemy.y += Math.sin(enemy.aiTimer * 3) * 50 * deltaTime
          break
        case 'circle':
          const radius = 50
          enemy.x += enemy.vx * deltaTime
          enemy.y += Math.sin(enemy.aiTimer * 2) * radius * deltaTime
          break
        case 'dive':
          if (enemy.aiTimer > 2) {
            enemy.vy = 150
          }
          enemy.x += enemy.vx * deltaTime
          enemy.y += enemy.vy * deltaTime
          break
      }
      
      // 敌人射击
      if (now - enemy.lastShot > enemy.shootCooldown) {
        this.enemyShoot(enemy)
        enemy.lastShot = now
      }
      
      // 移除超出屏幕的敌人
      if (enemy.x < this.camera.x - 100) {
        return false
      }
      
      return true
    })
  }

  updatePowerUps(deltaTime: number) {
    this.powerUps = this.powerUps.filter(powerUp => {
      if (powerUp.collected) return false
      
      powerUp.x -= this.scrollSpeed * deltaTime
      
      // 移除超出屏幕的道具
      if (powerUp.x < this.camera.x - 50) {
        return false
      }
      
      return true
    })
  }

  spawnEnemies(deltaTime: number) {
    this.enemySpawnTimer += deltaTime
    
    const spawnRate = Math.max(1.0, 2.5 - this.currentLevel * 0.3)
    
    if (this.enemySpawnTimer > spawnRate) {
      this.enemySpawnTimer = 0
      this.spawnRandomEnemy()
    }
  }

  spawnPowerUps(deltaTime: number) {
    this.powerUpSpawnTimer += deltaTime
    
    if (this.powerUpSpawnTimer > 8.0) { // 每8秒生成一个道具
      this.powerUpSpawnTimer = 0
      this.spawnPowerUp()
    }
  }

  spawnRandomEnemy() {
    const enemyTypes: RaidenEnemy['type'][] = ['fighter', 'bomber']
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
    const aiTypes: RaidenEnemy['ai'][] = ['straight', 'zigzag', 'circle', 'dive']
    const ai = aiTypes[Math.floor(Math.random() * aiTypes.length)]
    
    let enemy!: RaidenEnemy
    
    switch (type) {
      case 'fighter':
        enemy = {
          x: this.camera.x + this.width + 50,
          y: Math.random() * (this.height - 60) + 30,
          width: 24,
          height: 24,
          type: 'fighter',
          health: 2,
          maxHealth: 2,
          vx: -120,
          vy: 0,
          alive: true,
          lastShot: 0,
          shootCooldown: 1.5,
          ai,
          aiTimer: 0
        }
        break
      case 'bomber':
        enemy = {
          x: this.camera.x + this.width + 50,
          y: Math.random() * (this.height - 80) + 40,
          width: 32,
          height: 24,
          type: 'bomber',
          health: 5,
          maxHealth: 5,
          vx: -80,
          vy: 0,
          alive: true,
          lastShot: 0,
          shootCooldown: 2.0,
          ai: 'straight',
          aiTimer: 0
        }
        break
    }
    
    this.raidenEnemies.push(enemy)
  }

  spawnPowerUp() {
    const types: PowerUp['type'][] = ['weapon', 'speed', 'health']
    const type = types[Math.floor(Math.random() * types.length)]
    
    const powerUp: PowerUp = {
      x: this.camera.x + this.width + 50,
      y: Math.random() * (this.height - 40) + 20,
      width: 16,
      height: 16,
      type,
      collected: false
    }
    
    this.powerUps.push(powerUp)
  }

  enemyShoot(enemy: RaidenEnemy) {
    const dx = this.player.x - enemy.x
    const dy = this.player.y - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 300) return // 距离太远不射击
    
    const bullet: RaidenBullet = {
      x: enemy.x,
      y: enemy.y + enemy.height / 2,
      vx: (dx / distance) * 200,
      vy: (dy / distance) * 200,
      width: 4,
      height: 6,
      damage: 1,
      isPlayerBullet: false,
      active: true,
      type: 'normal'
    }
    
    this.bullets.push(bullet)
  }

  checkBulletCollisions() {
    this.bullets.forEach(bullet => {
      if (!bullet.active) return
      
      if (bullet.isPlayerBullet) {
        // 玩家子弹击中敌人
        this.raidenEnemies.forEach(enemy => {
          if (enemy.alive && this.bulletHitsTarget(bullet, enemy)) {
            bullet.active = false
            enemy.health -= bullet.damage
            
            if (enemy.health <= 0) {
              enemy.alive = false
              this.score += enemy.maxHealth * 100
              
              // 有概率掉落道具
              if (Math.random() < 0.3) {
                this.spawnPowerUp()
              }
            }
          }
        })
      } else {
        // 敌人子弹击中玩家
        if (this.bulletHitsTarget(bullet, this.player)) {
          bullet.active = false
          this.player.takeDamage()
          
          if (this.player.health <= 0) {
            this.player.die()
            setTimeout(() => {
              this.gameOver()
            }, 2000)
          }
        }
      }
    })
  }

  bulletHitsTarget(bullet: RaidenBullet, target: any): boolean {
    return bullet.x < target.x + target.width &&
           bullet.x + bullet.width > target.x &&
           bullet.y < target.y + target.height &&
           bullet.y + bullet.height > target.y
  }

  checkCollisions() {
    // 玩家与敌人碰撞
    this.raidenEnemies.forEach(enemy => {
      if (enemy.alive && this.checkCollision(this.player, enemy)) {
        enemy.alive = false
        this.player.takeDamage()
        
        if (this.player.health <= 0) {
          this.player.die()
          setTimeout(() => {
            this.gameOver()
          }, 2000)
        }
      }
    })
    
    // 玩家与道具碰撞
    this.powerUps.forEach(powerUp => {
      if (!powerUp.collected && this.checkCollision(this.player, powerUp)) {
        powerUp.collected = true
        this.collectPowerUp(powerUp)
      }
    })
  }

  collectPowerUp(powerUp: PowerUp) {
    switch (powerUp.type) {
      case 'weapon':
        if (this.weaponLevel < this.maxWeaponLevel) {
          this.weaponLevel++
        }
        this.score += 500
        break
      case 'speed':
        this.scrollSpeed = Math.min(this.scrollSpeed + 20, 200)
        this.score += 300
        break
      case 'health':
        if (this.player.health < 3) {
          this.player.health++
        }
        this.score += 1000
        break
    }
  }

  renderLevel() {
    // 渲染星空背景
    this.renderStarfield()
    
    // 渲染敌人
    this.raidenEnemies.forEach(enemy => {
      if (enemy.alive) {
        let sprite: ImageData
        switch (enemy.type) {
          case 'fighter':
            sprite = this.enemySmallSprite
            break
          case 'bomber':
            sprite = this.enemyLargeSprite
            break
          default:
            sprite = this.enemySmallSprite // 默认为小型飞机
        }
        this.spriteRenderer.renderSprite(this.ctx, sprite, enemy.x - this.camera.x, enemy.y, 2)
      }
    })

    // 渲染子弹
    this.bullets.forEach(bullet => {
      if (bullet.active) {
        this.renderBullet(bullet)
      }
    })

    // 渲染道具
    this.powerUps.forEach(powerUp => {
      if (!powerUp.collected) {
        this.spriteRenderer.renderSprite(this.ctx, this.powerUpSprite, powerUp.x, powerUp.y, 2)
      }
    })
  }

  renderStarfield() {
    // 简单的星空效果
    this.ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 50; i++) {
      const x = (this.camera.x * 0.1 + i * 100) % this.width
      const y = (i * 37) % this.height
      this.ctx.fillRect(x, y, 1, 1)
    }
    
    // 更亮的星星
    this.ctx.fillStyle = '#ffff88'
    for (let i = 0; i < 20; i++) {
      const x = (this.camera.x * 0.05 + i * 150) % this.width
      const y = (i * 73) % this.height
      this.ctx.fillRect(x, y, 2, 2)
    }
  }

  renderEnemy(enemy: RaidenEnemy) {
    switch (enemy.type) {
      case 'fighter':
        this.spriteRenderer.renderSprite(this.ctx, this.enemySmallSprite, enemy.x, enemy.y, 2)
        break
      case 'bomber':
        this.spriteRenderer.renderSprite(this.ctx, this.enemyLargeSprite, enemy.x, enemy.y, 2)
        break
    }
  }

  renderBullet(bullet: RaidenBullet) {
    if (bullet.isPlayerBullet) {
      if (bullet.type === 'laser') {
        this.spriteRenderer.renderSprite(this.ctx, this.laserSprite, bullet.x, bullet.y, 1)
      } else {
        this.spriteRenderer.renderSprite(this.ctx, this.playerBulletSprite, bullet.x, bullet.y, 1)
      }
    } else {
      this.spriteRenderer.renderSprite(this.ctx, this.enemyBulletSprite, bullet.x, bullet.y, 1)
    }
  }

  renderEnemyHealthBar(enemy: RaidenEnemy) {
    if (enemy.health < enemy.maxHealth) {
      const barWidth = enemy.width
      const barHeight = 3
      const healthPercent = enemy.health / enemy.maxHealth
      
      // 背景
      this.ctx.fillStyle = '#ff0000'
      this.ctx.fillRect(enemy.x, enemy.y - 6, barWidth, barHeight)
      
      // 血量
      this.ctx.fillStyle = '#00ff00'
      this.ctx.fillRect(enemy.x, enemy.y - 6, barWidth * healthPercent, barHeight)
    }
  }

  render() {
    // 背景
    this.ctx.fillStyle = this.levels[this.currentLevel].background
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.renderLevel()
    
    // 渲染玩家
    this.spriteRenderer.renderSprite(this.ctx, this.playerSprite, this.player.x, this.player.y, 2)
    
    this.renderUI()
    
    if (this.showingGameOver) {
      this.renderGameOver()
    }
  }

  renderUI() {
    // Raiden 游戏不显示 UI，保持纯净的游戏画面
  }

  renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.ctx.fillStyle = '#ff0000'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2)
    
    // 重置文本对齐
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'alphabetic'
  }
}
