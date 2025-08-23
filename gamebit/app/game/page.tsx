'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import GameCanvas from '@/components/GameCanvas'
import Link from 'next/link'

function getGameDisplayName(gameType: string): string {
  const gameNames: Record<string, string> = {
    'mario': 'Mario Game',
    'contra': 'Contra Game',
    'raiden': 'Raiden Game',
    'tank-battle': 'Battle City',
    'hundred-floors': '100 Floors Challenge'
  }
  return gameNames[gameType] || `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game`
}

export default function GamePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sentence, setSentence] = useState('')
  const [gameType, setGameType] = useState<'mario' | 'contra' | 'raiden' | 'tank-battle' | 'hundred-floors' | 'custom'>('mario')
  const [gameTitle, setGameTitle] = useState('')
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    const gameId = searchParams.get('id')
    
    if (gameId) {
      // 从 localStorage 读取游戏数据
      const currentGame = localStorage.getItem('currentGame')
      if (currentGame) {
        const gameData = JSON.parse(currentGame)
        setSentence(gameData.sentence)
        setGameType(gameData.id as 'mario' | 'contra' | 'raiden' | 'tank-battle' | 'hundred-floors' | 'custom')
        setGameTitle(gameData.title)
      } else {
        // 如果没有游戏数据，重定向到公共游戏页面
        router.push('/public-games')
      }
    } else {
      // 兼容旧的 URL 格式
      const sentenceParam = searchParams.get('sentence')
      const gameTypeParam = searchParams.get('gameType') as 'mario' | 'contra' | 'raiden' | 'tank-battle' | 'hundred-floors' | 'custom'
      
      if (sentenceParam) {
        setSentence(sentenceParam)
      } else {
        router.push('/')
      }
      
      if (gameTypeParam) {
        setGameType(gameTypeParam)
      }
    }
  }, [searchParams, router])

  // 自动保存游戏到 My Games
  useEffect(() => {
    if (sentence) {
      const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]')
      
      // 检查是否已经保存过相同的游戏
      const existingGame = savedGames.find((game: any) => game.sentence === sentence)
      if (!existingGame) {
        const newGame = {
          id: Date.now(),
          sentence: sentence,
          gameType: gameType,
          title: gameTitle || getGameDisplayName(gameType),
          createdAt: new Date().toISOString(),
          thumbnail: null
        }
        
        savedGames.push(newGame)
        localStorage.setItem('savedGames', JSON.stringify(savedGames))
      }
    }
  }, [sentence, gameType, gameTitle])

  if (!sentence) {
    return (
      <div className="game-page">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {/* 游戏内容 */}
      <div className="game-page">
        <h1 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1rem', 
          color: '#CD853F', 
          textAlign: 'center', 
          fontWeight: '600',
          background: 'none'
        }}>
          {gameTitle}
        </h1>

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
          {gameType === 'contra' ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                Use arrow keys to move • Space to shoot • X to switch weapons • Down to crouch
              </div>
              <div>
                Fight through enemy territory! Destroy all enemies and reach the flag to complete each level.
              </div>
            </>
          ) : gameType === 'raiden' ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                Use arrow keys to fly • Space/X to shoot • Collect power-ups to upgrade weapons
              </div>
              <div>
                Pilot your fighter jet through enemy airspace! Destroy enemy aircraft and survive to the end.
              </div>
            </>
          ) : gameType === 'tank-battle' ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                Use arrow keys to move and aim • Space/X to shoot • Protect your base from enemy tanks
              </div>
              <div>
                Command your tank in intense battlefield combat! Destroy all enemy tanks while protecting your base.
              </div>
            </>
          ) : gameType === 'hundred-floors' ? (
            <>
              <div style={{ marginBottom: '1rem' }}>
                Use arrow keys to move • Space/Z to jump • Collect power-ups • Avoid traps and reach the top
              </div>
              <div>
                Climb through 100 increasingly difficult floors! Use moving platforms and power-ups to survive.
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                Use arrow keys to move • Space to jump • Z/X for actions
              </div>
              <div>
                Complete all levels to win! Collect coins and avoid enemies.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
