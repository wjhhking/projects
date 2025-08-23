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

// 重新导出所有精灵
export * from './mario-sprites'
export * from './contra-sprites'
export * from './raiden-sprites'
export * from './battle-city-sprites'
export * from './floors-sprites'
export * from './common-sprites'
