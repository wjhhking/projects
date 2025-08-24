'use client'

import { useRouter } from 'next/navigation'

interface SavedGame {
  id: number
  sentence: string
  createdAt: string
  thumbnail?: string
  title?: string
}

export default function MyGamesPage() {
  const router = useRouter()

  // Always show MyGame1 (contra game)
  const savedGames: SavedGame[] = [
    {
      id: 1,
      title: 'MyGame1',
      sentence: 'A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets',
      createdAt: new Date().toISOString()
    }
  ]

  const handlePlayGame = (sentence: string, gameTitle?: string) => {
    // Check if this is MyGame1 (contra game)
    if (gameTitle === 'MyGame1' || sentence.includes('brave soldier runs through enemy territory')) {
      router.push('/mygame1')
    } else {
      router.push(`/game?sentence=${encodeURIComponent(sentence)}`)
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
                  {game.title || (game.sentence.length > 60 
                    ? `${game.sentence.substring(0, 60)}...` 
                    : game.sentence)
                  }
                </h3>
                
                {game.title && (
                  <p style={{ 
                    fontSize: '0.875rem',
                    color: '#64748b',
                    marginBottom: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    {game.sentence.length > 80 
                      ? `${game.sentence.substring(0, 80)}...` 
                      : game.sentence
                    }
                  </p>
                )}
                
                <p style={{ 
                  fontSize: '0.875rem',
                  color: '#64748b',
                  marginBottom: '1rem'
                }}>
                  Created {formatDate(game.createdAt)}
                </p>
                
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => handlePlayGame(game.sentence, game.title)}
                    style={{
                      width: '100%',
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
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
