'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false })

export default function MyGame1Page() {
  const [gameStarted, setGameStarted] = useState(false)
  const router = useRouter()

  const handleGameStart = () => {
    setGameStarted(true)
  }

  return (
    <div>
      <div className="game-container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '0 1rem'
        }}>
          <button 
            onClick={() => router.push('/my-games')} 
            className="nav-btn"
          >
            ← Back to My Games
          </button>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1e293b'
          }}>
            MyGame1
          </h1>
          <div style={{ width: '120px' }} /> {/* Spacer for centering */}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <GameCanvas 
            sentence="A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets"
            gameType="contra"
            onGameStart={handleGameStart}
          />
        </div>

        <div style={{
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.875rem'
        }}>
          <p>Use arrow keys to move, Space to shoot</p>
          {gameStarted && (
            <p style={{ color: '#10b981', marginTop: '0.5rem' }}>
              Game started! Good luck, soldier! 🎮
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
