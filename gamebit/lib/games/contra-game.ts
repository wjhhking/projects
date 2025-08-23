import { GameLevel } from '../game-engine'
import { BaseGame } from './base-game'
import { SpriteRenderer } from '../sprites'
import { CONTRA_SPRITES } from '../sprites/contra-sprites'

interface Bullet {
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

interface WeaponType {
  name: string
  damage: number
  fireRate: number
  bulletSpeed: number
  spread: number
  bulletSize: number
}

interface ContraEnemy {
  x: number
  y: number
  width: number
  height: number
  type: 'soldier' | 'tank' | 'turret' | 'helicopter'
  health: number
  maxHealth: number
  direction: number
  alive: boolean
  lastShot: number
  shootCooldown: number
  moveSpeed: number
  ai: 'patrol' | 'chase' | 'stationary' | 'fly'
}

export class ContraGame extends BaseGame {
  bullets: Bullet[] = []
  weapons: WeaponType[] = []
  currentWeapon: number = 0
  lastShot: number = 0
  contraEnemies: ContraEnemy[] = []
  enemySpawnTimer: number = 0
  levelProgress: number = 0
  spriteRenderer: SpriteRenderer
  lastWeaponSwitch: number = 0
  weaponSwitchCooldown: number = 0.5 // 0.5秒换枪冷却
  
