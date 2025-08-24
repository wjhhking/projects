'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CompositionPlan } from '@/lib/composition'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const PhaserPreview = dynamic(() => import('@/components/PhaserPreview'), { ssr: false })

export default function PlanReviewPage() {
  const [plan, setPlan] = useState<CompositionPlan | null>(null)
  const router = useRouter()

  useEffect(() => {
    const p = typeof window !== 'undefined' ? localStorage.getItem('compositionPlan') : null
    if (p) setPlan(JSON.parse(p))
  }, [])

  const handlePlay = () => {
    router.push('/play')
  }

  return (
    <div>
      <nav className="top-nav">
        <div className="logo">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            🎮 GameBit
          </Link>
        </div>
        <div className="nav-buttons">
          <Link href="/" className="nav-btn">← Back</Link>
          <button className={`nav-btn primary`} onClick={handlePlay}>
            Generate & Play
          </button>
        </div>
      </nav>

      <div className="home-container">
        <section className="generator-section">
          <h2 className="generator-title">Composition Plan</h2>
          {!plan ? (
            <div>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div><strong>Title:</strong> {plan.title}</div>
              </div>
            </div>
          )}
        </section>

        {plan && (
          <section className="generator-section">
            <h3 className="generator-title">Templates</h3>
            <ul>
              {plan.templates.map((t, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>
                  <code>{t.id}</code>
                  {t.params && (
                    <span> — params: <code>{JSON.stringify(t.params)}</code></span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {plan && (
          <section className="generator-section">
            <h3 className="generator-title">Preview</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PhaserPreview plan={plan} width={800} height={480} />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
