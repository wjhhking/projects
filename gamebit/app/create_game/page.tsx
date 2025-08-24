'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { CompositionPlan } from '@/lib/composition'

const PhaserPreview = dynamic(() => import('@/components/PhaserPreview'), { ssr: false })
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })

type GenerationStage = 'none' | 'plan' | 'implementation' | 'complete'

const knightGamePlan: CompositionPlan = {
  planVersion: '1.0',
  title: 'MyGame1',
  description: 'A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets',
  targetRuntime: 'phaser',
  templates: [
    { id: 'mt.world.sidescroller', params: { scrollSpeed: 120, width: 3000, height: 600 } },
    { id: 'mt.player.soldier', params: { speed: 180, health: 3, weaponType: 'rifle' } },
    { id: 'mt.enemy.alien', params: { speed: 80, damage: 1, shootRate: 2 } },
    { id: 'mt.projectile.bullet', params: { speed: 400, damage: 1 } },
    { id: 'mt.movement.runShoot', params: { canShootWhileMoving: true } },
    { id: 'mt.camera.sidescroll', params: { followPlayer: true, smoothing: 0.1 } },
    { id: 'mt.ui.hudBasic', params: { showScore: true, showLives: true, font: 'PressStart2P' } }
  ],
  assets: {
    sprites: {
      soldier: { src: '/sprites/soldier.png', kind: 'spritesheet', frames: 8 },
      alien: { src: '/sprites/alien.png', kind: 'spritesheet', frames: 4 },
      bullet: { src: '/sprites/bullet.png', kind: 'sprite' },
      platform: { src: '/sprites/platform.png', kind: 'sprite' }
    },
    sounds: {
      shoot: { src: '/sounds/shoot.wav' },
      enemy_hit: { src: '/sounds/hit.wav' },
      alien_death: { src: '/sounds/alien.wav' }
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
}

export default function CreateGamePage() {
  const [prompt, setPrompt] = useState<string>('')
  const [stage, setStage] = useState<GenerationStage>('none')
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const savedPrompt = typeof window !== 'undefined' ? localStorage.getItem('gamePrompt') : null
    if (savedPrompt) {
      setPrompt(savedPrompt)
      startGeneration()
    }
  }, [])

  const startGeneration = async () => {
    // Stage 1: Generating Plan (10 seconds)
    setStage('plan')
    setProgress(0)
    
    const planDuration = 10000 // 10 seconds
    const planInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (planDuration / 100))
        if (newProgress >= 100) {
          clearInterval(planInterval)
          startImplementation()
          return 100
        }
        return newProgress
      })
    }, 100)
  }

  const startImplementation = async () => {
    // Stage 2: Implementation (50 seconds)
    setStage('implementation')
    setProgress(0)
    
    const implDuration = 50000 // 50 seconds
    const implInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (implDuration / 100))
        if (newProgress >= 100) {
          clearInterval(implInterval)
          completeGeneration()
          return 100
        }
        return newProgress
      })
    }, 100)
  }

  const completeGeneration = () => {
    setStage('complete')
    setProgress(100)
    
    // Store the generated plan
    if (typeof window !== 'undefined') {
      localStorage.setItem('compositionPlan', JSON.stringify(knightGamePlan))
      localStorage.setItem('compositionValidation', JSON.stringify({ ok: true, errors: [], warnings: [] }))
      
      // Save to My Games
      const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]')
      const newGame = {
        id: Date.now(),
        sentence: knightGamePlan.description,
        createdAt: new Date().toISOString(),
        title: knightGamePlan.title
      }
      savedGames.push(newGame)
      localStorage.setItem('savedGames', JSON.stringify(savedGames))
    }
  }

  const handlePlayGame = () => {
    router.push('/play')
  }

  const getStageText = () => {
    switch (stage) {
      case 'none': return 'Planning'
      case 'plan': return 'Planning'
      case 'implementation': return 'Implementing'
      case 'complete': return 'Ready'
      default: return 'Planning'
    }
  }

  return (
    <div className="home-container">
      <section className="generator-section">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            🎮 Creating Your Game
          </h1>
          {prompt && (
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              marginBottom: '2rem',
              fontStyle: 'italic'
            }}>
              "{prompt}"
            </p>
          )}
        </div>

        {/* Project Status */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 className="generator-title">Project Status</h2>
          <div style={{
            padding: '1.5rem',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              {getStageText()}
            </div>
            
            {/* TODO List */}
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', textAlign: 'left' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: stage === 'complete' || stage === 'implementation' || stage === 'plan' ? '#10b981' : '#64748b'
              }}>
                <span>{stage === 'complete' || stage === 'implementation' || stage === 'plan' ? '✅' : '⏳'}</span>
                Planning
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: stage === 'complete' || stage === 'implementation' ? '#10b981' : '#64748b'
              }}>
                <span>{stage === 'complete' || stage === 'implementation' ? '✅' : '⏳'}</span>
                Implementing
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: stage === 'complete' ? '#10b981' : '#64748b'
              }}>
                <span>{stage === 'complete' ? '✅' : '⏳'}</span>
                Ready
              </div>
            </div>
          </div>
        </div>

        {/* Plan Section - appears after planning stage */}
        {(stage === 'implementation' || stage === 'complete') && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 className="generator-title">Composition Plan</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div><strong>Title:</strong> {knightGamePlan.title}</div>
                <div><strong>Description:</strong> {knightGamePlan.description}</div>
                <div><strong>Status:</strong> Valid ✅</div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Section - appears after planning stage */}
        {(stage === 'implementation' || stage === 'complete') && (
          <div style={{ marginBottom: '3rem' }}>
            <h3 className="generator-title">Templates</h3>
            <ul>
              {knightGamePlan.templates.map((t, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>
                  <code>{t.id}</code>
                  {t.params && (
                    <span> — params: <code>{JSON.stringify(t.params)}</code></span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview */}
        <div>
          <h2 className="generator-title">Preview</h2>
          {stage === 'complete' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <GameCanvas 
                  sentence={knightGamePlan.description} 
                  gameType="contra" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button 
                  onClick={() => router.push('/')} 
                  className="nav-btn"
                >
                  ← Back to Home
                </button>
                <button 
                  onClick={handlePlayGame}
                  className="nav-btn primary"
                >
                  Play Game 🎮
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              height: '480px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              color: '#64748b',
              fontSize: '1.125rem'
            }}>
              {stage === 'none' && 'Preview will appear when generation is complete'}
              {stage === 'plan' && 'Generating game plan...'}
              {stage === 'implementation' && 'Building your game...'}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
