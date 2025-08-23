'use client'

import { useEffect, useRef, useState } from 'react'
import { MarioGame } from '@/lib/games/mario-game'
import { BaseGame } from '@/lib/games/base-game'

interface GameCanvasProps {
  sentence?: string
  gameType?: 'mario' | 'contra' | 'raiden' | 'custom'
  onGameStart?: () => void
}

export default function GameCanvas({ sentence, gameType = 'custom', onGameStart }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<BaseGame | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = 800
    canvas.height = 480

    // 根据游戏类型创建不同的游戏实例
    switch (gameType) {
      case 'mario':
        gameRef.current = new MarioGame(canvas)
        break
      default:
        gameRef.current = new MarioGame(canvas) // 暂时都使用 Mario 游戏
        break
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.stop()
      }
    }
  }, [])

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
    
    // 根据关键词调整游戏参数
    if (words.includes('fast') || words.includes('quick') || words.includes('speed')) {
      gameRef.current.player.maxSpeed = 300
    }
    
    if (words.includes('jump') || words.includes('fly') || words.includes('high')) {
      gameRef.current.player.jumpPower = 500
    }
    
    if (words.includes('hard') || words.includes('difficult') || words.includes('challenge')) {
      // 增加敌人数量
      gameRef.current.levels.forEach(level => {
        level.enemies.forEach(enemy => {
          enemy.direction *= 1.5 // 敌人移动更快
        })
      })
    }
    
    if (words.includes('coin') || words.includes('gold') || words.includes('treasure')) {
      // 增加收集品
      gameRef.current.levels.forEach(level => {
        level.collectibles.forEach(collectible => {
          collectible.type = 'coin'
        })
      })
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
      setGameStarted(false)
      
      // 重新创建游戏实例
      const canvas = canvasRef.current!
      gameRef.current = new MarioGame(canvas)
      
      if (sentence) {
        generateGameFromSentence(sentence)
      }
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
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
      
      <div className="game-controls" style={{ margin: '1rem 0' }}>
        {!gameStarted ? (
          <button 
            onClick={startGame}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#16a34a'}
            onMouseOut={(e) => e.currentTarget.style.background = '#22c55e'}
          >
            🎮 Start Game
          </button>
        ) : (
          <button 
            onClick={resetGame}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#d97706'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f59e0b'}
          >
            🔄 Restart Game
          </button>
        )}
      </div>
    </div>
  )
}
