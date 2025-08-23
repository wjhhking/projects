'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [sentence, setSentence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

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

  const handlePromptSelect = (prompt: string) => {
    setSentence(prompt)
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
          <Link href="/public-games" className="nav-btn">
            Public Games
          </Link>
          <Link href="/my-games" className="nav-btn">
            My Games
          </Link>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="home-container">
        {/* 生成器区域 */}
        <section className="generator-section">
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1e293b'
            }}>
              🎮 GameBit
            </h1>
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              marginBottom: '2rem'
            }}>
              Turn your imagination into 8-bit reality with just one sentence!
            </p>
          </div>
          
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