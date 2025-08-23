'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PublicGamesPage() {
  const router = useRouter()

  const games = [
    {
      id: 'mario',
      title: 'Super Mario',
      icon: '🍄',
      description: 'Classic platformer - jump over goombas and collect coins in the Mushroom Kingdom',
      sentence: 'A red plumber hero jumps over dangerous mushroom enemies to collect golden coins and power-ups'
    },
    {
      id: 'contra',
      title: 'Contra', 
      icon: '🔫',
      description: 'Side-scrolling shooter - two soldiers fight through alien-infested bases',
      sentence: 'Two brave soldiers run through enemy territory shooting aliens and avoiding deadly bullets'
    },
    {
      id: 'raiden',
      title: 'Raiden',
      icon: '✈️', 
      description: 'Horizontal shoot-em-up - pilot a fighter jet through enemy airspace',
      sentence: 'A fast fighter jet flies through dangerous skies shooting enemy planes and dodging missiles'
    }
  ]

  const handleGameSelect = (game: typeof games[0]) => {
    // 直接跳转到游戏页面，传递游戏类型和句子
    router.push(`/game?gameType=${game.id}&sentence=${encodeURIComponent(game.sentence)}`)
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
          <Link href="/my-games" className="nav-btn">
            My Games
          </Link>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="public-games-container">
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '1rem',
          color: '#1e293b',
          textAlign: 'center'
        }}>
          🎮 Public Games
        </h1>
        
        <p style={{
          textAlign: 'center',
          fontSize: '1.125rem',
          color: '#64748b',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto'
        }}>
          Explore our collection of classic 8-bit style games. Each game offers unique gameplay mechanics and nostalgic fun!
        </p>

        {/* 游戏网格 */}
        <div className="games-grid">
          {games.map((game) => (
            <div 
              key={game.id}
              className="game-card"
              onClick={() => handleGameSelect(game)}
            >
              <div className="game-icon">{game.icon}</div>
              <div className="game-title">{game.title}</div>
              <div className="game-desc">{game.description}</div>
              
              {/* 游戏状态标识 */}
              <div style={{ 
                marginTop: '1rem',
                marginBottom: '1rem'
              }}>
                {game.id === 'mario' ? (
                  <span style={{
                    background: '#22c55e',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    ✅ Available
                  </span>
                ) : (
                  <span style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    🚧 Coming Soon
                  </span>
                )}
              </div>
              
              <div style={{ 
                padding: '0.5rem 1rem',
                background: game.id === 'mario' ? '#3b82f6' : '#9ca3af',
                color: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: game.id === 'mario' ? 'pointer' : 'not-allowed'
              }}>
                {game.id === 'mario' ? '▶ Play Now' : '⏳ Coming Soon'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
