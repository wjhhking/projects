'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CompositionPlan } from '@/lib/composition'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const PhaserPreview = dynamic(() => import('@/components/PhaserPreview'), { ssr: false })

export default function PlanReviewPage() {
  const [plan, setPlan] = useState<CompositionPlan | null>(null)
  const [validation, setValidation] = useState<{ ok: boolean; errors: string[]; warnings: string[] } | null>(null)
  const [runtimeOps, setRuntimeOps] = useState<any | null>(null)
  const [opsValidation, setOpsValidation] = useState<{ ok: boolean; errors: string[]; warnings: string[] } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const p = typeof window !== 'undefined' ? localStorage.getItem('compositionPlan') : null
    const v = typeof window !== 'undefined' ? localStorage.getItem('compositionValidation') : null
    const o = typeof window !== 'undefined' ? localStorage.getItem('runtimeOps') : null
    const ov = typeof window !== 'undefined' ? localStorage.getItem('opsValidation') : null
    if (p) setPlan(JSON.parse(p))
    if (v) setValidation(JSON.parse(v))
    if (o) setRuntimeOps(JSON.parse(o))
    if (ov) setOpsValidation(JSON.parse(ov))
  }, [])

  const handlePlay = () => {
    router.push('/play')
  }

  return (
    <div className="home-container">
      {plan && (
        <section className="generator-section">
          <h2 className="generator-title">Preview</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <PhaserPreview plan={plan} width={800} height={480} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link href="/" className="nav-btn">← Back</Link>
            <button className={`nav-btn primary`} onClick={handlePlay}>
              Generate & Play
            </button>
          </div>
        </section>
      )}

      <section className="generator-section">
        <h2 className="generator-title">Composition Plan</h2>
        {!plan ? (
          <div>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div><strong>Title:</strong> {plan.title}</div>
              {validation && (
                <div>
                  <strong>Plan Status:</strong> {validation.ok ? 'Valid ✅' : 'Invalid ❌'}
                  {validation.errors.length > 0 && (
                    <ul style={{ color: '#b91c1c', marginTop: '0.5rem', marginLeft: '1rem' }}>
                      {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                  {validation.warnings.length > 0 && (
                    <ul style={{ color: '#92400e', marginTop: '0.5rem', marginLeft: '1rem' }}>
                      {validation.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  )}
                </div>
              )}
              {opsValidation && (
                <div>
                  <strong>RuntimeOps Status:</strong> {opsValidation.ok ? 'Valid ✅' : 'Invalid ❌'}
                  {opsValidation.errors.length > 0 && (
                    <ul style={{ color: '#b91c1c', marginTop: '0.5rem', marginLeft: '1rem' }}>
                      {opsValidation.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                  {opsValidation.warnings.length > 0 && (
                    <ul style={{ color: '#92400e', marginTop: '0.5rem', marginLeft: '1rem' }}>
                      {opsValidation.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  )}
                </div>
              )}
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
    </div>
  )
}
