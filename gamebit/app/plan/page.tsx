'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { RuntimeOps } from '@/lib/composition/runtimeOps'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

// Dynamically import PhaserPreview components
const PhaserPreview = dynamic(() => import('@/components/PhaserPreview'), { ssr: false })
const GeneratedGamePreview = dynamic(() => import('@/components/GeneratedGamePreview'), { ssr: false })

// Function to check if generated component exists
async function checkGeneratedComponent() {
  try {
    const response = await fetch('/api/get-generated-component')
    if (!response.ok) {
      return false
    }
    const { componentCode } = await response.json()
    return !!componentCode
  } catch (error) {
    console.log('[plan] Generated component not available')
    return false
  }
}

type GenerationStage = 'generating' | 'complete' | 'error'

interface GameData {
  id: string
  name: string
  description: string
  engine: string
  gameType: string
  createdAt: string
  thumbnail: string
  controls: string
}

// Mock composition plan for Phaser games
const createPhaserPlan = (description: string) => ({
  planVersion: '1.0',
  title: description.length > 50 ? `${description.substring(0, 50)}...` : description,
  description: description,
  targetRuntime: 'phaser',
  templates: [
    { id: 'phaser.world.sidescroller', params: { scrollSpeed: 120, width: 3000, height: 600 } },
    { id: 'phaser.player.character', params: { speed: 180, health: 3, weaponType: 'basic' } },
    { id: 'phaser.enemy.basic', params: { speed: 80, damage: 1, shootRate: 2 } },
    { id: 'phaser.projectile.bullet', params: { speed: 400, damage: 1 } },
    { id: 'phaser.movement.platformer', params: { canShootWhileMoving: true } },
    { id: 'phaser.camera.follow', params: { followPlayer: true, smoothing: 0.1 } },
    { id: 'phaser.ui.hud', params: { showScore: true, showLives: true, font: 'Arial' } }
  ],
  assets: {
    sprites: {
      player: { src: '/sprites/player.png', kind: 'spritesheet', frames: 8 },
      enemy: { src: '/sprites/enemy.png', kind: 'spritesheet', frames: 4 },
      bullet: { src: '/sprites/bullet.png', kind: 'sprite' },
      platform: { src: '/sprites/platform.png', kind: 'sprite' }
    },
    sounds: {
      shoot: { src: '/sounds/shoot.wav' },
      enemy_hit: { src: '/sounds/hit.wav' },
      enemy_death: { src: '/sounds/death.wav' }
    }
  },
  controls: {
    scheme: 'keyboard',
    actions: {
      moveLeft: 'ArrowLeft',
      moveRight: 'ArrowRight',
      shoot: 'Space',
      jump: 'ArrowUp'
    }
  },
  conflictPolicy: { strategy: 'priority', tieBreak: 'error', allowUnsafe: false }
})

