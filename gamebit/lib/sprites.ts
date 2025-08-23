// 8-bit 精灵系统
export class SpriteRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
  }

  // 创建像素化的精灵
  createPixelSprite(pattern: number[][], colors: string[]): ImageData {
    const width = pattern[0].length
    const height = pattern.length
    
    this.canvas.width = width
    this.canvas.height = height
    
    const imageData = this.ctx.createImageData(width, height)
    const data = imageData.data

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIndex = pattern[y][x]
        const color = colors[colorIndex] || '#00000000'
        
        const pixelIndex = (y * width + x) * 4
        
        if (color === 'transparent' || colorIndex === 0) {
          data[pixelIndex] = 0     // R
          data[pixelIndex + 1] = 0 // G
          data[pixelIndex + 2] = 0 // B
          data[pixelIndex + 3] = 0 // A (透明)
        } else {
          const rgb = this.hexToRgb(color)
          data[pixelIndex] = rgb.r     // R
          data[pixelIndex + 1] = rgb.g // G
          data[pixelIndex + 2] = rgb.b // B
          data[pixelIndex + 3] = 255   // A (不透明)
        }
      }
    }

    return imageData
  }

  private hexToRgb(hex: string): {r: number, g: number, b: number} {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0}
  }

  // 渲染精灵到画布
  renderSprite(ctx: CanvasRenderingContext2D, imageData: ImageData, x: number, y: number, scale: number = 2) {
    // 创建临时画布
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    
    tempCanvas.width = imageData.width
    tempCanvas.height = imageData.height
    tempCtx.putImageData(imageData, 0, 0)
    
    // 放大渲染
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      tempCanvas, 
      x, y, 
      imageData.width * scale, 
      imageData.height * scale
    )
  }
}

// Mario 精灵数据
export const MARIO_SPRITES = {
  // Mario 站立姿态 (16x16)
  standing: [
    [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,2,2,2,3,3,2,3,0,0,0,0,0,0,0],
    [0,2,3,2,3,3,3,2,3,3,3,0,0,0,0,0],
    [0,2,3,2,2,3,3,3,2,3,3,3,0,0,0,0],
    [0,2,2,3,3,3,3,2,2,2,2,0,0,0,0,0],
    [0,0,0,3,3,3,3,3,3,0,0,0,0,0,0,0],
    [0,0,2,2,4,2,2,2,0,0,0,0,0,0,0,0],
    [0,2,2,2,4,2,4,4,4,2,2,2,0,0,0,0],
    [2,2,2,2,4,4,4,4,4,2,2,2,2,0,0,0],
    [3,3,2,4,3,4,4,4,3,4,2,3,3,0,0,0],
    [3,3,3,4,4,4,4,4,4,4,3,3,3,0,0,0],
    [3,3,4,4,4,4,4,4,4,4,4,3,3,0,0,0],
    [0,0,4,4,4,0,0,4,4,4,0,0,0,0,0,0],
    [0,2,2,2,0,0,0,0,2,2,2,0,0,0,0,0],
    [2,2,2,2,0,0,0,0,2,2,2,2,0,0,0,0]
  ],
  
  colors: [
    'transparent', // 0 - 透明
    '#ff0000',     // 1 - 红色 (帽子)
    '#ffdbac',     // 2 - 肤色
    '#0066ff',     // 3 - 蓝色 (衣服)
    '#8b4513'      // 4 - 棕色 (鞋子/胡子)
  ]
}

// Goomba 精灵数据
export const GOOMBA_SPRITES = {
  // Goomba (16x16)
  walking: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,1,2,2,1,1,1,1,1,1,2,2,1,0,0,0],
    [1,1,2,3,2,1,1,1,1,2,3,2,1,1,0,0],
    [1,1,2,2,1,1,3,3,1,1,2,2,1,1,0,0],
    [1,1,1,1,1,3,3,3,3,1,1,1,1,1,0,0],
    [1,1,1,1,3,4,3,3,4,3,1,1,1,1,0,0],
    [1,1,1,1,3,3,3,3,3,3,1,1,1,1,0,0],
    [0,1,1,1,3,3,4,4,3,3,1,1,1,0,0,0],
    [0,0,1,1,3,4,4,4,4,3,1,1,0,0,0,0],
    [0,0,0,1,4,4,4,4,4,4,1,0,0,0,0,0],
    [0,0,1,4,4,4,4,4,4,4,4,1,0,0,0,0],
    [0,1,4,4,4,0,0,0,0,4,4,4,1,0,0,0],
    [1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0]
  ],
  
  colors: [
    'transparent', // 0 - 透明
    '#8b4513',     // 1 - 棕色 (身体)
    '#ffffff',     // 2 - 白色 (眼睛)
    '#654321',     // 3 - 深棕色 (头部)
    '#000000'      // 4 - 黑色 (眼珠/脚)
  ]
}

// 金币精灵数据
export const COIN_SPRITES = {
  // 金币 (8x8)
  spinning: [
    [0,1,1,1,1,1,1,0],
    [1,2,2,2,2,2,2,1],
    [1,2,3,2,2,3,2,1],
    [1,2,2,3,3,2,2,1],
    [1,2,2,3,3,2,2,1],
    [1,2,3,2,2,3,2,1],
    [1,2,2,2,2,2,2,1],
    [0,1,1,1,1,1,1,0]
  ],
  
  colors: [
    'transparent', // 0 - 透明
    '#b8860b',     // 1 - 深金色 (边框)
    '#ffd700',     // 2 - 金色 (主体)
    '#ffff99'      // 3 - 浅金色 (高光)
  ]
}

// 旗子精灵数据
export const FLAG_SPRITES = {
  // 旗子 (16x32)
  flag: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ],
  
  colors: [
    'transparent', // 0 - 透明
    '#8b4513',     // 1 - 棕色 (旗杆)
    '#ff0000',     // 2 - 红色 (旗子)
    '#ffffff',     // 3 - 白色 (旗子条纹)
    '#00ff00'      // 4 - 绿色 (旗子底色)
  ]
}

// 简化的旗子渲染函数
export function renderFlag(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // 旗杆
  ctx.fillStyle = '#8b4513'
  ctx.fillRect(x, y, 4, 64)
  
  // 旗子
  ctx.fillStyle = '#00ff00'
  ctx.fillRect(x + 4, y, 24, 16)
  
  // 旗子条纹
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(x + 4, y + 2, 24, 2)
  ctx.fillRect(x + 4, y + 6, 24, 2)
  ctx.fillRect(x + 4, y + 10, 24, 2)
  ctx.fillRect(x + 4, y + 14, 24, 2)
  
  // 旗子顶部装饰
  ctx.fillStyle = '#ffff00'
  ctx.fillRect(x, y - 4, 4, 4)
}
