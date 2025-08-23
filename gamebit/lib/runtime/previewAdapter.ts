import type { CompositionPlan } from '@/lib/composition'

export interface PreviewOptions {
  maxWidth?: number
  maxHeight?: number
}

export class CompositionPreviewAdapter {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private rafId: number | null = null
  private startTime = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not available')
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  render(plan: CompositionPlan, opts: PreviewOptions = {}) {
    const has = (id: string) => plan.templates.some(t => t.id === id)
    const gridSel = plan.templates.find(t => t.id === 'mt.grid.world')

    const tileSize = (gridSel?.params?.tileSize as number) || 16
    const cols = (gridSel?.params?.width as number) || 20
    const rows = (gridSel?.params?.height as number) || 15

    const desiredWidth = tileSize * cols
    const desiredHeight = tileSize * rows

    const maxWidth = opts.maxWidth ?? 800
    const maxHeight = opts.maxHeight ?? 480

    const scale = Math.min(maxWidth / desiredWidth, maxHeight / desiredHeight, 1)

    this.canvas.width = Math.floor(desiredWidth * scale)
    this.canvas.height = Math.floor(desiredHeight * scale)

    const ctx = this.ctx
    const ts = tileSize * scale

    const draw = (t: number) => {
      // background
      ctx.fillStyle = '#0b1020'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

      // grid
      if (gridSel) {
        this.drawGrid(cols, rows, ts)
      }

      // snake preview
      if (has('mt.actor.snakeBody')) {
        this.drawSnakePreview(cols, rows, ts, t)
      }

      // hud preview
      if (has('mt.ui.hudBasic')) {
        ctx.fillStyle = '#ffffff'
        ctx.font = `${Math.max(10, Math.floor(12 * scale))}px monospace`
        ctx.fillText('Score: 0', 8, 16)
      }

      // label
      ctx.fillStyle = '#9ca3af'
      ctx.font = `${Math.max(9, Math.floor(10 * scale))}px monospace`
      ctx.fillText(`${plan.title} preview`, 8, this.canvas.height - 8)

      this.rafId = requestAnimationFrame((now) => draw((now - this.startTime) / 1000))
    }

    if (!this.startTime) this.startTime = performance.now()
    draw(0)
  }

  private drawGrid(cols: number, rows: number, ts: number) {
    const ctx = this.ctx
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    for (let c = 0; c <= cols; c++) {
      const x = Math.floor(c * ts) + 0.5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, Math.floor(rows * ts))
      ctx.stroke()
    }
    for (let r = 0; r <= rows; r++) {
      const y = Math.floor(r * ts) + 0.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(Math.floor(cols * ts), y)
      ctx.stroke()
    }
  }

  private drawSnakePreview(cols: number, rows: number, ts: number, t: number) {
    const ctx = this.ctx
    const length = 6
    const path: Array<{ x: number; y: number }> = []

    const cx = Math.floor(cols / 2)
    const cy = Math.floor(rows / 2)

    const phase = Math.floor((t * 2) % cols)

    for (let i = 0; i < length; i++) {
      path.push({ x: (cx + phase - i + cols) % cols, y: cy })
    }

    // body
    ctx.fillStyle = '#10b981'
    for (const seg of path) {
      ctx.fillRect(Math.floor(seg.x * ts), Math.floor(seg.y * ts), Math.ceil(ts), Math.ceil(ts))
    }

    // head highlight
    ctx.fillStyle = '#34d399'
    ctx.fillRect(Math.floor(path[0].x * ts), Math.floor(path[0].y * ts), Math.ceil(ts), Math.ceil(ts))
  }
}