  constructor(canvas: HTMLCanvasElement) {
    super(canvas, 'contra')
    this.spriteRenderer = new SpriteRenderer()
    this.initializeWeapons()
    this.generateLevels()
    this.player.health = 3 // Contra style lives
    
    // 添加Space键监听
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
      }
    })
  }

  protected initializeSprites(): void {
    // Contra 游戏不使用通用的敌人精灵，有自己的敌人系统
    // 这里可以为空或者初始化一些通用精灵
  }

  initializeWeapons() {
    this.weapons = [
      {
        name: 'Rifle',
        damage: 1,
        fireRate: 0.2,
        bulletSpeed: 400,
        spread: 0,
        bulletSize: 4
      },
      {
        name: 'Machine Gun',
        damage: 1,
        fireRate: 0.1,
        bulletSpeed: 350,
        spread: 0.1,
        bulletSize: 3
      },
      {
        name: 'Spread Gun',
        damage: 2,
        fireRate: 0.3,
        bulletSpeed: 300,
        spread: 0.5,
        bulletSize: 5
      },
      {
        name: 'Laser',
        damage: 3,
        fireRate: 0.4,
        bulletSpeed: 600,
        spread: 0,
        bulletSize: 6
      }
    ]
  }

  generateLevels() {
    this.levels = []
    
    for (let i = 0; i < 6; i++) {
      const levelWidth = 3000 + i * 500
      const level: GameLevel = {
        width: levelWidth,
        platforms: [],
        enemies: [],
        collectibles: [],
        background: '#2d4a2b', // Military green
        flagPosition: { x: levelWidth - 100, y: 300 }
      }

      // Ground platforms
      level.platforms.push({
        x: 0, y: 400, width: levelWidth, height: 80, type: 'ground'
      })

      // Military bunkers and platforms
      const bunkerPositions = [
        { x: 400, y: 320 }, { x: 800, y: 280 }, { x: 1200, y: 340 },
        { x: 1600, y: 300 }, { x: 2000, y: 260 }, { x: 2400, y: 320 }
      ]
      
      bunkerPositions.forEach(pos => {
        if (pos.x < levelWidth - 200) {
          level.platforms.push({
            x: pos.x, y: pos.y, width: 160, height: 80, type: 'platform'
          })
        }
      })

      // Add weapon pickups
      const weaponPositions = [600, 1000, 1400, 1800]
      weaponPositions.forEach((x, index) => {
        if (x < levelWidth - 200) {
          level.collectibles.push({
            x, y: 360, width: 20, height: 20, 
            type: 'powerup', collected: false
          })
        }
      })

      // Add endpoint flag for Contra
      level.flagPosition = { x: levelWidth - 100, y: 300 }

      this.levels.push(level)
    }
  }

  handleInput() {
    if (this.player.isDead) return

    // Movement
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.moveLeft()
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.moveRight()
    } else {
      this.player.stop()
    }

    // Jumping
    if (this.keys['KeyZ'] || this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.player.jump()
    }

    // Shooting
    if (this.keys['KeyX']) {
      this.shoot()
    }

    // Weapon switching
    if (this.keys['Space']) {
      this.switchWeapon()
    }

    // Crouching
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      this.player.crouch()
    }
  }

  shoot() {
    const now = performance.now() / 1000
    const weapon = this.weapons[this.currentWeapon]
    
    if (now - this.lastShot < weapon.fireRate) return
    
    this.lastShot = now
    
    // Create bullets based on weapon type
    if (weapon.name === 'Spread Gun') {
      // Fire 3 bullets in spread pattern
      for (let i = -1; i <= 1; i++) {
        const angle = i * weapon.spread
        this.createBullet(angle, weapon)
      }
    } else {
      // Single bullet
      const spread = (Math.random() - 0.5) * weapon.spread
      this.createBullet(spread, weapon)
    }
  }

  createBullet(angleOffset: number, weapon: WeaponType) {
    // 子弹从角色前方上部发出
    const bulletX = this.player.facing === 'right' ? 
      this.player.x + this.player.width - 2 : 
      this.player.x + 2
    const bulletY = this.player.y + this.player.height * 0.3 // 上部30%位置
    
    const bullet: Bullet = {
      x: bulletX,
      y: bulletY,
      vx: weapon.bulletSpeed * Math.cos(angleOffset) * (this.player.facing === 'right' ? 1 : -1),
      vy: weapon.bulletSpeed * Math.sin(angleOffset),
      width: weapon.bulletSize,
      height: weapon.bulletSize,
      damage: weapon.damage,
      isPlayerBullet: true,
      active: true
    }
    
    this.bullets.push(bullet)
  }

  switchWeapon() {
    const now = performance.now() / 1000
    if (now - this.lastWeaponSwitch < this.weaponSwitchCooldown) return
    
    this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length
    this.lastWeaponSwitch = now
  }

  update(deltaTime: number) {
    if (this.showingGameOver) {
      this.gameOverTimer += deltaTime
      return
    }

    this.handleInput()
    this.player.update(deltaTime)
    this.updateCamera()
    this.updateBullets(deltaTime)
    this.updateContraEnemies(deltaTime)
    this.spawnEnemies(deltaTime)
    this.checkCollisions()
    this.checkBulletCollisions()
  }

  updateBullets(deltaTime: number) {
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.active) return false
      
      bullet.x += bullet.vx * deltaTime
      bullet.y += bullet.vy * deltaTime
      
      // Remove bullets that go off screen
      if (bullet.x < this.camera.x - 100 || 
          bullet.x > this.camera.x + this.width + 100 ||
          bullet.y < -100 || bullet.y > this.height + 100) {
        return false
      }
      
      return true
    })
  }

  spawnEnemies(deltaTime: number) {
    this.enemySpawnTimer += deltaTime
    
    if (this.enemySpawnTimer > 2.0) { // Spawn enemy every 2 seconds
      this.enemySpawnTimer = 0
      this.spawnRandomEnemy()
    }
  }

  spawnRandomEnemy() {
    const currentLevel = this.levels[this.currentLevel]
    const enemyTypes: ContraEnemy['type'][] = ['soldier', 'tank', 'turret', 'helicopter']
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
    
    let enemy: ContraEnemy
    
    switch (type) {
      case 'soldier':
        enemy = {
          x: this.camera.x + this.width + 50,
          y: 368,
          width: 24,
          height: 32,
          type: 'soldier',
          health: 2,
          maxHealth: 2,
          direction: -1,
          alive: true,
          lastShot: 0,
          shootCooldown: 1.5,
          moveSpeed: 80,
          ai: 'patrol'
        }
        break
      case 'tank':
        enemy = {
          x: this.camera.x + this.width + 50,
          y: 340,
          width: 60,
          height: 60,
          type: 'tank',
          health: 8,
          maxHealth: 8,
          direction: -1,
          alive: true,
          lastShot: 0,
          shootCooldown: 2.0,
          moveSpeed: 30,
          ai: 'patrol'
        }
        break
      case 'turret':
        enemy = {
          x: this.camera.x + this.width + 50,
          y: 360,
          width: 32,
          height: 40,
          type: 'turret',
          health: 5,
          maxHealth: 5,
          direction: -1,
          alive: true,
          lastShot: 0,
          shootCooldown: 1.0,
          moveSpeed: 0,
          ai: 'stationary'
        }
        break
      case 'helicopter':
        enemy = {
          x: this.camera.x + this.width + 50,
          y: 100 + Math.random() * 150,
          width: 48,
          height: 32,
          type: 'helicopter',
          health: 4,
          maxHealth: 4,
          direction: -1,
          alive: true,
          lastShot: 0,
          shootCooldown: 1.2,
          moveSpeed: 120,
          ai: 'fly'
        }
        break
    }
    
    this.contraEnemies.push(enemy)
  }

  updateContraEnemies(deltaTime: number) {
    const now = performance.now() / 1000
    
    this.contraEnemies = this.contraEnemies.filter(enemy => {
      if (!enemy.alive) return false
      
      // AI behavior
      switch (enemy.ai) {
        case 'patrol':
          enemy.x += enemy.direction * enemy.moveSpeed * deltaTime
          break
        case 'chase':
          const dx = this.player.x - enemy.x
          enemy.direction = dx > 0 ? 1 : -1
          enemy.x += enemy.direction * enemy.moveSpeed * deltaTime
          break
        case 'fly':
          enemy.x += enemy.direction * enemy.moveSpeed * deltaTime
          enemy.y += Math.sin(now * 2) * 20 * deltaTime
          break
      }
      
      // Enemy shooting
      if (now - enemy.lastShot > enemy.shootCooldown) {
        this.enemyShoot(enemy)
        enemy.lastShot = now
      }
      
      // Remove enemies that are too far off screen
      if (enemy.x < this.camera.x - 200) {
        return false
      }
      
      return true
    })
  }

  enemyShoot(enemy: ContraEnemy) {
    const dx = this.player.x - enemy.x
    const dy = this.player.y - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 500) return // Don't shoot if player is too far
    
    const bullet: Bullet = {
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      vx: (dx / distance) * 200,
      vy: (dy / distance) * 200,
      width: 6,
      height: 6,
      damage: 1,
      isPlayerBullet: false,
      active: true
    }
    
    this.bullets.push(bullet)
  }

  checkBulletCollisions() {
    this.bullets.forEach(bullet => {
      if (!bullet.active) return
      
      if (bullet.isPlayerBullet) {
        // Player bullets hit enemies
        this.contraEnemies.forEach(enemy => {
          if (enemy.alive && this.bulletHitsTarget(bullet, enemy)) {
            bullet.active = false
            enemy.health -= bullet.damage
            
            if (enemy.health <= 0) {
              enemy.alive = false
              this.score += enemy.maxHealth * 50
            }
          }
        })
      } else {
        // Enemy bullets hit player
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
      
      // Bullets can pass through platforms in Contra style
      // Only remove bullets if they hit the ground or go off screen
      const currentLevel = this.levels[this.currentLevel]
      currentLevel.platforms.forEach(platform => {
        if (platform.type === 'ground' && this.bulletHitsTarget(bullet, platform)) {
          bullet.active = false
        }
        // Platform bunkers don't stop bullets - they pass through
      })
    })
  }

  bulletHitsTarget(bullet: Bullet, target: any): boolean {
    return bullet.x < target.x + target.width &&
           bullet.x + bullet.width > target.x &&
           bullet.y < target.y + target.height &&
           bullet.y + bullet.height > target.y
  }

  renderLevel() {
    const currentLevel = this.levels[this.currentLevel]
    
    // Render platforms (military bunkers)
    currentLevel.platforms.forEach(platform => {
      if (platform.type === 'ground') {
        // Ground with military texture
        this.ctx.fillStyle = '#3d5a3b'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        
        // Ground details
        this.ctx.fillStyle = '#2d4a2b'
        for (let x = platform.x; x < platform.x + platform.width; x += 20) {
          this.ctx.fillRect(x, platform.y + 5, 3, 3)
          this.ctx.fillRect(x + 10, platform.y + 15, 2, 2)
        }
      } else {
        // Military bunkers
        this.ctx.fillStyle = '#666666'
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
        
        // Bunker details
        this.ctx.fillStyle = '#444444'
        this.ctx.fillRect(platform.x, platform.y, platform.width, 5)
        this.ctx.fillRect(platform.x, platform.y + platform.height - 5, platform.width, 5)
        
        // Windows/slots
        for (let i = 0; i < 3; i++) {
          const slotX = platform.x + 20 + i * 40
          this.ctx.fillStyle = '#222222'
          this.ctx.fillRect(slotX, platform.y + 20, 8, 20)
        }
      }
    })

    // Render Contra enemies
    this.contraEnemies.forEach(enemy => {
      if (enemy.alive) {
        this.renderEnemy(enemy)
        this.renderEnemyHealthBar(enemy)
      }
    })

    // Render bullets
    this.bullets.forEach(bullet => {
      if (bullet.active) {
        if (bullet.isPlayerBullet) {
          this.ctx.fillStyle = '#ffff00' // Yellow player bullets
        } else {
          this.ctx.fillStyle = '#ff4444' // Red enemy bullets
        }
        this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
      }
    })

    // Render collectibles (weapon pickups)
    currentLevel.collectibles.forEach(collectible => {
      if (!collectible.collected) {
        this.ctx.fillStyle = '#00ff00'
        this.ctx.fillRect(collectible.x, collectible.y, collectible.width, collectible.height)
        
        // Weapon icon
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = '12px monospace'
        this.ctx.fillText('W', collectible.x + 6, collectible.y + 14)
      }
    })
    
    // Render endpoint flag
    if (currentLevel.flagPosition) {
      this.renderContraFlag(currentLevel.flagPosition.x, currentLevel.flagPosition.y)
    }
  }

  renderContraFlag(x: number, y: number) {
    // Flag pole
    this.ctx.fillStyle = '#666666'
    this.ctx.fillRect(x, y, 4, 100)
    
    // Military flag
    this.ctx.fillStyle = '#ff0000'
    this.ctx.fillRect(x + 4, y, 40, 25)
    
    // Flag details
    this.ctx.fillStyle = '#ffffff'
    this.ctx.fillRect(x + 8, y + 5, 8, 3)
    this.ctx.fillRect(x + 8, y + 12, 8, 3)
    this.ctx.fillRect(x + 8, y + 19, 8, 3)
  }

  renderEnemy(enemy: ContraEnemy) {
    switch (enemy.type) {
      case 'soldier':
        // 使用新的精灵系统渲染敌方士兵
        const enemySprite = this.spriteRenderer.createPixelSprite(
          CONTRA_SPRITES.enemy_soldier,
          CONTRA_SPRITES.colors
        )
        
        if (enemy.direction < 0) {
          this.ctx.save()
          this.ctx.scale(-1, 1)
          this.spriteRenderer.renderSprite(this.ctx, enemySprite, -enemy.x - enemy.width, enemy.y, 2)
          this.ctx.restore()
        } else {
          this.spriteRenderer.renderSprite(this.ctx, enemySprite, enemy.x, enemy.y, 2)
        }
        break
        
      case 'tank':
        this.ctx.fillStyle = '#4a4a4a'
        this.ctx.fillRect(enemy.x, enemy.y + 20, enemy.width, 40)
        
        // Tank turret
        this.ctx.fillStyle = '#666666'
        this.ctx.fillRect(enemy.x + 15, enemy.y, 30, 25)
        
        // Tank cannon
        this.ctx.fillStyle = '#333333'
        this.ctx.fillRect(enemy.x + (enemy.direction > 0 ? 45 : -20), enemy.y + 10, 20, 5)
        
        // Tracks
        this.ctx.fillStyle = '#222222'
        this.ctx.fillRect(enemy.x, enemy.y + 50, enemy.width, 10)
        break
        
      case 'turret':
        this.ctx.fillStyle = '#666666'
        this.ctx.fillRect(enemy.x, enemy.y + 20, enemy.width, 20)
        
        // Turret gun
        this.ctx.fillStyle = '#444444'
        this.ctx.fillRect(enemy.x + 8, enemy.y, 16, 25)
        
        // Barrel
        this.ctx.fillStyle = '#333333'
        this.ctx.fillRect(enemy.x + (enemy.direction > 0 ? 24 : -12), enemy.y + 8, 12, 4)
        break
        
      case 'helicopter':
        this.ctx.fillStyle = '#4a4a4a'
        this.ctx.fillRect(enemy.x + 8, enemy.y + 12, 32, 16)
        
        // Rotor
        this.ctx.fillStyle = '#666666'
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, 4)
        
        // Tail
        this.ctx.fillStyle = '#4a4a4a'
        this.ctx.fillRect(enemy.x + 35, enemy.y + 16, 8, 4)
        break
    }
  }

  renderEnemyHealthBar(enemy: ContraEnemy) {
    if (enemy.health < enemy.maxHealth) {
      const barWidth = enemy.width
      const barHeight = 4
      const healthPercent = enemy.health / enemy.maxHealth
      
      // Background
      this.ctx.fillStyle = '#ff0000'
      this.ctx.fillRect(enemy.x, enemy.y - 8, barWidth, barHeight)
      
      // Health
      this.ctx.fillStyle = '#00ff00'
      this.ctx.fillRect(enemy.x, enemy.y - 8, barWidth * healthPercent, barHeight)
    }
  }

  renderUI() {
    // Contra 游戏不显示 UI，保持纯净的游戏画面
  }

  checkCollisions() {
    const currentLevel = this.levels[this.currentLevel]
    
    // Platform collisions
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

    // Collectibles collisions
    currentLevel.collectibles.forEach(collectible => {
      if (!collectible.collected && this.checkCollision(this.player, collectible)) {
        collectible.collected = true
        this.score += 100
      }
    })

    // Enemy collisions
    currentLevel.enemies.forEach(enemy => {
      if (enemy.alive && this.checkCollision(this.player, enemy)) {
        if (this.player.vy > 0 && 
            this.player.y < enemy.y && 
            enemy.canBeStomped) {
          enemy.alive = false
          this.player.vy = -200
          this.score += 200
        } else {
          this.player.die()
          setTimeout(() => {
            this.gameOver()
          }, 2000)
        }
      }
    })
    
    // Contra flag collision - larger trigger area
    if (currentLevel.flagPosition) {
      const flagHitbox = {
        x: currentLevel.flagPosition.x - 20, // Extend left
        y: currentLevel.flagPosition.y - 20, // Extend up
        width: 64, // Full flag width including pole and flag
        height: 120 // Full flag height
      }
      
      if (this.checkCollision(this.player, flagHitbox)) {
        this.nextLevel()
      }
    }
    
    // Weapon pickup collisions
    currentLevel.collectibles.forEach(collectible => {
      if (!collectible.collected && collectible.type === 'powerup' && this.checkCollision(this.player, collectible)) {
        collectible.collected = true
        this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length
        this.score += 50
      }
    })
  }

  renderGameOver() {
    // Simple red "GAME OVER" text in center of screen
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.ctx.fillStyle = '#ff0000'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2)
    
    // Reset text alignment
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'alphabetic'
  }
}
