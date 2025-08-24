'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type GameEngine = 'Famicom' | 'Phaser' | 'Godot'

export default function Home() {
  const [sentence, setSentence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedEngine, setSelectedEngine] = useState<GameEngine>('Famicom')
  const router = useRouter()

  const promptExamples = [
    "A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets",
    "Fast spaceship flies through asteroid field shooting alien enemies", 
    "Ninja warrior runs across rooftops avoiding traps and collecting stars"
  ]

  const handleEngineChange = (engine: GameEngine) => {
    if (engine === 'Godot') {
      alert('Godot engine is coming soon! 🚧')
      setSelectedEngine('Famicom')
      return
    }
    setSelectedEngine(engine)
  }

  const generateGameId = () => {
    return `mygame${Date.now()}`
  }

  const handleGenerate = async () => {
    if (!sentence.trim()) return
    
    setIsGenerating(true)
    
    try {
      if (selectedEngine === 'Famicom') {
        // Famicom: Use create_game flow
        if (typeof window !== 'undefined') {
          localStorage.setItem('gamePrompt', sentence.trim())
          localStorage.setItem('selectedEngine', selectedEngine)
        }
        router.push('/create_game')
      } else {
        // Phaser: Use original API flow
        const response = await fetch('/api/compose', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: sentence.trim() }),
        })
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }
        
        const { runtimeOps } = await response.json()
        console.log('✅ LLM generated runtimeOps')
        
        // Store the generated data directly in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('runtimeOps', JSON.stringify(runtimeOps))
          
          // Save to My Games
          const savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]')
          const newGame = {
            id: Date.now(),
            sentence: runtimeOps.metadata?.description || sentence.trim(),
            createdAt: new Date().toISOString(),
            title: runtimeOps.metadata?.title || 'Generated Game'
          }
          savedGames.push(newGame)
          localStorage.setItem('savedGames', JSON.stringify(savedGames))
        }
        
        // Navigate to plan page after successful generation and storage
        router.push('/plan')
      }
    } catch (error) {
      console.error('Failed to generate game:', error)
      alert('Failed to generate game. Please try again.')
    } finally {
      setIsGenerating(false)
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

          <div className="engine-section">
            <div className="engine-dropdown-container">
              <span className="engine-label">⚙️ Game Style:</span>
              <select 
                value={selectedEngine}
                onChange={(e) => handleEngineChange(e.target.value as GameEngine)}
                className="engine-dropdown"
              >
                <option value="Famicom">Famicom</option>
                <option value="Phaser">Phaser</option>
                <option value="Godot">Godot</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}