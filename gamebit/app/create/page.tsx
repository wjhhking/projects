'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { RuntimeOps } from '@/lib/composition/runtimeOps'

// Dynamically import components to avoid SSR issues
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })
const PhaserPreview = dynamic(() => import('@/components/PhaserPreview'), { ssr: false })
const GeneratedGamePreview = dynamic(() => import('@/components/GeneratedGamePreview'), { ssr: false })

type GameEngine = 'Famicom' | 'Phaser' | 'Godot'
type GenerationStage = 'none' | 'planning' | 'implementing' | 'complete' | 'error'

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
    console.log('[create] Generated component not available')
    return false
  }
}

export default function CreateGamePage() {
  const [sentence, setSentence] = useState('')
  const [selectedEngine, setSelectedEngine] = useState<GameEngine>('Famicom')
  const [stage, setStage] = useState<GenerationStage>('none')
  const [progress, setProgress] = useState(0)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [runtimeOps, setRuntimeOps] = useState<RuntimeOps | null>(null)
  const [hasGeneratedComponent, setHasGeneratedComponent] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const promptExamples = [
    "A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets",
    "Fast spaceship flies through asteroid field shooting alien enemies", 
    "Ninja warrior runs across rooftops avoiding traps and collecting stars"
  ]

  useEffect(() => {
    // Check if we're coming from a redirect with saved data
    const savedPrompt = typeof window !== 'undefined' ? localStorage.getItem('gamePrompt') : null
    const savedEngine = typeof window !== 'undefined' ? localStorage.getItem('selectedEngine') : null
    
    if (savedPrompt) {
      setSentence(savedPrompt)
      if (savedEngine) {
        setSelectedEngine(savedEngine as GameEngine)
      }
      // Auto-start generation if we have saved data
      handleGenerate()
    }
  }, [])

  const handleEngineChange = (engine: GameEngine) => {
    if (engine === 'Godot') {
      alert('Godot engine is coming soon! 🚧')
      return
    }
    setSelectedEngine(engine)
  }

  const handlePromptSelect = (prompt: string) => {
    setSentence(prompt)
  }

  const generateGameId = () => {
    return `mygame${Date.now()}`
  }

  const handleGenerate = async () => {
    if (!sentence.trim()) return
    
    setError(null)
    setStage('planning')
    setProgress(0)
    
    try {
      if (selectedEngine === 'Famicom') {
        await simulateFamicomGeneration()
      } else if (selectedEngine === 'Phaser') {
        await generatePhaserGame()
      }
    } catch (error) {
      console.error('Failed to generate game:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate game. Please try again.')
      setStage('error')
    }
  }

  const simulateFamicomGeneration = async () => {
    // Stage 1: Planning (3 seconds)
    setStage('planning')
    await simulateProgress(3000, 50)
    
    // Stage 2: Implementation (7 seconds)
    setStage('implementing')
    await simulateProgress(7000, 100)
    
    // Complete generation
    const gameId = generateGameId()
    const newGameData: GameData = {
      id: gameId,
      name: sentence.length > 50 ? `${sentence.substring(0, 50)}...` : sentence,
      description: sentence,
      engine: 'Famicom',
      gameType: 'contra', // Default to contra for Famicom
      createdAt: new Date().toISOString(),
      thumbnail: '🎮',
      controls: 'Arrow keys to move, X to shoot, Space to switch weapons, Z to jump'
    }
    
    setGameData(newGameData)
    setStage('complete')
    
    // Save to localStorage
    saveGameToStorage(newGameData)
  }

  const generatePhaserGame = async () => {
    // Stage 1: Planning (25% progress)
    setStage('planning')
    setProgress(25)
    
    // Call API to generate game
    const response = await fetch('/api/compose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: sentence.trim() }),
    })
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }
    
    setProgress(50)
    setStage('implementing')
    
    const { runtimeOps: generatedRuntimeOps, hasGeneratedComponent: hasGenerated } = await response.json()
    
    setProgress(75)
    
    // Check if generated component exists
    const componentExists = await checkGeneratedComponent()
    setHasGeneratedComponent(componentExists)
    
    setProgress(100)
    setRuntimeOps(generatedRuntimeOps)
    setStage('complete')
    
    // Create game data for Phaser games
    const gameId = generateGameId()
    const newGameData: GameData = {
      id: gameId,
      name: generatedRuntimeOps.metadata?.title || sentence,
      description: generatedRuntimeOps.metadata?.description || sentence,
      engine: 'Phaser',
      gameType: 'phaser',
      createdAt: new Date().toISOString(),
      thumbnail: '🎮',
      controls: 'Use arrow keys to move, Space to shoot'
    }
    
    setGameData(newGameData)
    
    // Save to localStorage
    saveGameToStorage(newGameData)
    
    // Store runtime ops for compatibility
    if (typeof window !== 'undefined') {
      localStorage.setItem('runtimeOps', JSON.stringify(generatedRuntimeOps))
    }
  }

  const simulateProgress = (duration: number, targetProgress: number) => {
    return new Promise<void>((resolve) => {
      const startProgress = progress
      const progressDiff = targetProgress - startProgress
      const startTime = Date.now()
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progressPercent = Math.min(elapsed / duration, 1)
        const newProgress = startProgress + (progressDiff * progressPercent)
        
        setProgress(newProgress)
        
        if (progressPercent >= 1) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    })
  }

  const saveGameToStorage = (gameData: GameData) => {
    if (typeof window !== 'undefined') {
      const savedGames = JSON.parse(localStorage.getItem('generatedGames') || '[]')
      savedGames.push(gameData)
      localStorage.setItem('generatedGames', JSON.stringify(savedGames))
      
      // Clear temporary data
      localStorage.removeItem('gamePrompt')
      localStorage.removeItem('selectedEngine')
    }
  }

  const handlePlayGame = () => {
    if (gameData) {
      if (gameData.engine === 'Famicom') {
        router.push(`/play_game?id=${gameData.id}&gameType=${gameData.gameType}`)
      } else {
        router.push(`/play_game?id=${gameData.id}`)
      }
    }
  }

  const getStageText = () => {
    switch (stage) {
      case 'none': return 'Ready to generate'
      case 'planning': return 'Planning your game...'
      case 'implementing': return 'Building your game...'
      case 'complete': return 'Game ready!'
      case 'error': return 'Generation failed'
      default: return 'Ready'
    }
  }

  const getEngineDescription = (engine: GameEngine) => {
    switch (engine) {
      case 'Famicom': return '8-bit retro games (Mario, Contra, Raiden style)'
      case 'Phaser': return 'Modern composition-based games with meta-templates'
      case 'Godot': return 'Advanced 3D games (Coming soon)'
      default: return ''
    }
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
            🎮 Create Your Game
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            marginBottom: '2rem'
          }}>
            Describe your game idea and choose an engine to bring it to life
          </p>
        </div>
      </section>

      {/* Engine Selection */}
      <section className="generator-section">
        <h2 className="generator-title">Choose Game Engine</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {(['Famicom', 'Phaser', 'Godot'] as GameEngine[]).map((engine) => (
            <div
              key={engine}
              onClick={() => handleEngineChange(engine)}
              style={{
                padding: '1.5rem',
                border: selectedEngine === engine ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                borderRadius: '12px',
                backgroundColor: selectedEngine === engine ? '#eff6ff' : '#f8fafc',
                cursor: engine === 'Godot' ? 'not-allowed' : 'pointer',
                opacity: engine === 'Godot' ? 0.6 : 1,
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}>
                {engine === 'Famicom' ? '🕹️' : engine === 'Phaser' ? '⚡' : '🚧'}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                color: selectedEngine === engine ? '#1d4ed8' : '#1e293b'
              }}>
                {engine}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                lineHeight: '1.4'
              }}>
                {getEngineDescription(engine)}
              </p>
              {engine === 'Godot' && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#f59e0b',
                  fontWeight: '500'
                }}>
                  Coming Soon
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Game Description Input */}
      <section className="generator-section">
        <h2 className="generator-title">Describe Your Game</h2>
        <div className="input-container">
          <input
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Describe your game in one line..."
            className="sentence-input"
            maxLength={200}
            disabled={stage === 'planning' || stage === 'implementing'}
          />
          <button
            onClick={handleGenerate}
            disabled={!sentence.trim() || stage === 'planning' || stage === 'implementing'}
            className="generate-btn"
          >
            {stage === 'planning' || stage === 'implementing' ? 'Generating...' : 'Generate Game'}
          </button>
        </div>

        {/* Example prompts */}
        <div className="prompts-section">
          <h3>💡 Try these examples:</h3>
          <div className="prompts-grid">
            {promptExamples.map((prompt, index) => (
              <div
                key={index}
                className="prompt-card"
                onClick={() => handlePromptSelect(prompt)}
                style={{
                  opacity: stage === 'planning' || stage === 'implementing' ? 0.6 : 1,
                  cursor: stage === 'planning' || stage === 'implementing' ? 'not-allowed' : 'pointer'
                }}
              >
                {prompt}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generation Progress */}
      {(stage === 'planning' || stage === 'implementing') && (
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
              {getStageText()}
            </div>

            {/* Progress bar */}
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

            {/* Stage indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.875rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: (stage === 'planning' || stage === 'implementing' || stage === 'complete') ? '#10b981' : '#64748b'
              }}>
                <span>{(stage === 'planning' || stage === 'implementing' || stage === 'complete') ? '✅' : '⏳'}</span>
                Planning
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: (stage === 'implementing' || stage === 'complete') ? '#10b981' : '#64748b'
              }}>
                <span>{(stage === 'implementing' || stage === 'complete') ? '✅' : '⏳'}</span>
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
        </section>
      )}

      {/* Error Display */}
      {error && (
        <section className="generator-section">
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '12px',
            color: '#dc2626',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              ⚠️ Generation Failed
            </div>
            <p style={{ marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={() => {
                setError(null)
                setStage('none')
                setProgress(0)
              }}
              className="nav-btn"
            >
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* Game Preview */}
      {stage === 'complete' && (gameData || runtimeOps) && (
        <section className="generator-section">
          <h2 className="generator-title">Game Preview</h2>

          {/* Engine-specific status indicator */}
          {selectedEngine === 'Phaser' && (
            <div style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#10b981' }}>
              {hasGeneratedComponent ? (
                <>✨ Using LLM-generated game logic • Component at <code>tmp/tmpPhaserPreview.tsx</code></>
              ) : (
                <>🔄 Using fallback preview component</>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            {selectedEngine === 'Famicom' && gameData ? (
              <GameCanvas
                sentence={gameData.description}
                gameType={gameData.gameType as 'mario' | 'contra' | 'raiden' | 'tank-battle' | 'hundred-floors' | 'custom'}
              />
            ) : selectedEngine === 'Phaser' && runtimeOps ? (
              hasGeneratedComponent ? (
                <GeneratedGamePreview runtimeOps={runtimeOps} width={800} height={480} />
              ) : (
                <PhaserPreview runtimeOps={runtimeOps} width={800} height={480} />
              )
            ) : (
              <div style={{
                width: '800px',
                height: '480px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                color: '#64748b',
                fontSize: '1.125rem'
              }}>
                Game preview will appear here
              </div>
            )}
          </div>

          {/* Action buttons */}
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
        </section>
      )}

      {/* Game Details */}
      {stage === 'complete' && (gameData || runtimeOps) && (
        <section className="generator-section">
          <h2 className="generator-title">Game Details</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {selectedEngine === 'Famicom' && gameData ? (
                <>
                  <div><strong>Title:</strong> {gameData.name}</div>
                  <div><strong>Description:</strong> {gameData.description}</div>
                  <div><strong>Engine:</strong> {gameData.engine}</div>
                  <div><strong>Game Type:</strong> {gameData.gameType}</div>
                  <div><strong>Controls:</strong> {gameData.controls}</div>
                </>
              ) : selectedEngine === 'Phaser' && runtimeOps ? (
                <>
                  <div><strong>Title:</strong> {runtimeOps.metadata?.title || 'Generated Game'}</div>
                  <div><strong>Description:</strong> {runtimeOps.metadata?.description || 'No description'}</div>
                  <div><strong>Engine:</strong> Phaser</div>
                  <div><strong>World Size:</strong> {runtimeOps.world.width} × {runtimeOps.world.height} (tile size: {runtimeOps.world.tileSize}px)</div>
                  <div><strong>Systems:</strong> {runtimeOps.systems.length} active systems</div>
                  {runtimeOps.entities && runtimeOps.entities.length > 0 && (
                    <div><strong>Entities:</strong> {runtimeOps.entities.length} entities</div>
                  )}
                </>
              ) : null}
              <div><strong>Status:</strong> Ready ✅</div>
            </div>
          </div>
        </section>
      )}

      {/* Famicom Templates Details */}
      {stage === 'complete' && selectedEngine === 'Famicom' && gameData && (
        <section className="generator-section">
          <h3 className="generator-title">Famicom Templates</h3>
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

      {/* Phaser Game Systems Details */}
      {stage === 'complete' && selectedEngine === 'Phaser' && runtimeOps && (
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
