import { GameObject } from './game-engine'
import { SpriteRenderer, MARIO_SPRITES } from './sprites'

export class Player implements GameObject {
  x: number = 50
  y: number = 300
  width: number = 32
  height: number = 32
  vx: number = 0
  vy: number = 0
  grounded: boolean = false
  
  // 玩家状态
  facing: 'left' | 'right' = 'right'
  jumping: boolean = false
  maxSpeed: number = 200
  jumpPower: number = 400
  isDead: boolean = false
  deathAnimationTimer: number = 0
  
  // 动画
  animFrame: number = 0
  animTimer: number = 0
  
  // 精灵渲染器
  private spriteRenderer: SpriteRenderer
  private marioSprite: ImageData
  
  constructor(startX: number = 50, startY: number = 300) {
    this.x = startX
    this.y = startY
    
    // 初始化精灵系统
    this.spriteRenderer = new SpriteRenderer()
    this.marioSprite = this.spriteRenderer.createPixelSprite(
      MARIO_SPRITES.standing,
      MARIO_SPRITES.colors
    )
  }

  update(deltaTime: number) {
    if (this.isDead) {
      // 死亡动画
      this.deathAnimationTimer += deltaTime
      
      // 死亡时向上弹跳然后下落
      if (this.deathAnimationTimer < 0.5) {
        this.vy = -300 // 向上弹跳
      } else {
        this.vy += 800 * deltaTime // 重力下落
      }
      
      this.y += this.vy * deltaTime
      return
    }
    
    // 总是应用重力
    this.vy += 800 * deltaTime // 重力加速度
    
    // 限制下落速度
    this.vy = Math.min(this.vy, 600)
    
    // 更新位置
    this.x += this.vx * deltaTime
    this.y += this.vy * deltaTime
    
    // 重置接地状态，将在碰撞检测中重新设置
    this.grounded = false
    
    // 地面碰撞检测（简单版本，作为后备）
    if (this.y > 400 - this.height) {
      this.y = 400 - this.height
      this.vy = 0
      this.grounded = true
      this.jumping = false
    }
    
    // 动画更新
    if (Math.abs(this.vx) > 0) {
      this.animTimer += deltaTime
      if (this.animTimer > 0.1) {
        this.animFrame = (this.animFrame + 1) % 4
        this.animTimer = 0
      }
    } else {
      this.animFrame = 0
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.isDead) {
      // 死亡状态渲染 - 倒立的 Mario
      ctx.save()
      ctx.translate(this.x + this.width/2, this.y + this.height/2)
      ctx.rotate(Math.PI) // 180度旋转
      ctx.translate(-this.width/2, -this.height/2)
      
      // 闪烁效果
      if (Math.floor(this.deathAnimationTimer * 10) % 2 === 0) {
        this.spriteRenderer.renderSprite(ctx, this.marioSprite, 0, 0, 2)
      }
      
      ctx.restore()
    } else {
      // 正常状态渲染
      if (this.facing === 'left') {
        ctx.save()
        ctx.scale(-1, 1)
        this.spriteRenderer.renderSprite(ctx, this.marioSprite, -this.x - this.width, this.y, 2)
        ctx.restore()
      } else {
        this.spriteRenderer.renderSprite(ctx, this.marioSprite, this.x, this.y, 2)
      }
    }
  }

  moveLeft() {
    this.vx = -this.maxSpeed
    this.facing = 'left'
  }

  moveRight() {
    this.vx = this.maxSpeed
    this.facing = 'right'
  }

  stop() {
    this.vx = 0
  }

  jump() {
    if (this.grounded) {
      this.vy = -this.jumpPower
      this.grounded = false
      this.jumping = true
    }
  }

  // A键动作（攻击/互动）
  actionA() {
    // 简单的攻击动作
    console.log('Player action A!')
  }

  // B键动作（跑步/特殊技能）
  actionB() {
    // 加速跑步
    this.maxSpeed = this.maxSpeed === 200 ? 300 : 200
  }

  // 死亡方法
  die() {
    this.isDead = true
    this.deathAnimationTimer = 0
    this.vx = 0 // 停止水平移动
  }

  // 重置玩家状态
  reset() {
    this.isDead = false
    this.deathAnimationTimer = 0
    this.vx = 0
    this.vy = 0
    this.grounded = false
    this.jumping = false
  }
}
