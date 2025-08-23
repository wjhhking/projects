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
    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sentence.trim() })
      })
      if (!res.ok) throw new Error('Compose failed')
      const data = await res.json()
      if (typeof window !== 'undefined') {
        localStorage.setItem('compositionPlan', JSON.stringify(data.plan))
        localStorage.setItem('compositionValidation', JSON.stringify(data.validation))
        if (data.runtimeOps) localStorage.setItem('runtimeOps', JSON.stringify(data.runtimeOps))
        if (data.opsValidation) localStorage.setItem('opsValidation', JSON.stringify(data.opsValidation))
      }
      router.push('/plan')
    } catch (e) {
      console.error(e)
      setIsGenerating(false)
      alert('Failed to generate plan')
    }
  }

  const handlePromptSelect = (prompt: string) => {
    setSentence(prompt)
  }

  return (
    <div>
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
              One line, one game
            </p>
          </div>
          
          <div className="input-container">
            <input
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Describe your game in one line..."
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