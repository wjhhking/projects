import { Wall } from './tank-types'

export class TankLevelGenerator {
  
  static generateWalls(): Wall[] {
    const walls: Wall[] = []
    const wallSize = 32
    const gameWidth = 800
    const gameHeight = 512
    
    // 边界墙 (钢墙)
    for (let x = 0; x < gameWidth; x += wallSize) {
      walls.push({ x, y: 0, width: wallSize, height: wallSize, type: 'steel', health: 999, maxHealth: 999 })
      walls.push({ x, y: gameHeight - wallSize, width: wallSize, height: wallSize, type: 'steel', health: 999, maxHealth: 999 })
    }
    for (let y = wallSize; y < gameHeight - wallSize; y += wallSize) {
      walls.push({ x: 0, y, width: wallSize, height: wallSize, type: 'steel', health: 999, maxHealth: 999 })
      walls.push({ x: gameWidth - wallSize, y, width: wallSize, height: wallSize, type: 'steel', health: 999, maxHealth: 999 })
    }
    
    // 经典坦克大战砖墙迷宫布局
    const brickPositions = [
      // 第一行砖墙 (y=64)
      { x: 64, y: 64 }, { x: 96, y: 64 }, { x: 128, y: 64 }, { x: 160, y: 64 },
      { x: 256, y: 64 }, { x: 288, y: 64 }, { x: 320, y: 64 }, { x: 352, y: 64 },
      { x: 448, y: 64 }, { x: 480, y: 64 }, { x: 512, y: 64 }, { x: 544, y: 64 },
      { x: 640, y: 64 }, { x: 672, y: 64 }, { x: 704, y: 64 },
      
      // 第二行砖墙 (y=96)
      { x: 64, y: 96 }, { x: 160, y: 96 }, { x: 256, y: 96 }, { x: 352, y: 96 },
      { x: 448, y: 96 }, { x: 544, y: 96 }, { x: 640, y: 96 }, { x: 704, y: 96 },
      
      // 第三行砖墙 (y=128)
      { x: 192, y: 128 }, { x: 224, y: 128 }, { x: 384, y: 128 }, { x: 416, y: 128 },
      { x: 576, y: 128 }, { x: 608, y: 128 },
      
      // 第四行砖墙 (y=160)
      { x: 96, y: 160 }, { x: 128, y: 160 }, { x: 192, y: 160 }, { x: 224, y: 160 },
      { x: 320, y: 160 }, { x: 352, y: 160 }, { x: 384, y: 160 }, { x: 416, y: 160 },
      { x: 448, y: 160 }, { x: 480, y: 160 }, { x: 576, y: 160 }, { x: 608, y: 160 },
      { x: 672, y: 160 }, { x: 704, y: 160 },
      
      // 第五行砖墙 (y=192)
      { x: 96, y: 192 }, { x: 128, y: 192 }, { x: 256, y: 192 }, { x: 288, y: 192 },
      { x: 512, y: 192 }, { x: 544, y: 192 }, { x: 672, y: 192 }, { x: 704, y: 192 },
      
      // 中心区域砖墙 (y=224)
      { x: 160, y: 224 }, { x: 192, y: 224 }, { x: 224, y: 224 }, { x: 256, y: 224 },
      { x: 320, y: 224 }, { x: 352, y: 224 }, { x: 416, y: 224 }, { x: 448, y: 224 },
      { x: 512, y: 224 }, { x: 544, y: 224 }, { x: 576, y: 224 }, { x: 608, y: 224 },
      
      // 中心区域砖墙 (y=256)
      { x: 160, y: 256 }, { x: 224, y: 256 }, { x: 320, y: 256 }, { x: 448, y: 256 },
      { x: 544, y: 256 }, { x: 608, y: 256 },
      
      // 下半部分砖墙 (y=288)
      { x: 64, y: 288 }, { x: 96, y: 288 }, { x: 160, y: 288 }, { x: 224, y: 288 },
      { x: 288, y: 288 }, { x: 320, y: 288 }, { x: 448, y: 288 }, { x: 480, y: 288 },
      { x: 544, y: 288 }, { x: 608, y: 288 }, { x: 672, y: 288 }, { x: 704, y: 288 },
      
      // 下半部分砖墙 (y=320)
      { x: 64, y: 320 }, { x: 96, y: 320 }, { x: 192, y: 320 }, { x: 224, y: 320 },
      { x: 288, y: 320 }, { x: 480, y: 320 }, { x: 544, y: 320 }, { x: 576, y: 320 },
      { x: 672, y: 320 }, { x: 704, y: 320 },
      
      // 底部砖墙 (y=352)
      { x: 128, y: 352 }, { x: 160, y: 352 }, { x: 192, y: 352 }, { x: 256, y: 352 },
      { x: 512, y: 352 }, { x: 576, y: 352 }, { x: 608, y: 352 }, { x: 640, y: 352 }
    ]
    
    brickPositions.forEach(pos => {
      walls.push({
        x: pos.x,
        y: pos.y,
        width: wallSize,
        height: wallSize,
        type: 'brick',
        health: 1,
        maxHealth: 1
      })
    })

    // 基地保护墙 - 围绕基地的砖墙
    const baseWallPositions = [
      { x: 352, y: 384 }, { x: 384, y: 384 }, { x: 416, y: 384 },
      { x: 352, y: 416 }, { x: 416, y: 416 },
      { x: 352, y: 448 }, { x: 384, y: 448 }, { x: 416, y: 448 }
    ]
    
    baseWallPositions.forEach(pos => {
      walls.push({
        x: pos.x,
        y: pos.y,
        width: wallSize,
        height: wallSize,
        type: 'brick',
        health: 1,
        maxHealth: 1
      })
    })

    return walls
  }

  static checkWallCollision(rect: { x: number, y: number, width: number, height: number }, walls: Wall[]): boolean {
    return walls.some(wall => 
      wall.health > 0 &&
      rect.x < wall.x + wall.width &&
      rect.x + rect.width > wall.x &&
      rect.y < wall.y + wall.height &&
      rect.y + rect.height > wall.y
    )
  }
}
