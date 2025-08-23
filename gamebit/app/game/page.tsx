'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import GameCanvas from '@/components/GameCanvas'
import Link from 'next/link'

export default function GamePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sentence, setSentence] = useState('')
  const [gameType, setGameType] = useState<'mario' | 'contra' | 'raiden' | 'custom'>('mario')
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    const sentenceParam = searchParams.get('sentence')
    const gameTypeParam = searchParams.get('gameType') as 'mario' | 'contra' | 'raiden' | 'custom'
    
    if (sentenceParam) {
      setSentence(sentenceParam)
    } else {
      // 如果没有句子参数，重定向到主页
      router.push('/')
    }
    
    if (gameTypeParam) {
      setGameType(gameTypeParam)
    }
  }, [searchParams, router])

  const handleSaveGame = () => {
    // 保存游戏到 localStorage
    const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]')
    const newGame = {
      id: Date.now(),
      sentence: sentence,
      createdAt: new Date().toISOString(),
      thumbnail: null // 可以后续添加截图功能
    }
    
    savedGames.push(newGame)
    localStorage.setItem('savedGames', JSON.stringify(savedGames))
    
    alert('Game saved to My Games!')
  }

  if (!sentence) {
    return (
      <div className="game-page">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {/* 顶部导航 */}
      <nav className="top-nav">
        <div className="logo">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            🎮 GameBit
          </Link>
        </div>
        <div className="nav-buttons">
          <button onClick={handleSaveGame} className="nav-btn primary">
            Save to My Games
          </button>
          <Link href="/public-games" className="nav-btn">
            Public Games
          </Link>
          <Link href="/my-games" className="nav-btn">
            My Games
          </Link>
          <Link href="/" className="nav-btn">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* 游戏内容 */}
      <div className="game-page">
        <div className="game-info">
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#00ff00' }}>
            🎯 Current Game
          </h1>
          <p style={{ fontSize: '1rem', color: '#fff' }}>
            "{sentence}"
          </p>
        </div>

        <GameCanvas 
          sentence={sentence}
          gameType={gameType}
          onGameStart={() => setGameStarted(true)}
        />

        <div style={{ 
          marginTop: '2rem', 
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#aaa',
          maxWidth: '600px'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            🕹️ Use arrow keys to move • Space to jump • Z/X for actions
          </div>
          <div>
            Complete all 10 levels to win! Collect coins and avoid enemies.
          </div>
        </div>
      </div>
    </div>
  )
}
