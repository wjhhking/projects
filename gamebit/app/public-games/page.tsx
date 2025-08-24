'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GAME_SPRITE_ICONS } from '../../lib/sprite-icon-generator'

export default function PublicGamesPage() {
  const router = useRouter()
  const [spriteIcons, setSpriteIcons] = useState<{[key: string]: string}>({})

  useEffect(() => {
    setSpriteIcons({
      mario: GAME_SPRITE_ICONS.mario(),
      raiden: GAME_SPRITE_ICONS.raiden(),
      'tank-battle': GAME_SPRITE_ICONS['tank-battle'](),
      'hundred-floors': GAME_SPRITE_ICONS['hundred-floors'](),
      'gold-miner': GAME_SPRITE_ICONS['gold-miner'](),
      tetris: GAME_SPRITE_ICONS.tetris(),
      snake: GAME_SPRITE_ICONS.snake(),
      'magic-tower': GAME_SPRITE_ICONS['magic-tower']()
    })
  }, [])

  const games = [
    {
      id: 'mario',
      title: 'Super Mario',
      icon: spriteIcons.mario,
      description: 'Classic platformer - jump over goombas and collect coins in the Mushroom Kingdom',
      sentence: 'A red plumber hero jumps over dangerous mushroom enemies to collect golden coins and power-ups',
      category: 'Rightward Movement',
      available: true
    },

    {
      id: 'raiden',
      title: 'Raiden',
      icon: spriteIcons.raiden, 
      description: 'Horizontal shoot-em-up - pilot a fighter jet through enemy airspace',
      sentence: 'A fast fighter jet flies through dangerous skies shooting enemy planes and dodging missiles',
      category: 'Rightward Movement',
      available: true
    },
    {
      id: 'tank-battle',
      title: 'Battle City',
      icon: spriteIcons['tank-battle'],
      description: 'Classic tank warfare - destroy enemy tanks and protect your base',
      sentence: 'Armored tanks battle across battlefields shooting projectiles and avoiding enemy fire',
      category: 'Upward Movement',
      available: true
    },
    {
      id: 'hundred-floors',
      title: '100 Floors Challenge',
      icon: spriteIcons['hundred-floors'],
      description: 'Hardcore platformer - survive 100 increasingly difficult floors',
      sentence: 'A determined warrior climbs through dangerous tower floors avoiding deadly traps and enemies',
      category: 'Upward Movement',
      available: true
    },
    {
      id: 'gold-miner',
      title: 'Gold Miner',
      icon: spriteIcons['gold-miner'],
      description: 'Mining adventure - dig deep to collect gold and precious gems',
      sentence: 'A skilled miner uses his claw to grab gold nuggets and gems from underground caves',
      category: 'Rightward Movement',
      available: false
    },
    {
      id: 'tetris',
      title: 'Tetris',
      icon: spriteIcons.tetris,
      description: 'Classic puzzle - arrange falling blocks to clear lines',
      sentence: 'Colorful geometric blocks fall from above and must be arranged to form complete horizontal lines',
      category: 'Static Puzzle',
      available: false
    },
    {
      id: 'snake',
      title: 'Snake',
      icon: spriteIcons.snake,
      description: 'Retro arcade - control a growing snake to eat food without hitting walls',
      sentence: 'A hungry snake slithers around eating food pellets while growing longer and avoiding walls',
      category: 'Static Puzzle',
      available: false
    },
    {
      id: 'magic-tower',
      title: 'Magic Tower',
      icon: spriteIcons['magic-tower'],
      description: 'RPG puzzle - climb the tower by solving puzzles and fighting monsters',
      sentence: 'A brave hero explores a mysterious tower collecting keys and battling magical creatures',
      category: 'Static Puzzle',
      available: false
    }
  ]

  const handleGameSelect = (game: any) => {
    if (!game.available) return
    // 将游戏数据存储到 localStorage，然后用简洁的 URL 跳转
    localStorage.setItem('currentGame', JSON.stringify({
      id: game.id,
      title: game.title,
      sentence: game.sentence,
      category: game.category
    }))
    router.push(`/game?id=${game.id}`)
  }

  return (
    <div>
      {/* 主内容 */}
      <div className="public-games-container">
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          marginBottom: '1rem',
          color: '#1e293b',
          textAlign: 'center'
        }}>
          Public Games
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
              style={{
                cursor: game.available ? 'pointer' : 'not-allowed',
                opacity: game.available ? 1 : 0.7
              }}
            >
              <div className="game-icon">
                {game.icon && typeof game.icon === 'string' && game.icon.startsWith('data:') ? (
                  <img src={game.icon} alt={game.title} style={{ width: '48px', height: '48px', imageRendering: 'pixelated' }} />
                ) : (
                  <span style={{ fontSize: '48px' }}>{game.icon || '🎮'}</span>
                )}
              </div>
              
              <div className="game-title">{game.title}</div>
              <div className="game-desc">{game.description}</div>
              
              {/* 游戏状态标识 */}
              <div style={{ 
                marginTop: '1rem',
                marginBottom: '1rem',
                minHeight: '24px' // 占位，防止布局移动
              }}>
                {!game.available && (
                  <span style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Coming Soon
                  </span>
                )}
              </div>
              
              <div style={{ 
                padding: '0.5rem 1rem',
                background: game.available ? '#3b82f6' : '#9ca3af',
                color: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: game.available ? 'pointer' : 'not-allowed'
              }}>
                {game.available ? 'Play Now' : 'Coming Soon'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
