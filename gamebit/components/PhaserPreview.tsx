'use client'

import { useEffect, useRef } from 'react'
import type { CompositionPlan } from '@/lib/composition'
import { buildRuntimeOps } from '@/lib/composition/builder'
import type { RuntimeOps } from '@/lib/composition/runtimeOps'

// Lazy import phaser only on client
let PhaserLib: typeof import('phaser') | null = null

const NORMALIZE: Record<string, string> = {
  'tetrominoes': 'tetrisCore',
  'rules.lineClear': 'lineClear',
  'controls.orthogonalStep': 'gridStep',
  'controls.inputAxis': 'inputAxis',
  'controller.orthogonalStep': 'gridStep',
  'controller.inputAxis': 'inputAxis',
  'controller.rotate': 'tetrisCore',
  'spawn.tetromino': 'tetrisCore',
  'hud.basic': 'hudBasic',
  'ui.hudBasic': 'hudBasic',
  'tick': 'gridStep',
  'stepper': 'gridStep'
}

function normalizeOps(ops: RuntimeOps): RuntimeOps {
  const normalized = { ...ops, systems: ops.systems.map(s => ({ ...s })) }
  normalized.systems.forEach(s => {
    const mapped = NORMALIZE[s.type]
    if (mapped) s.type = mapped
  })
  return normalized
}

