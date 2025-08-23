import { TankBullet, TankEnemy, Wall, Base, Direction } from './tank-types'
import { TankPlayer } from './tank-player'

export class TankBulletManager {
  bullets: TankBullet[] = []

  createBullet(
    x: number, 
    y: number, 
    direction: Direction, 
    isPlayerBullet: boolean = false
  ): TankBullet {
    let bulletX = x
    let bulletY = y
    let vx = 0
    let vy = 0
    
    switch (direction) {
      case 'up':
        bulletY = y - 4
        vy = isPlayerBullet ? -300 : -200
        break
      case 'down':
        bulletY = y + 32
        vy = isPlayerBullet ? 300 : 200
        break
      case 'left':
        bulletX = x - 4
        vx = isPlayerBullet ? -300 : -200
        break
      case 'right':
        bulletX = x + 32
        vx = isPlayerBullet ? 300 : 200
        break
    }
    
    const bullet: TankBullet = {
      x: bulletX,
      y: bulletY,
      vx,
      vy,
      width: 4,
      height: 4,
      damage: 1,
      isPlayerBullet,
      active: true
    }
    
    this.bullets.push(bullet)
    return bullet
  }

  update(deltaTime: number, gameWidth: number, gameHeight: number) {
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.active) return false
      
      bullet.x += bullet.vx * deltaTime
      bullet.y += bullet.vy * deltaTime
      
      // 移除超出屏幕的子弹
      if (bullet.x < 0 || bullet.x > gameWidth || bullet.y < 0 || bullet.y > gameHeight) {
        return false
      }
      
      return true
    })
  }

  checkBulletHit(bullet: TankBullet, target: any): boolean {
    return bullet.x < target.x + target.width &&
           bullet.x + bullet.width > target.x &&
           bullet.y < target.y + target.height &&
           bullet.y + bullet.height > target.y
  }

  handleBulletCollisions(
    walls: Wall[], 
    enemies: TankEnemy[], 
    player: TankPlayer, 
    base: Base,
    onScoreUpdate: (points: number) => void,
    onPlayerHit: () => void,
    onBaseHit: () => void
  ) {
    this.bullets.forEach(bullet => {
      if (!bullet.active) return
      
      // 子弹与墙体碰撞
      walls.forEach(wall => {
        if (wall.health > 0 && this.checkBulletHit(bullet, wall)) {
          bullet.active = false
          
          if (wall.type === 'brick') {
            wall.health -= bullet.damage
            if (wall.health <= 0) {
              onScoreUpdate(10)
            }
          }
        }
      })
      
      if (bullet.isPlayerBullet) {
        // 玩家子弹击中敌人
        enemies.forEach(enemy => {
          if (enemy.alive && this.checkBulletHit(bullet, enemy)) {
            bullet.active = false
            enemy.health -= bullet.damage
            
            if (enemy.health <= 0) {
              enemy.alive = false
              onScoreUpdate(100)
            }
          }
        })
      } else {
        // 敌人子弹击中玩家
        if (this.checkBulletHit(bullet, player)) {
          bullet.active = false
          onPlayerHit()
        }
        
        // 敌人子弹击中基地
        if (this.checkBulletHit(bullet, base)) {
          bullet.active = false
          base.health -= bullet.damage
          
          if (base.health <= 0) {
            onBaseHit()
          }
        }
      }
    })
  }

  clear() {
    this.bullets = []
  }
}
