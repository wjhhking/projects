'use client'

import { useEffect, useRef } from 'react'
import type { CompositionPlan } from '@/lib/composition'
import { CompositionPreviewAdapter } from '@/lib/runtime/previewAdapter'

interface Props {
  plan: CompositionPlan
  width?: number
  height?: number
}

export default function CompositionPreview({ plan, width = 800, height = 480 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const adapterRef = useRef<CompositionPreviewAdapter | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    adapterRef.current = new CompositionPreviewAdapter(canvasRef.current)
    return () => {
      adapterRef.current?.dispose()
      adapterRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!adapterRef.current) return
    adapterRef.current.render(plan, { maxWidth: width, maxHeight: height })
  }, [plan, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px`, border: '4px solid #333', background: '#0b1020', imageRendering: 'pixelated' as any }}
    />
  )
}
