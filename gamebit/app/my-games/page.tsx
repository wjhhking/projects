'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SavedGame {
  id: number
  sentence: string
  createdAt: string
  thumbnail?: string
}

export default function MyGamesPage() {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const router = useRouter()

  useEffect(() => {
    // 从 localStorage 加载保存的游戏
    const games = JSON.parse(localStorage.getItem('savedGames') || '[]')
    setSavedGames(games.sort((a: SavedGame, b: SavedGame) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  }, [])

  const handlePlayGame = (sentence: string) => {
    router.push(`/game?sentence=${encodeURIComponent(sentence)}`)
  }

  const handleDeleteGame = (gameId: number) => {
    if (confirm('Are you sure you want to delete this game?')) {
      const updatedGames = savedGames.filter(game => game.id !== gameId)
      setSavedGames(updatedGames)
      localStorage.setItem('savedGames', JSON.stringify(updatedGames))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <Link href="/" className="nav-btn primary">
            + Create New Game
          </Link>
          <Link href="/public-games" className="nav-btn">
            Public Games
          </Link>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="my-games-container">
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '2rem',
          color: '#1e293b'
        }}>
          My Games
        </h1>

        {savedGames.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No games yet</h2>
            <p style={{ marginBottom: '2rem' }}>
              Create your first 8-bit game by describing it in one sentence!
            </p>
            <Link href="/" className="nav-btn primary">
              Create Your First Game
            </Link>
          </div>
        ) : (
          <div className="my-games-grid">
            {savedGames.map((game) => (
              <div key={game.id} className="saved-game-card">
                <div style={{ 
                  background: '#f1f5f9',
                  height: '120px',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem'
                }}>
                  🎮
                </div>
                
                <h3 style={{ 
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#1e293b',
                  lineHeight: '1.4'
                }}>
                  {game.sentence.length > 60 
                    ? `${game.sentence.substring(0, 60)}...` 
                    : game.sentence
                  }
                </h3>
                
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#64748b',
                  marginBottom: '1rem'
                }}>
                  Created {formatDate(game.createdAt)}
                </p>
                
                <div style={{ 
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => handlePlayGame(game.sentence)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 1rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                  >
                    ▶ Play
                  </button>
                  
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    style={{
                      padding: '0.5rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
