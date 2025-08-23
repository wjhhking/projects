'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [sentence, setSentence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
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

  const promptExamples = [
    "A brave knight jumps over dangerous dragons to collect golden treasures",
    "Fast spaceship flies through asteroid field shooting alien enemies", 
    "Ninja warrior runs across rooftops avoiding traps and collecting stars"
  ]

  const handleGenerate = async () => {
    if (!sentence.trim()) return
    
    setIsGenerating(true)
    
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 导航到游戏页面
    router.push(`/game?sentence=${encodeURIComponent(sentence.trim())}`)
  }

  const handleGameSelect = (game: typeof games[0]) => {
    // 直接跳转到游戏页面，传递游戏类型和句子
    router.push(`/game?gameType=${game.id}&sentence=${encodeURIComponent(game.sentence)}`)
  }

  const handlePromptSelect = (prompt: string) => {
    setSentence(prompt)
  }

  return (
    <div>
      {/* 顶部导航 */}
      <nav className="top-nav">
        <div className="logo">🎮 GameBit</div>
        <div className="nav-buttons">
          <Link href="/my-games" className="nav-btn">
            My Games
          </Link>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="home-container">
        {/* 游戏展示区 */}
        <section className="games-showcase">
          <h2>Featured Games</h2>
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
                <div style={{ 
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  ▶ Play Now
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 生成器区域 */}
        <section className="generator-section">
          <h2 className="generator-title">Or Describe Your Own Game</h2>
          
          <div className="input-container">
            <input
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe your 8-bit game in one sentence..."
              className="sentence-input"
              maxLength={200}
            />
            <button 
              onClick={handleGenerate}
              disabled={!sentence.trim() || isGenerating}
              className="generate-btn"
            >
              {isGenerating ? 'Generating...' : 'Generate Game'}
            </button>
          </div>

          <div className="prompts-section">
            <h3>💡 Try these examples:</h3>
            <div className="prompts-grid">
              {promptExamples.map((prompt, index) => (
                <div
                  key={index}
                  className="prompt-card"
                  onClick={() => handlePromptSelect(prompt)}
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}