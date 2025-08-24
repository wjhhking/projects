'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })

type GenerationStage = 'none' | 'plan' | 'implementation' | 'complete'

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

export default function CreateGamePage() {
  const [prompt, setPrompt] = useState<string>('')
  const [engine, setEngine] = useState<string>('Famicom')
  const [stage, setStage] = useState<GenerationStage>('none')
  const [progress, setProgress] = useState(0)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const router = useRouter()

  useEffect(() => {
    const savedPrompt = typeof window !== 'undefined' ? localStorage.getItem('gamePrompt') : null
    const savedEngine = typeof window !== 'undefined' ? localStorage.getItem('selectedEngine') : null
    
    if (savedPrompt) {
      setPrompt(savedPrompt)
      if (savedEngine) {
        setEngine(savedEngine)
      }
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
    
    // Generate game data
    const gameId = `mygame${Date.now()}`
    const newGameData: GameData = {
      id: gameId,
      name: prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt,
      description: prompt,
      engine: engine,
      gameType: engine === 'Famicom' ? 'contra' : 'phaser',
      createdAt: new Date().toISOString(),
      thumbnail: '🎮',
      controls: 'Use arrow keys to move, Space to shoot'
    }
    
    setGameData(newGameData)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      const savedGames = JSON.parse(localStorage.getItem('generatedGames') || '[]')
      savedGames.push(newGameData)
      localStorage.setItem('generatedGames', JSON.stringify(savedGames))
      
      // Clear temporary data
      localStorage.removeItem('gamePrompt')
      localStorage.removeItem('selectedEngine')
    }
  }

  const handlePlayGame = () => {
    if (gameData) {
      router.push(`/play_game?id=${gameData.id}`)
    }
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
          {engine && (
            <p style={{
              fontSize: '1rem',
              color: '#3b82f6',
              marginBottom: '1rem',
              fontWeight: '500'
            }}>
              Engine: {engine}
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
            
            {/* Loading dots */}
            {stage !== 'none' && stage !== 'complete' && (
              <div style={{
                fontSize: '2rem',
                marginBottom: '1.5rem',
                color: '#3b82f6'
              }}>
                ...
              </div>
            )}
            
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

        {/* Game Details - appears after planning stage */}
        {(stage === 'plan' || stage === 'implementation' || stage === 'complete') && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 className="generator-title">Game Details</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div><strong>Title:</strong> Brave Soldier</div>
                <div><strong>Description:</strong> A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets</div>
                <div><strong>Engine:</strong> Famicom</div>
                <div><strong>Status:</strong> Valid ✅</div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 className="generator-title">Preview</h2>
          {stage === 'complete' && gameData ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <GameCanvas 
                  sentence={gameData.description} 
                  gameType={gameData.gameType as 'mario' | 'contra' | 'raiden' | 'tank-battle' | 'hundred-floors' | 'custom'} 
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
                  onClick={() => router.push('/my-games')}
                  className="nav-btn"
                >
                  My Games
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

        {/* Game Plan - appears when planning is done */}
        {(stage === 'plan' || stage === 'implementation' || stage === 'complete') && (
          <section className="generator-section" style={{ marginBottom: '3rem' }}>
            <h2 className="generator-title">Game Plan</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div><strong>Title:</strong> Brave Soldier</div>
                <div><strong>Description:</strong> A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets</div>
                <div><strong>Engine:</strong> Famicom</div>
                <div><strong>Plan Status:</strong> Valid ✅</div>
              </div>
            </div>
          </section>
        )}

        {/* Templates - appears when planning is done */}
        {(stage === 'plan' || stage === 'implementation' || stage === 'complete') && (
          <section className="generator-section">
            <h3 className="generator-title">Templates</h3>
            <ul>
              <li style={{ marginBottom: '0.25rem' }}>
                <code>famicom.world.sidescroller</code>
                <span> — params: <code>{JSON.stringify({ scrollSpeed: 120, width: 3000, height: 480 })}</code></span>
              </li>
              <li style={{ marginBottom: '0.25rem' }}>
                <code>famicom.player.soldier</code>
                <span> — params: <code>{JSON.stringify({ speed: 150, health: 3, weaponType: 'rifle' })}</code></span>
              </li>
              <li style={{ marginBottom: '0.25rem' }}>
                <code>famicom.enemy.alien</code>
                <span> — params: <code>{JSON.stringify({ speed: 80, damage: 1, shootRate: 2 })}</code></span>
              </li>
              <li style={{ marginBottom: '0.25rem' }}>
                <code>famicom.projectile.bullet</code>
                <span> — params: <code>{JSON.stringify({ speed: 400, damage: 1 })}</code></span>
              </li>
              <li style={{ marginBottom: '0.25rem' }}>
                <code>famicom.movement.platformer</code>
                <span> — params: <code>{JSON.stringify({ canShootWhileMoving: true })}</code></span>
              </li>
              <li style={{ marginBottom: '0.25rem' }}>
                <code>famicom.camera.follow</code>
                <span> — params: <code>{JSON.stringify({ followPlayer: true, smoothing: 0.1 })}</code></span>
              </li>
              <li style={{ marginBottom: '0.25rem' }}>
                <code>famicom.ui.retro</code>
                <span> — params: <code>{JSON.stringify({ showScore: true, showLives: true, font: 'pixel' })}</code></span>
              </li>
            </ul>
          </section>
        )}
      </section>
    </div>
  )
}
