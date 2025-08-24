'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const PhaserPreview = dynamic(() => import('@/components/PhaserPreview'), { ssr: false })

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
  const [prompt, setPrompt] = useState<string>('')
  const [plan, setPlan] = useState<any>(null)
  const [validation, setValidation] = useState<any>(null)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const router = useRouter()

  useEffect(() => {
    const savedPrompt = typeof window !== 'undefined' ? localStorage.getItem('gamePrompt') : null
    
    if (savedPrompt) {
      setPrompt(savedPrompt)
      
      // Create Phaser plan
      const phaserPlan = createPhaserPlan(savedPrompt)
      setPlan(phaserPlan)
      setValidation({ ok: true, errors: [], warnings: [] })
      
      // Create game data
      const gameId = `mygame${Date.now()}`
      const newGameData: GameData = {
        id: gameId,
        name: savedPrompt.length > 50 ? `${savedPrompt.substring(0, 50)}...` : savedPrompt,
        description: savedPrompt,
        engine: 'Phaser',
        gameType: 'phaser',
        createdAt: new Date().toISOString(),
        thumbnail: '🎮',
        controls: 'Use arrow keys to move, Space to shoot'
      }
      setGameData(newGameData)
    }
  }, [])

  const handlePlay = () => {
    if (gameData) {
      // Save game to localStorage
      if (typeof window !== 'undefined') {
        const savedGames = JSON.parse(localStorage.getItem('generatedGames') || '[]')
        savedGames.push(gameData)
        localStorage.setItem('generatedGames', JSON.stringify(savedGames))
        
        // Clear temporary data
        localStorage.removeItem('gamePrompt')
        localStorage.removeItem('selectedEngine')
      }
      
      // Navigate to play the game
      router.push(`/play_game?id=${gameData.id}`)
    }
  }

  if (!plan || !gameData) {
    return (
      <div className="home-container">
        <section className="generator-section">
          <div>Loading game plan...</div>
        </section>
      </div>
    )
  }

  return (
    <div className="home-container">
      <section className="generator-section">
        <h2 className="generator-title">Preview</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <PhaserPreview plan={plan} width={800} height={480} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link href="/" className="nav-btn">← Back</Link>
          <Link href="/my-games" className="nav-btn">My Games</Link>
          <button className={`nav-btn primary`} onClick={handlePlay}>
            Generate & Play
          </button>
        </div>
      </section>

      <section className="generator-section">
        <h2 className="generator-title">Game Plan</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div><strong>Title:</strong> {gameData.name}</div>
            <div><strong>Description:</strong> {gameData.description}</div>
            <div><strong>Engine:</strong> {gameData.engine}</div>
            {validation && (
              <div>
                <strong>Plan Status:</strong> {validation.ok ? 'Valid ✅' : 'Invalid ❌'}
                {validation.errors.length > 0 && (
                  <ul style={{ color: '#b91c1c', marginTop: '0.5rem', marginLeft: '1rem' }}>
                    {validation.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                  </ul>
                )}
                {validation.warnings.length > 0 && (
                  <ul style={{ color: '#92400e', marginTop: '0.5rem', marginLeft: '1rem' }}>
                    {validation.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="generator-section">
        <h3 className="generator-title">Templates</h3>
        <ul>
          {plan.templates.map((t: any, i: number) => (
            <li key={i} style={{ marginBottom: '0.25rem' }}>
              <code>{t.id}</code>
              {t.params && (
                <span> — params: <code>{JSON.stringify(t.params)}</code></span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