export default function PhaserPreview({ plan, width = 800, height = 480 }: { plan: CompositionPlan; width?: number; height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<import('phaser').Game | null>(null)

  useEffect(() => {
    let mounted = true

    async function boot() {
      if (!mounted || !containerRef.current) return

      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
      containerRef.current.innerHTML = ''
      containerRef.current.setAttribute('tabindex', '0')
      containerRef.current.style.outline = 'none'
      
      // Add focus/blur debugging
      containerRef.current.addEventListener('focus', () => console.debug('[preview] container focused'))
      containerRef.current.addEventListener('blur', () => console.debug('[preview] container blurred'))
      
      // Add keydown debugging on container
      containerRef.current.addEventListener('keydown', (e) => {
        console.debug('[preview] container keydown:', e.key, e.code)
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.code)) {
          e.preventDefault()
        }
      })
      
      containerRef.current.focus()
      console.debug('[preview] focus() called on container')

      if (!PhaserLib) {
        PhaserLib = (await import('phaser')).default as unknown as typeof import('phaser')
      }
      if (!mounted || !containerRef.current) return

      const Phaser = PhaserLib!

      // Prefer LLM-provided runtimeOps if present
      let ops: RuntimeOps | null = null
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('runtimeOps')
        if (saved) ops = JSON.parse(saved)
      }
      if (!ops) ops = buildRuntimeOps(plan)
      ops = normalizeOps(ops)

      try { console.debug('[preview] runtimeOps systems:', ops.systems.map(s => s.type)) } catch {}

      const config: import('phaser').Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width,
        height,
        parent: containerRef.current,
        backgroundColor: '#0b1020',
        input: { keyboard: true },
        scene: {
          create(this: import('phaser').Scene) {
            const scene = this as import('phaser').Scene
            
            // Try direct key listening instead of cursors
            let keys = {
              left: false,
              right: false,
              up: false
            }
            
            // Listen to window keydown/keyup events
            const handleKeyDown = (e: KeyboardEvent) => {
              console.log('🔥 KEY DOWN:', e.key, e.code, 'keys before:', {...keys})
              if (e.code === 'ArrowLeft') { keys.left = true; e.preventDefault() }
              if (e.code === 'ArrowRight') { keys.right = true; e.preventDefault() }
              if (e.code === 'ArrowUp') { keys.up = true; e.preventDefault() }
              console.log('🔥 keys after:', {...keys})
            }
            
            const handleKeyUp = (e: KeyboardEvent) => {
              console.log('🔥 KEY UP:', e.key, e.code)
              if (e.code === 'ArrowLeft') keys.left = false
              if (e.code === 'ArrowRight') keys.right = false
              if (e.code === 'ArrowUp') keys.up = false
            }
            
            window.addEventListener('keydown', handleKeyDown)
            window.addEventListener('keyup', handleKeyUp)
            
            // Store cleanup function
            scene.data.set('keyCleanup', () => {
              window.removeEventListener('keydown', handleKeyDown)
              window.removeEventListener('keyup', handleKeyUp)
            })
            
            if (scene.input.keyboard) {
              scene.input.keyboard.enabled = true
              scene.input.keyboard.addCapture([
                Phaser.Input.Keyboard.KeyCodes.LEFT,
                Phaser.Input.Keyboard.KeyCodes.RIGHT,
                Phaser.Input.Keyboard.KeyCodes.UP
              ])
            }

            const { tileSize, width: cols, height: rows, wrapEdges } = ops!.world
            const worldW = cols * tileSize
            const worldH = rows * tileSize
            const scale = Math.min(width / worldW, height / worldH)

            const g = scene.add.graphics()
            g.lineStyle(1, 0xffffff, 0.1)
            for (let c = 0; c <= cols; c++) {
              const x = Math.floor(c * tileSize * scale) + 0.5
              g.lineBetween(x, 0, x, Math.floor(rows * tileSize * scale))
            }
            for (let r = 0; r <= rows; r++) {
              const y = Math.floor(r * tileSize * scale) + 0.5
              g.lineBetween(0, y, Math.floor(cols * tileSize * scale), y)
            }

            const systems = ops!.systems
            const getSystems = (t: string) => systems.filter(s => s.type === t)
            const hasSystem = (t: string) => systems.some(s => s.type === t)

            const cursors = scene.input.keyboard?.createCursorKeys()!
            console.debug('[preview] cursors created:', !!cursors)

            const hasTetris = hasSystem('tetrisCore')
            const hasLineClear = hasSystem('lineClear')
            const hasSpawnTetromino = systems.some(s => s.type.includes('tetromino') || s.type.includes('spawn'))
            
            console.log('🎮 GAME DETECTION:', { 
              hasTetris, 
              hasLineClear, 
              hasSpawnTetromino,
              systemTypes: systems.map(s => s.type)
            })

            // Detect Tetris by multiple indicators
            const isTetris = hasTetris || hasLineClear || hasSpawnTetromino || 
                           systems.some(s => s.type.includes('tetromino') || s.type.includes('lineClear'))

            if (!isTetris && (hasSystem('gridStep') || hasSystem('spawnFood') || hasSystem('collectOnOverlap'))) {
              console.debug('[preview] running Snake-like game')
              runSnakeLike(scene, ops!, scale, wrapEdges)
            }

            if (isTetris) {
              console.log('🎮 RUNNING TETRIS GAME')
              runTetris(scene, ops!, scale, { keys, hasSystem, getSystems })
            } else {
              console.log('🎮 TETRIS NOT DETECTED')
            }
            
            if (!isTetris && !hasSystem('gridStep') && !hasSystem('spawnFood')) {
              console.debug('[preview] no specific game detected, showing generic preview')
            }

            const info = [`World ${cols}x${rows} t=${tileSize}`, `Systems: ${systems.map(s => s.type).join(', ')}`, 'Controls: ← → move, ↑ rotate']
            scene.add.text(12, 12, info.join('\n'), { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' })
          }
        }
      }

      gameRef.current = new Phaser.Game(config)
    }

    boot()

    return () => {
      mounted = false
      if (gameRef.current) {
        // Clean up key listeners
        const scene = gameRef.current.scene.getScene('default')
        if (scene && scene.data.get('keyCleanup')) {
          scene.data.get('keyCleanup')()
        }
        gameRef.current.destroy(true)
        gameRef.current = null
      }
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [plan, width, height])

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        border: '4px solid #333', 
        background: '#0b1020',
        cursor: 'pointer'
      }}
      onClick={() => {
        console.debug('[preview] container clicked, focusing...')
        containerRef.current?.focus()
      }}
      title="Click to focus, then use arrow keys"
    />
  )
}

