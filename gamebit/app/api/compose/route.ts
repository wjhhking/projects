import { NextRequest, NextResponse } from 'next/server'
import { snakePlan, validateCompositionPlan } from '@/lib/composition'
import { generatePlanAndOpsViaLLM } from '@/lib/ai/compose'
import { buildRuntimeOps } from '@/lib/composition/builder'
import { validateRuntimeOps } from '@/lib/composition/validateOps'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    const hasKey = !!process.env.OPENAI_API_KEY
    if (hasKey) {
      try {
        const { plan, planValidation, runtimeOps, opsValidation } = await generatePlanAndOpsViaLLM(prompt)
        return NextResponse.json({ plan, validation: planValidation, runtimeOps, opsValidation }, { status: 200 })
      } catch (e) {
        console.error('LLM compose failed, falling back to stub:', e)
      }
    }

    const plan = snakePlan
    const validation = validateCompositionPlan(plan)
    const runtimeOps = buildRuntimeOps(plan)
    const opsValidation = validateRuntimeOps(runtimeOps)
    return NextResponse.json({ plan, validation, runtimeOps, opsValidation }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
