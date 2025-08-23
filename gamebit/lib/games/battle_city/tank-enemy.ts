import { TankEnemy, Direction, AIType } from './tank-types'
import { TankPlayer } from './tank-player'
import { Wall, Base } from './tank-types'

export class TankEnemyManager {
  enemies: TankEnemy[] = []
  enemiesSpawned: number = 0
  enemySpawnTimer: number = 0

  spawnEnemy(currentLevel: number, totalEnemiesForLevel: number): TankEnemy | null {
    const maxOnScreenEnemies = 3 + currentLevel
    
    if (this.getAliveEnemies().length >= maxOnScreenEnemies || 
        this.enemiesSpawned >= totalEnemiesForLevel) {
      return null
    }

    const spawnPositions = [
      { x: 32, y: 32 },   // 左上角
      { x: 384, y: 32 },  // 中上
      { x: 736, y: 32 }   // 右上角
    ]
    
    const pos = spawnPositions[Math.floor(Math.random() * spawnPositions.length)]
    const aiTypes: AIType[] = ['patrol', 'hunt', 'guard']
    const ai = aiTypes[Math.floor(Math.random() * aiTypes.length)]
    
    const enemy: TankEnemy = {
      x: pos.x,
      y: pos.y,
      width: 32,
      height: 32,
      direction: 'down',
      health: 1,
      maxHealth: 1,
      alive: true,
      lastShot: 0,
      shootCooldown: 2.0 + Math.random() * 2.0,
      lastMove: 0,
      moveCooldown: 1.0,
      ai
    }
    
    this.enemies.push(enemy)
    this.enemiesSpawned++
    return enemy
  }

  update(
    deltaTime: number, 
    gameWidth: number, 
    gameHeight: number,
    walls: Wall[],
    player: TankPlayer,
    base: Base,
    onEnemyShoot: (enemy: TankEnemy) => void
  ) {
    const now = performance.now() / 1000
    
    this.enemies.forEach(enemy => {
      if (!enemy.alive) return
      
      // AI 移动
      if (now - enemy.lastMove > enemy.moveCooldown) {
        this.updateEnemyAI(enemy, player, base)
        enemy.lastMove = now
        enemy.moveCooldown = 1.0 + Math.random() * 2.0
      }
      
      // 移动敌方坦克
      this.moveEnemy(enemy, deltaTime, gameWidth, gameHeight, walls)
      
      // 敌人射击
      if (now - enemy.lastShot > enemy.shootCooldown) {
        onEnemyShoot(enemy)
        enemy.lastShot = now
      }
    })
  }

  private moveEnemy(
    enemy: TankEnemy, 
    deltaTime: number, 
    gameWidth: number, 
    gameHeight: number,
    walls: Wall[]
  ) {
    let newX = enemy.x
    let newY = enemy.y
    const speed = 50
    
    switch (enemy.direction) {
      case 'up':
        newY -= speed * deltaTime
        break
      case 'down':
        newY += speed * deltaTime
        break
      case 'left':
        newX -= speed * deltaTime
        break
      case 'right':
        newX += speed * deltaTime
        break
    }
    
    // 检查边界和墙体碰撞 - 允许敌方坦克在整个屏幕移动
    if (newX >= 0 && newX <= gameWidth - enemy.width &&
        newY >= 0 && newY <= gameHeight - enemy.height &&
        !this.checkWallCollision({ x: newX, y: newY, width: enemy.width, height: enemy.height }, walls)) {
      enemy.x = newX
      enemy.y = newY
    } else {
      // 碰到障碍物，改变方向
      const directions: Direction[] = ['up', 'down', 'left', 'right']
      enemy.direction = directions[Math.floor(Math.random() * directions.length)]
    }
  }

  private updateEnemyAI(enemy: TankEnemy, player: TankPlayer, base: Base) {
    const directions: Direction[] = ['up', 'down', 'left', 'right']
    
    switch (enemy.ai) {
      case 'patrol':
        // 随机改变方向
        enemy.direction = directions[Math.floor(Math.random() * directions.length)]
        break
      case 'hunt':
        // 朝向玩家方向
        const dx = player.x - enemy.x
        const dy = player.y - enemy.y
        
        if (Math.abs(dx) > Math.abs(dy)) {
          enemy.direction = dx > 0 ? 'right' : 'left'
        } else {
          enemy.direction = dy > 0 ? 'down' : 'up'
        }
        break
      case 'guard':
        // 朝向基地方向
        const baseDx = base.x - enemy.x
        const baseDy = base.y - enemy.y
        
        if (Math.abs(baseDx) > Math.abs(baseDy)) {
          enemy.direction = baseDx > 0 ? 'right' : 'left'
        } else {
          enemy.direction = baseDy > 0 ? 'down' : 'up'
        }
        break
    }
  }

  private checkWallCollision(rect: { x: number, y: number, width: number, height: number }, walls: Wall[]): boolean {
    return walls.some(wall => 
      wall.health > 0 &&
      rect.x < wall.x + wall.width &&
      rect.x + rect.width > wall.x &&
      rect.y < wall.y + wall.height &&
      rect.y + rect.height > wall.y
    )
  }

  getAliveEnemies(): TankEnemy[] {
    return this.enemies.filter(enemy => enemy.alive)
  }

  getDestroyedCount(): number {
    return this.enemies.filter(enemy => !enemy.alive).length
  }

  clear() {
    this.enemies = []
    this.enemiesSpawned = 0
    this.enemySpawnTimer = 0
  }
}