export default function PlanReviewPage() {
  const [runtimeOps, setRuntimeOps] = useState<RuntimeOps | null>(null)
  const [stage, setStage] = useState<GenerationStage>('generating')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasGeneratedComponent, setHasGeneratedComponent] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    // Load plan directly from localStorage (stored by home page)
    loadPlanFromLocalStorage()
  }, [])

  const loadPlanFromLocalStorage = async () => {
    setStage('generating')
    setProgress(25) // Show some initial progress
    setError(null)
    
    try {
      // Read from localStorage
      const runtimeOpsData = typeof window !== 'undefined' ? localStorage.getItem('runtimeOps') : null
      
      setProgress(50)
      
      if (!runtimeOpsData) {
        throw new Error('No generated game found. Please generate a game first.')
      }
      
      const runtimeOps = JSON.parse(runtimeOpsData)
      
      setProgress(75)
      
      // Check if generated component exists
      const hasGenerated = await checkGeneratedComponent()
      setHasGeneratedComponent(hasGenerated)
      if (hasGenerated) {
        console.log('✅ Generated component detected')
      } else {
        console.log('ℹ️  No generated component found, will use original PhaserPreview')
      }
      
      setProgress(100)
      
      // Set the loaded runtime ops
      setRuntimeOps(runtimeOps)
      setStage('complete')
      
      console.log('✅ RuntimeOps loaded from localStorage')
      
    } catch (error) {
      console.error('Failed to load runtime ops from localStorage:', error)
      setError(error instanceof Error ? error.message : 'Failed to load game. Please generate a game first.')
      setStage('error')
    }
  }



  const handlePlay = () => {
    router.push('/play')
  }

  return (
    <div className="home-container">
      {/* Header */}
      <section className="generator-section">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            🎮 GameBit Generator
          </h1>
          {runtimeOps?.metadata?.description && (
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              marginBottom: '1rem',
              fontStyle: 'italic'
            }}>
              "{runtimeOps.metadata.description}"
            </p>
          )}
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <section className="generator-section">
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            textAlign: 'center'
          }}>
            ⚠️ {error}
            <div style={{ marginTop: '1rem' }}>
              <Link href="/" className="nav-btn">← Back to Home</Link>
            </div>
          </div>
        </section>
      )}

      {/* Generation Progress */}
      {stage === 'generating' && (
        <section className="generator-section">
          <h2 className="generator-title">Generating Your Game</h2>
          <div style={{
            padding: '2rem',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Loading your game...
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#10b981',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ color: '#64748b' }}>
              {progress < 90 ? 'Processing...' : 'Almost ready!'}
            </div>
          </div>
        </section>
      )}

      {/* Preview - show when complete, regardless of component generation status */}
      {stage === 'complete' && runtimeOps && (
        <section className="generator-section">
          <h2 className="generator-title">Preview</h2>
          <div style={{ marginBottom: '0.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#10b981' }}>
            {hasGeneratedComponent ? (
              <>✨ Using LLM-generated game logic • Component at <code>tmp/tmpPhaserPreview.tsx</code></>
            ) : (
              <>🔄 Using fallback preview component</>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            {hasGeneratedComponent ? (
              <GeneratedGamePreview runtimeOps={runtimeOps} width={800} height={480} />
            ) : (
              <PhaserPreview runtimeOps={runtimeOps} width={800} height={480} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link href="/" className="nav-btn">← Back</Link>
            <button className={`nav-btn primary`} onClick={handlePlay}>
              Generate & Play
            </button>
          </div>
        </section>
      )}

      {/* Game Info - only show when complete */}
      {stage === 'complete' && runtimeOps && (
        <section className="generator-section">
          <h2 className="generator-title">Game Details</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div><strong>Title:</strong> {runtimeOps.metadata?.title || 'Generated Game'}</div>
              <div><strong>Description:</strong> {runtimeOps.metadata?.description || 'No description'}</div>
              <div><strong>World Size:</strong> {runtimeOps.world.width} × {runtimeOps.world.height} (tile size: {runtimeOps.world.tileSize}px)</div>
              <div><strong>Systems:</strong> {runtimeOps.systems.length} active systems</div>
              {runtimeOps.entities && runtimeOps.entities.length > 0 && (
                <div><strong>Entities:</strong> {runtimeOps.entities.length} entities</div>
              )}
              <div><strong>Status:</strong> Ready ✅</div>
            </div>
          </div>
        </section>
      )}

      {/* Systems - only show when complete */}
      {stage === 'complete' && runtimeOps && (
        <section className="generator-section">
          <h3 className="generator-title">Game Systems</h3>
          <ul>
            {runtimeOps.systems.map((system, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                <code>{system.type}</code>
                {system.params && Object.keys(system.params).length > 0 && (
                  <span> — params: <code>{JSON.stringify(system.params)}</code></span>
                )}
              </li>
            ))}
          </ul>
          {runtimeOps.entities && runtimeOps.entities.length > 0 && (
            <>
              <h4 className="generator-title" style={{ marginTop: '1.5rem' }}>Entities</h4>
              <ul>
                {runtimeOps.entities.map((entity, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>
                    <code>{entity.id}</code>
                    {entity.name && <span> ({entity.name})</span>}
                    <span> — {entity.components.length} components</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  )
}
