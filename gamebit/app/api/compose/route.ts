import { NextRequest, NextResponse } from 'next/server'
import { snakePlan } from '@/lib/composition'
import { generatePlanAndOpsViaLLM } from '@/lib/ai/compose'
import { buildRuntimeOps } from '@/lib/composition/builder'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    const hasKey = !!process.env.OPENAI_API_KEY
    if (hasKey) {
      try {
        const { plan, runtimeOps } = await generatePlanAndOpsViaLLM(prompt)
        
        // Store to tmp for debugging
        try {
          const base = process.cwd()
          await writeFile(join(base, 'tmp/plan.json'), JSON.stringify(plan, null, 2))
          await writeFile(join(base, 'tmp/runtimeOps.json'), JSON.stringify(runtimeOps, null, 2))
          console.log('[compose] Stored plan and runtimeOps to tmp/ for debugging')
        } catch (tmpError) {
          console.warn('[compose] Failed to write tmp files:', tmpError)
        }
        
        return NextResponse.json({ plan, runtimeOps }, { status: 200 })
      } catch (e) {
        console.error('LLM compose failed, falling back to stub:', e)
      }
    }

    const plan = snakePlan
    const runtimeOps = buildRuntimeOps(plan)
    
    // Store fallback to tmp for debugging
    try {
      const base = process.cwd()
      await writeFile(join(base, 'tmp/plan.json'), JSON.stringify(plan, null, 2))
      await writeFile(join(base, 'tmp/runtimeOps.json'), JSON.stringify(runtimeOps, null, 2))
      console.log('[compose] Stored fallback plan and runtimeOps to tmp/ for debugging')
    } catch (tmpError) {
      console.warn('[compose] Failed to write tmp files:', tmpError)
    }
    
    return NextResponse.json({ plan, runtimeOps }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