function runSnakeLike(scene: import('phaser').Scene, ops: RuntimeOps, scale: number, wrapEdges: boolean | undefined) {
  const { tileSize, width: cols, height: rows } = ops.world
  const Phaser = PhaserLib!
  const cursors = scene.input.keyboard?.createCursorKeys()!

  let axis = { x: 0, y: 0 }
  scene.events.on('update', () => {
    const left = cursors?.left.isDown
    const right = cursors?.right.isDown
    const up = cursors?.up.isDown
    const down = cursors?.down.isDown
    axis.x = (left ? -1 : 0) + (right ? 1 : 0)
    axis.y = (up ? -1 : 0) + (down ? 1 : 0)
    if (Math.abs(axis.x) > Math.abs(axis.y)) axis.y = 0
    else if (Math.abs(axis.y) > Math.abs(axis.x)) axis.x = 0
  })

  const player = scene.add.rectangle(Math.floor(Math.floor(cols / 2) * tileSize * scale), Math.floor(Math.floor(rows / 2) * tileSize * scale), Math.ceil(tileSize * scale), Math.ceil(tileSize * scale), 0x34d399)
  player.setOrigin(0, 0)

  const tailRects: import('phaser').GameObjects.Rectangle[] = []
  let tailPositions: Array<{ x: number; y: number }> = []

  const stepMs = 120
  scene.time.addEvent({ delay: stepMs, loop: true, callback: () => {
    let px = Math.round(player.x / (tileSize * scale))
    let py = Math.round(player.y / (tileSize * scale))
    let nx = px + axis.x
    let ny = py + axis.y

    if (wrapEdges) {
      nx = (nx + cols) % cols
      ny = (ny + rows) % rows
    } else if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
      tailPositions = []
      tailRects.forEach(r => r.destroy())
      tailRects.length = 0
      nx = Math.floor(cols / 2)
      ny = Math.floor(rows / 2)
    }

    if (tailPositions.length > 0) {
      for (let i = tailPositions.length - 1; i > 0; i--) tailPositions[i] = { ...tailPositions[i - 1] }
      tailPositions[0] = { x: px, y: py }
    }

    player.x = Math.floor(nx * tileSize * scale)
    player.y = Math.floor(ny * tileSize * scale)

    while (tailRects.length < tailPositions.length) {
      const seg = scene.add.rectangle(0, 0, Math.ceil(tileSize * scale), Math.ceil(tileSize * scale), 0x10b981)
      seg.setOrigin(0, 0)
      tailRects.push(seg)
    }
    tailRects.forEach((r, i) => {
      const tp = tailPositions[i]
      r.x = Math.floor(tp.x * tileSize * scale)
      r.y = Math.floor(tp.y * tileSize * scale)
    })
  }})
}

