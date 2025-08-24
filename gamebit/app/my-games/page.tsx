'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SavedGame {
  id: string
  name: string
  description: string
  engine: string
  gameType: string
  createdAt: string
  thumbnail: string
  controls: string
  completed?: boolean
}

export default function MyGamesPage() {
  const router = useRouter()
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])

  useEffect(() => {
    // Load games from localStorage
    if (typeof window !== 'undefined') {
      const storedGames = localStorage.getItem('generatedGames')
      
      // Hardcoded Contra game
      const contraGame: SavedGame = {
        id: 'contra-classic',
        name: 'Brave Soldier',
        description: 'A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets',
        engine: 'Famicom',
        gameType: 'contra',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        thumbnail: '🎮',
        controls: 'Arrow keys to move, X to shoot, Space to switch weapons, Z to jump',
        completed: true
      }
      
      if (storedGames) {
        const games = JSON.parse(storedGames)
        // Check if contra game already exists and update it
        const contraIndex = games.findIndex((game: SavedGame) => game.id === 'contra-classic')
        if (contraIndex !== -1) {
          // Update existing contra game with new data
          games[contraIndex] = contraGame
        } else {
          // Add new contra game at beginning
          games.unshift(contraGame)
        }
        localStorage.setItem('generatedGames', JSON.stringify(games))
        setSavedGames(games)
      } else {
        // Initialize with just the Brave Soldier game
        const initialGames = [contraGame]
        setSavedGames(initialGames)
        localStorage.setItem('generatedGames', JSON.stringify(initialGames))
      }
    }
  }, [])

  const handlePlayGame = (game: SavedGame) => {
    // Route to specific game implementations
    if (game.id === 'mygame1') {
      router.push('/mygame1')
    } else if (game.id === 'contra-classic') {
      // Route to contra game with specific game type
      router.push(`/play_game?id=${game.id}&gameType=contra`)
    } else {
      // For newly generated games, we'll use a generic game page
      router.push(`/play_game?id=${game.id}`)
    }
  }

  const handleRemoveGame = (gameId: string) => {
    if (confirm('Are you sure you want to remove this game?')) {
      const updatedGames = savedGames.filter(game => game.id !== gameId)
      setSavedGames(updatedGames)
      localStorage.setItem('generatedGames', JSON.stringify(updatedGames))
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
            padding: '3rem 1rem',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              color: '#1e293b'
            }}>
              No games yet
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              marginBottom: '2rem',
              maxWidth: '400px',
              margin: '0 auto 2rem'
            }}>
              Create your first game to get started! Use our AI-powered game generator to build amazing retro games.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '0.75rem 2rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              🚀 Create Your First Game
            </button>
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
                  {game.name}
                </h3>
                
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#64748b',
                  marginBottom: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  {game.description.length > 80 
                    ? `${game.description.substring(0, 80)}...` 
                    : game.description
                  }
                </p>
                
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <p style={{ 
                    fontSize: '0.75rem',
                    color: '#3b82f6',
                    fontWeight: '500',
                    margin: 0
                  }}>
                    Engine: {game.engine}
                  </p>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontWeight: '500',
                    background: '#dcfce7',
                    color: '#166534'
                  }}>
                    ✅ Complete
                  </span>
                </div>
                
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
                    onClick={() => handlePlayGame(game)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
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
                    ▶ Play Game
                  </button>
                  <button
                    onClick={() => handleRemoveGame(game.id)}
                    style={{
                      padding: '0.75rem',
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
                    title="Remove game"
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
