import { Direction } from './index'

export class TankPlayer {
  x: number
  y: number
  width: number = 32
  height: number = 32
  vx: number = 0
  vy: number = 0
  health: number = 3
  isDead: boolean = false
  direction: Direction = 'up'
  invulnerableTime: number = 0
  
  constructor(x: number = 256, y: number = 448) {
    this.x = x
    this.y = y
  }
  
  update(deltaTime: number) {
    if (this.invulnerableTime > 0) {
      this.invulnerableTime -= deltaTime
    }
  }
  
  takeDamage() {
    if (this.invulnerableTime > 0 || this.isDead) return
    
    this.health--
    this.invulnerableTime = 2.0
    
    if (this.health <= 0) {
      this.isDead = true
    }
  }
  
  reset() {
    this.health = 3
    this.isDead = false
    this.invulnerableTime = 0
    this.vx = 0
    this.vy = 0
  }
}