function runTetris(scene: import('phaser').Scene, ops: RuntimeOps, scale: number, ctx: { keys: any; hasSystem: (t: string) => boolean; getSystems: (t: string) => any[] }) {
  console.log('🎯 TETRIS SETUP STARTING')
  const { tileSize, width: cols, height: rows } = ops.world
  const cellW = Math.ceil(tileSize * scale)
  const cellH = Math.ceil(tileSize * scale)
  console.debug('[tetris] grid setup:', { cols, rows, cellW, cellH, scale })

  const grid: (number | null)[][] = Array.from({ length: rows }, () => Array<number | null>(cols).fill(null))
  const cells: import('phaser').GameObjects.Rectangle[][] = Array.from({ length: rows }, () => Array<import('phaser').GameObjects.Rectangle>(cols) as any)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const r = scene.add.rectangle(x * cellW, y * cellH, cellW, cellH, 0x000000, 0)
      r.setOrigin(0, 0)
      cells[y][x] = r
    }
  }
  function redrawCell(x: number, y: number) {
    const color = grid[y][x]
    const r = cells[y][x]
    r.setFillStyle(color ?? 0x000000, color ? 1 : 0)
  }
  function redrawAll() { for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) redrawCell(x, y) }

  const SHAPES: Array<{ color: number; rots: Array<Array<{ x: number; y: number }>> }> = [
    { color: 0x3b82f6, rots: [ [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0}], [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:0,y:2}], [{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:2,y:1}], [{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:1,y:2}] ] },
    { color: 0xf59e0b, rots: [ [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}] ] },
    { color: 0x8b5cf6, rots: [ [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:0,y:1}], [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:1,y:0}], [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:0,y:-1}], [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:-1,y:0}] ] },
    { color: 0x10b981, rots: [ [{x:0,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1}], [{x:0,y:-1},{x:0,y:0},{x:1,y:0},{x:1,y:1}], [{x:0,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1}], [{x:0,y:-1},{x:0,y:0},{x:1,y:0},{x:1,y:1}] ] },
    { color: 0xef4444, rots: [ [{x:-1,y:0},{x:0,y:0},{x:0,y:1},{x:1,y:1}], [{x:1,y:-1},{x:0,y:0},{x:1,y:0},{x:0,y:1}], [{x:-1,y:0},{x:0,y:0},{x:0,y:-1},{x:1,y:-1}], [{x:0,y:-1},{x:-1,y:0},{x:0,y:0},{x:-1,y:1}] ] },
    { color: 0x2563eb, rots: [ [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:-1,y:1}], [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:1,y:-1}], [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:1,y:-1}], [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:-1,y:1}] ] },
    { color: 0xf97316, rots: [ [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:1,y:1}], [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:-1,y:-1}], [{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:-1,y:-1}], [{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:1,y:1}] ] }
  ]

  let current = spawnPiece()
  const gravityTicksParam = ops.systems.find(s => s.type === 'tetrisCore')?.params?.gravityTicks as number | undefined
  const gravityTicks = typeof gravityTicksParam === 'number' ? gravityTicksParam : 48
  let dropMs = Math.max(80, Math.floor(gravityTicks * (1000 / 60)))
  let moveCooldown = 0
  
  console.debug('[tetris] initial piece spawned:', current)
  console.debug('[tetris] drop timing:', { gravityTicks, dropMs })

  function spawnPiece() {
    const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    const rot = 0
    const x = Math.floor(cols / 2)
    const y = 0
    return { s, rot, x, y }
  }

  function validAt(x: number, y: number, rot: number) {
    const cellsDef = current.s.rots[rot % 4]
    for (const c of cellsDef) {
      const gx = x + c.x
      const gy = y + c.y
      if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) return false
      if (grid[gy][gx] !== null) return false
    }
    return true
  }

  function setPiece(on: boolean) {
    const cellsDef = current.s.rots[current.rot % 4]
    for (const c of cellsDef) {
      const gx = current.x + c.x
      const gy = current.y + c.y
      if (gy >= 0 && gy < rows && gx >= 0 && gx < cols) {
        grid[gy][gx] = on ? current.s.color : null
        redrawCell(gx, gy)
      }
    }
  }

  function lockPiece() {
    clearLines()
    current = spawnPiece()
    if (!validAt(current.x, current.y, current.rot)) {
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { grid[y][x] = null; redrawCell(x, y) }
    }
  }

  function clearLines() {
    for (let y = rows - 1; y >= 0; y--) {
      if (grid[y].every(v => v !== null)) {
        for (let yy = y; yy > 0; yy--) {
          for (let x = 0; x < cols; x++) grid[yy][x] = grid[yy - 1][x]
        }
        for (let x = 0; x < cols; x++) grid[0][x] = null
        redrawAll()
        y++
      }
    }
  }

  scene.time.addEvent({ delay: 16, loop: true, callback: () => { moveCooldown = Math.max(0, moveCooldown - 16) } })

  // Arrow-only controls: ← → move, ↑ rotate
  scene.time.addEvent({ delay: 50, loop: true, callback: () => {
    const left = ctx.keys.left
    const right = ctx.keys.right
    const rotate = ctx.keys.up
    
    // Debug key states
    if (left || right || rotate) {
      console.log('🎮 TETRIS KEYS:', { left, right, rotate, cooldown: moveCooldown })
    }

    if (moveCooldown === 0) {
      if (left && validAt(current.x - 1, current.y, current.rot)) { 
        console.debug('[tetris] moving left')
        setPiece(false); current.x -= 1; setPiece(true); moveCooldown = 120 
      }
      else if (right && validAt(current.x + 1, current.y, current.rot)) { 
        console.debug('[tetris] moving right')
        setPiece(false); current.x += 1; setPiece(true); moveCooldown = 120 
      }
      else if (rotate && validAt(current.x, current.y, current.rot + 1)) { 
        console.debug('[tetris] rotating')
        setPiece(false); current.rot = (current.rot + 1) % 4; setPiece(true); moveCooldown = 150 
      }
    }
  } })

  scene.time.addEvent({ delay: 16, loop: true, callback: () => {
    const step = dropMs
    if (!scene.data.get('tetrisDropTimer')) scene.data.set('tetrisDropTimer', step)
    const t = (scene.data.get('tetrisDropTimer') as number) - 16
    if (t > 0) { scene.data.set('tetrisDropTimer', t); return }
    scene.data.set('tetrisDropTimer', step)

    setPiece(false)
    if (validAt(current.x, current.y + 1, current.rot)) {
      current.y += 1
      setPiece(true)
    } else {
      setPiece(true)
      lockPiece()
    }
  } })

  setPiece(true)
  console.debug('[tetris] Tetris game fully initialized, piece placed')
}
