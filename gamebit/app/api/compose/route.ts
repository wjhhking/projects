import { NextRequest, NextResponse } from 'next/server'
import { snakePlan, validateCompositionPlan } from '@/lib/composition'
import { generatePlanAndOpsViaLLM } from '@/lib/ai/compose'
import { buildRuntimeOps } from '@/lib/composition/builder'
import { validateRuntimeOps } from '@/lib/composition/validateOps'
import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    // Prefer local tmp files for debugging if present
    try {
      const base = process.cwd()
      const planRaw = await readFile(join(base, 'tmp/plan.json'), 'utf-8')
      const opsRaw = await readFile(join(base, 'tmp/runtimeOps.json'), 'utf-8')
      const plan = JSON.parse(planRaw)
      const runtimeOps = JSON.parse(opsRaw)
      const validation = validateCompositionPlan(plan)
      const opsValidation = validateRuntimeOps(runtimeOps)
      return NextResponse.json({ plan, validation, runtimeOps, opsValidation }, { status: 200 })
    } catch {}

    const { prompt } = await req.json()

    const hasKey = !!process.env.OPENAI_API_KEY
    if (hasKey) {
      try {
        const { plan, planValidation, runtimeOps, opsValidation } = await generatePlanAndOpsViaLLM(prompt)
        // Persist to tmp
        try {
          const base = process.cwd()
          await writeFile(join(base, 'tmp/plan.json'), JSON.stringify(plan, null, 2))
          await writeFile(join(base, 'tmp/runtimeOps.json'), JSON.stringify(runtimeOps, null, 2))
        } catch {}
        return NextResponse.json({ plan, validation: planValidation, runtimeOps, opsValidation }, { status: 200 })
      } catch (e) {
        console.error('LLM compose failed, falling back to stub:', e)
      }
    }

    const plan = snakePlan
    const validation = validateCompositionPlan(plan)
    const runtimeOps = buildRuntimeOps(plan)
    const opsValidation = validateRuntimeOps(runtimeOps)
    try {
      const base = process.cwd()
      await writeFile(join(base, 'tmp/plan.json'), JSON.stringify(plan, null, 2))
      await writeFile(join(base, 'tmp/runtimeOps.json'), JSON.stringify(runtimeOps, null, 2))
    } catch {}
    return NextResponse.json({ plan, validation, runtimeOps, opsValidation }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
