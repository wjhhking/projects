'use client'

import { useEffect, useRef, useState } from 'react'
import { MarioGame } from '@/lib/games/mario-game'
import { ContraGame } from '@/lib/games/contra-game'
import { RaidenGame } from '@/lib/games/raiden-game'
import { BattleCityGame } from '@/lib/games/battle-city-game'
import { HundredFloorsGame } from '@/lib/games/hundred-floors-game'
import { BaseGame } from '@/lib/games/base-game'
import { GameEngine } from '@/lib/game-engine'

interface GameCanvasProps {
  sentence?: string
  gameType?: 'mario' | 'contra' | 'raiden' | 'tank-battle' | 'hundred-floors' | 'custom'
  onGameStart?: () => void
}

export default function GameCanvas({ sentence, gameType = 'custom', onGameStart }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<BaseGame | BattleCityGame | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Clean up previous game instance
    if (gameRef.current) {
      gameRef.current.stop()
      gameRef.current = null
    }

    const canvas = canvasRef.current
    canvas.width = 800
    canvas.height = 480

    // 根据游戏类型创建不同的游戏实例
    switch (gameType) {
      case 'mario':
        gameRef.current = new MarioGame(canvas)
        break
      case 'contra':
        gameRef.current = new ContraGame(canvas)
        break
      case 'raiden':
        gameRef.current = new RaidenGame(canvas)
        break
      case 'tank-battle':
        gameRef.current = new BattleCityGame(canvas)
        break
      case 'hundred-floors':
        gameRef.current = new HundredFloorsGame(canvas)
        break
      default:
        gameRef.current = new MarioGame(canvas) // 默认使用 Mario 游戏
        break
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.stop()
      }
    }
  }, [gameType])

  useEffect(() => {
    if (sentence && gameRef.current) {
      // 根据句子生成游戏内容
      generateGameFromSentence(sentence)
    }
  }, [sentence])

  const generateGameFromSentence = (sentence: string) => {
    if (!gameRef.current) return

    // 简单的句子解析来影响游戏生成
    const words = sentence.toLowerCase().split(' ')
    
    // 检查是否是坦克游戏
    if (gameRef.current instanceof BattleCityGame) {
      // 坦克游戏的特殊处理
      if (words.includes('fast') || words.includes('quick') || words.includes('speed')) {
        // 坦克游戏中可以增加移动速度或减少射击间隔
        console.log('🚀 Tank game: Increased speed!')
      }
      
      if (words.includes('hard') || words.includes('difficult') || words.includes('challenge')) {
        // 增加敌人数量或减少时间
        gameRef.current.totalEnemies = Math.min(20, gameRef.current.totalEnemies + 5)
        gameRef.current.gameTimer = Math.max(30, gameRef.current.gameTimer - 15)
        console.log('💀 Tank game: Increased difficulty!')
      }
    } else if ('player' in gameRef.current && 'levels' in gameRef.current) {
      // BaseGame的处理
      const baseGame = gameRef.current as BaseGame
      
      if (words.includes('fast') || words.includes('quick') || words.includes('speed')) {
        if ('maxSpeed' in baseGame.player) {
          (baseGame.player as any).maxSpeed = 300
        }
      }
      
      if (words.includes('jump') || words.includes('fly') || words.includes('high')) {
        if ('jumpPower' in baseGame.player) {
          (baseGame.player as any).jumpPower = 500
        }
      }
      
      if (words.includes('hard') || words.includes('difficult') || words.includes('challenge')) {
        // 增加敌人数量
        baseGame.levels.forEach(level => {
          level.enemies.forEach(enemy => {
            enemy.direction *= 1.5 // 敌人移动更快
          })
        })
      }
      
      if (words.includes('coin') || words.includes('gold') || words.includes('treasure')) {
        // 增加收集品
        baseGame.levels.forEach(level => {
          level.collectibles.forEach(collectible => {
            collectible.type = 'coin'
          })
        })
      }
    }

    console.log(`🎮 Generated game from: "${sentence}"`)
  }

  const startGame = () => {
    if (gameRef.current && !gameStarted) {
      // 启用音频上下文 (MVP版本暂时禁用)
      // await gameRef.current.audioManager.resumeAudioContext()
      gameRef.current.start()
      setGameStarted(true)
      onGameStart?.()
    }
  }

  const resetGame = () => {
    if (gameRef.current) {
      gameRef.current.stop()
      
      // 重新创建游戏实例
      const canvas = canvasRef.current!
      switch (gameType) {
        case 'mario':
          gameRef.current = new MarioGame(canvas)
          break
        case 'contra':
          gameRef.current = new ContraGame(canvas)
          break
        case 'raiden':
          gameRef.current = new RaidenGame(canvas)
          break
        case 'tank-battle':
          gameRef.current = new BattleCityGame(canvas)
          break
        case 'hundred-floors':
          gameRef.current = new HundredFloorsGame(canvas)
          break
        default:
          gameRef.current = new MarioGame(canvas)
          break
      }
      
      if (sentence) {
        generateGameFromSentence(sentence)
      }
      
      // 立即重新开始游戏
      gameRef.current?.start()
    }
  }

  return (
    <div style={{ textAlign: 'center', position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        tabIndex={0}
        style={{ 
          border: '4px solid #333',
          background: '#87ceeb',
          imageRendering: 'pixelated' as any
        }}
      />
      
      {/* 游戏控制按钮覆盖在画布上 */}
      {!gameStarted && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10
        }}>
          <button 
            onClick={startGame}
            style={{
              padding: '1rem 2rem',
              background: 'rgba(34, 197, 94, 0.95)',
              color: 'white',
              border: '3px solid #16a34a',
              borderRadius: '0.75rem',
              fontSize: '1.25rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(22, 163, 74, 0.95)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.95)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
Start Game
          </button>
        </div>
      )}
      
      {gameStarted && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 10
        }}>
          <button 
            onClick={resetGame}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(245, 158, 11, 0.9)',
              color: 'white',
              border: '2px solid #d97706',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(217, 119, 6, 0.9)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.9)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
Restart
          </button>
        </div>
      )}
    </div>
  )
}
