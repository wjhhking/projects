'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { CompositionPlan } from '@/lib/composition'
import Link from 'next/link'

const PhaserPreview = dynamic(() => import('@/components/PhaserPreview'), { ssr: false })

export default function PlayPage() {
  const [plan, setPlan] = useState<CompositionPlan | null>(null)

  useEffect(() => {
    const p = typeof window !== 'undefined' ? localStorage.getItem('compositionPlan') : null
    if (p) setPlan(JSON.parse(p))
  }, [])

  return (
    <div>
      <nav className="top-nav">
        <div className="logo">
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            🎮 GameBit
          </Link>
        </div>
        <div className="nav-buttons">
          <Link href="/plan" className="nav-btn">← Back to Plan</Link>
        </div>
      </nav>

      <div className="home-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {plan ? (
          <PhaserPreview plan={plan} width={1000} height={600} />
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  )
}
