'use client'

import { useEffect, useRef, useState } from 'react'
import type { RuntimeOps } from '@/lib/composition/runtimeOps'

// Component that uses the generated component code directly
export default function GeneratedGamePreview({ runtimeOps, width = 800, height = 480 }: { runtimeOps: RuntimeOps, width?: number, height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let PhaserLib: typeof import('phaser')

    const init = async () => {
      try {
        PhaserLib = await import('phaser')
        if (!mounted || !containerRef.current) return

        // Cast to any to work with flexible system structure
        const systems = runtimeOps.systems as any[]
        const entities = (runtimeOps.entities || []) as any[]

        // Extract world configuration
        const worldTilesW = runtimeOps.world.width
        const worldTilesH = runtimeOps.world.height
        const tileSize = runtimeOps.world.tileSize || 16
        const worldPxW = worldTilesW * tileSize
        const worldPxH = worldTilesH * tileSize

        console.log('🎮 Generated Game Preview - Initializing:', {
          world: `${worldTilesW}×${worldTilesH}`,
          tileSize,
          systems: systems.length,
          entities: entities.length
        })

        // Helper function to get component of type from entity
        const getComponent = (entity: any, type: string) => {
          return entity.components.find((c: any) => c.type === type)
        }

        // Parse entities with better component handling
        const gameEntities = entities.map((entityDef: any) => {
          const transform = getComponent(entityDef, 'Transform')
          const sprite = getComponent(entityDef, 'Sprite')
          const collider = getComponent(entityDef, 'Collider')
          const rigidBody = getComponent(entityDef, 'RigidBody')
          const playerController = getComponent(entityDef, 'PlayerController')

          const entity: any = {
            id: entityDef.id,
            name: entityDef.name,
            
            // Position (in pixels)
            x: (transform?.x || 0) * tileSize,
            y: (transform?.y || 0) * tileSize,
            
            // Size (in pixels)  
            w: (collider?.w || 1) * tileSize,
            h: (collider?.h || 1) * tileSize,
            
            // Velocity
            vx: rigidBody?.vx || 0,
            vy: rigidBody?.vy || 0,
            
            // Visual
            glyph: sprite?.glyph || '?',
            color: sprite?.color || '#ffffff',
            
            // Collision
            solid: collider?.solid || false,
            tag: collider?.tag || '',
            
            // Behavior
            isPlayer: !!playerController,
            speed: playerController?.speed || 2,
            
            // State
            active: true,
            textObject: null // Will hold Phaser text object
          }

          return entity
        })

        console.log('✅ Parsed entities successfully:', gameEntities.length)

        class GameScene extends PhaserLib.Scene {
          graphics!: import('phaser').GameObjects.Graphics
          entities: any[] = []
          keys: any = {}
          titleText!: import('phaser').GameObjects.Text

          constructor() {
            super('GeneratedGameScene')
          }

          create() {
            console.log('🎨 Creating generated game scene...')

            // Setup graphics
            this.graphics = this.add.graphics()

            // Setup camera
            const cam = this.cameras.main
            cam.setBackgroundColor('#222034')
            cam.setBounds(0, 0, worldPxW, worldPxH)

            // Setup input keys
            const keyboardPlugin = this.input.keyboard
            if (keyboardPlugin) {
              this.keys = {
                up: keyboardPlugin.addKey('UP'),
                down: keyboardPlugin.addKey('DOWN'), 
                left: keyboardPlugin.addKey('LEFT'),
                right: keyboardPlugin.addKey('RIGHT'),
                space: keyboardPlugin.addKey('SPACE')
              }
            }

            // Copy entities for game state
            this.entities = gameEntities.map(e => ({...e}))

            // Create text objects for glyphs (once, not every frame)
            this.entities.forEach(entity => {
              if (entity.glyph) {
                const color = entity.color.startsWith('#') ? entity.color : '#ffffff'
                entity.textObject = this.add.text(
                  entity.x + entity.w/2, 
                  entity.y + entity.h/2, 
                  entity.glyph, 
                  {
                    fontFamily: 'monospace',
                    fontSize: `${Math.min(entity.w, entity.h) * 0.8}px`,
                    color: '#000000'
                  }
                ).setOrigin(0.5)
              }
            })

            // Add title text (once)
            this.titleText = this.add.text(10, 10, runtimeOps.metadata?.title || 'Generated Game', {
              fontFamily: 'monospace',
              fontSize: '16px',
              color: '#ffffff'
            }).setScrollFactor(0)

            // Initial render
            this.renderEntities()

            console.log('✅ Generated game scene created successfully')
          }

          update() {
            // Find player entity
            const player = this.entities.find(e => e.isPlayer && e.active)
            if (!player || !this.keys) return

            const speed = player.speed || 2
            let moved = false

            // Handle input
            if (this.keys.left?.isDown) {
              player.x = Math.max(0, player.x - speed)
              moved = true
            }
            if (this.keys.right?.isDown) {
              player.x = Math.min(worldPxW - player.w, player.x + speed)
              moved = true
            }
            if (this.keys.up?.isDown) {
              player.y = Math.max(0, player.y - speed)
              moved = true
            }
            if (this.keys.down?.isDown) {
              player.y = Math.min(worldPxH - player.h, player.y + speed)
              moved = true
            }

            if (moved) {
              // Update player text position
              if (player.textObject) {
                player.textObject.setPosition(player.x + player.w/2, player.y + player.h/2)
              }
              
              // Check collisions with collectibles
              this.checkCollisions(player)
              
              // Re-render background (not text objects)
              this.renderBackground()
            }
          }

          checkCollisions(player: any) {
            this.entities.forEach(entity => {
              if (entity === player || !entity.active) return
              
              // Simple AABB collision
              const collision = !(
                player.x + player.w <= entity.x ||
                entity.x + entity.w <= player.x ||
                player.y + player.h <= entity.y ||
                entity.y + entity.h <= player.y
              )
              
              if (collision && entity.tag === 'collectible') {
                entity.active = false
                if (entity.textObject) {
                  entity.textObject.setVisible(false)
                }
                console.log('🌟 Collected:', entity.id)
              }
            })
          }

          renderBackground() {
            const g = this.graphics
            g.clear()

            // Draw grid
            g.lineStyle(1, 0x333333, 0.3)
            for (let x = 0; x <= worldPxW; x += tileSize) {
              g.lineBetween(x, 0, x, worldPxH)
            }
            for (let y = 0; y <= worldPxH; y += tileSize) {
              g.lineBetween(0, y, worldPxW, y)
            }

            // Draw entity backgrounds
            this.entities.forEach(entity => {
              if (!entity.active) return

              let bgColor = 0x333333
              
              // Determine background color
              if (entity.isPlayer) {
                bgColor = 0x003366 // Dark blue for player
              } else if (entity.tag === 'collectible') {
                bgColor = 0x664400 // Dark yellow for collectibles
              } else if (entity.tag === 'enemy') {
                bgColor = 0x660000 // Dark red for enemies
              } else if (entity.solid) {
                bgColor = 0x444444 // Gray for walls
              }

              g.fillStyle(bgColor, 1)
              g.fillRect(entity.x, entity.y, entity.w, entity.h)
            })
          }

          renderEntities() {
            this.renderBackground()
            
            // Text objects are already positioned and visible
            // Just make sure they match entity active state
            this.entities.forEach(entity => {
              if (entity.textObject) {
                entity.textObject.setVisible(entity.active)
              }
            })
          }
        }

        const config: import('phaser').Types.Core.GameConfig = {
          type: PhaserLib.AUTO,
          parent: containerRef.current,
          width,
          height,
          backgroundColor: '#222034',
          pixelArt: true,
          banner: false,
          scale: {
            mode: PhaserLib.Scale.FIT,
            autoCenter: PhaserLib.Scale.CENTER_BOTH,
          },
          scene: [GameScene],
        }

        // Cleanup existing game
        if (gameRef.current) {
          try {
            gameRef.current.destroy(true)
          } catch (error) {
            console.log('Previous game cleanup error:', error)
          }
          gameRef.current = null
        }

        console.log('🚀 Creating generated Phaser game...')
        gameRef.current = new PhaserLib.Game(config)
        console.log('✅ Generated game created successfully!')

      } catch (error) {
        console.error('❌ Failed to create generated game:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    init()

    return () => {
      mounted = false
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true)
        } catch {}
        gameRef.current = null
      }
    }
  }, [runtimeOps, width, height])

  if (error) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#222034',
        color: '#ff6b6b',
        fontFamily: 'monospace',
        fontSize: '14px',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <div>
          <div>❌ Error loading game:</div>
          <div style={{ marginTop: '8px', fontSize: '12px' }}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        background: 'rgba(0,0,0,0.7)',
        color: '#ffffff',
        padding: '8px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        🎮 Generated Game • Use arrow keys to move • Collect items (*)
      </div>
    </div>
  )
}
