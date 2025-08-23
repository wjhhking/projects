import { CompositionPlan } from '@/lib/composition/types'
import { metaTemplates } from '@/lib/composition/inventory'
import { validateCompositionPlan } from '@/lib/composition/validate'
import { validateRuntimeOps } from '@/lib/composition/validateOps'
import type { RuntimeOps } from '@/lib/composition/runtimeOps'

function compactInventory() {
  return Object.values(metaTemplates).map(t => ({ id: t.id, category: t.category }))
}

function planSchemaSnippet() {
  return `CompositionPlan { planVersion: '1.0'; title: string; targetRuntime: 'phaser'; templates: Array<{ id: string; params?: Record<string, string|number|boolean|{x:number;y:number}|string[]> }>; assets?: any; controls?: any; conflictPolicy?: any; }`
}

function runtimeOpsSchemaSnippet() {
  return `RuntimeOps { world: { tileSize: number; width: number; height: number; wrapEdges?: boolean }, systems: Array<{ type: string; params?: Record<string, any> }>, entities?: Array<{ id: string; name?: string; components: Array<Record<string, any>> }> }`
}

function buildSystemPrompt() {
  return [
    'You are a veteran arcade game designer.',
    'Return ONLY a JSON object with two top-level fields: plan and runtimeOps.',
    'Use only known meta-template IDs from the inventory for plan.templates.',
    'Emit runtimeOps using the provided RuntimeOps schema. Do not invent fields.',
    'Pick stable, playable parameter values within safe ranges.',
    'Do not include comments or extra text outside the JSON.'
  ].join(' ')
}

function buildUserPrompt(userPrompt: string) {
  const inventory = compactInventory()
  const constraints = {
    grid: 'grid width/height ≤ 30, tileSize between 8 and 32',
    timing: 'stepHz or stepPerSecond between 4 and 12',
    safety: 'avoid extreme speeds; keep values integers when sensible'
  }
  return JSON.stringify({
    instruction: 'Generate BOTH a CompositionPlan and matching RuntimeOps for preview/playback. Keep the response small (≤ 800 tokens).',
    userPrompt,
    schemas: { plan: planSchemaSnippet(), runtimeOps: runtimeOpsSchemaSnippet() },
    constraints,
    inventory
  })
}

function buildSlimUserPrompt(userPrompt: string) {
  return JSON.stringify({
    instruction: 'Return ONLY JSON with {plan, runtimeOps}. Keep it minimal and under 400 tokens. Use 3–6 templates max. Prefer small integers.',
    userPrompt,
    schemas: { plan: planSchemaSnippet(), runtimeOps: runtimeOpsSchemaSnippet() }
  })
}

function tryParseJson(text: string): any | null {
  try { return JSON.parse(text) } catch { return null }
}

function extractJson(text: string): any {
  const direct = tryParseJson(text)
  if (direct) return direct
  const fenceStart = text.indexOf('```')
  const fenceEnd = text.lastIndexOf('```')
  if (fenceStart !== -1 && fenceEnd > fenceStart) {
    const inside = text.slice(fenceStart + 3, fenceEnd).trim()
    const firstNewline = inside.indexOf('\n')
    const maybeLang = firstNewline !== -1 ? inside.slice(0, firstNewline).trim() : ''
    const body = (maybeLang && /^[a-zA-Z]+$/.test(maybeLang)) ? inside.slice(firstNewline + 1) : inside
    const fenced = tryParseJson(body)
    if (fenced) return fenced
  }
  const braceStart = text.indexOf('{')
  const braceEnd = text.lastIndexOf('}')
  if (braceStart >= 0 && braceEnd > braceStart) {
    const slice = text.slice(braceStart, braceEnd + 1)
    const parsed = tryParseJson(slice)
    if (parsed) return parsed
  }
  console.error('[compose] Failed to parse JSON. Raw content (first 1000 chars):', text.slice(0, 1000))
  throw new Error('LLM did not return valid JSON')
}

async function callOpenAI(messages: Array<{ role: 'system'|'user'; content: string }>): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')
  const model = process.env.OPENAI_MODEL || 'gpt-5'
  const body = { model, messages, response_format: { type: 'json_object' }, max_completion_tokens: 20000 }
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!resp.ok) {
    const errText = await resp.text()
    console.error('[compose] OpenAI error:', resp.status, errText)
    throw new Error(`OpenAI error: ${resp.status} ${errText}`)
  }
  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content ?? ''
  const finish = data?.choices?.[0]?.finish_reason
  if (!text) {
    console.warn('[compose] Empty content from OpenAI. finish_reason:', finish, 'Full response:', JSON.stringify(data).slice(0, 1200))
  } else {
    console.debug('[compose] Raw content (first 400 chars):', text.slice(0, 400))
  }
  return extractJson(text)
}

export async function generatePlanAndOpsViaLLM(userPrompt: string) {
  const system = buildSystemPrompt()
  const full = buildUserPrompt(userPrompt)

  let raw: any
  try {
    raw = await callOpenAI([
      { role: 'system', content: system },
      { role: 'user', content: full }
    ])
  } catch (e) {
    console.warn('[compose] First attempt failed, trying slim prompt:', (e as Error).message)
    const slim = buildSlimUserPrompt(userPrompt)
    raw = await callOpenAI([
      { role: 'system', content: system },
      { role: 'user', content: slim }
    ])
  }

  let plan = raw.plan as CompositionPlan
  let runtimeOps = raw.runtimeOps as RuntimeOps

  if (plan && !plan.planVersion) plan.planVersion = '1.0' as any
  if (plan && !plan.targetRuntime) (plan as any).targetRuntime = 'phaser'

  let planValidation = plan ? validateCompositionPlan(plan) : { ok: false, errors: ['missing plan'], warnings: [] }
  let opsValidation = runtimeOps ? validateRuntimeOps(runtimeOps) : { ok: false, errors: ['missing runtimeOps'], warnings: [] }

  if (planValidation.ok && opsValidation.ok) {
    return { plan, planValidation, runtimeOps, opsValidation, repaired: false }
  }

  const repairMsg = JSON.stringify({
    instruction: 'Repair the JSON so that plan and runtimeOps pass validation. Return ONLY JSON with {plan, runtimeOps}. Keep under 600 tokens.',
    planValidationErrors: planValidation.errors,
    opsValidationErrors: opsValidation.errors,
    lastJson: raw
  })

  raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: buildSlimUserPrompt(userPrompt) },
    { role: 'user', content: repairMsg }
  ])

  plan = raw.plan as CompositionPlan
  runtimeOps = raw.runtimeOps as RuntimeOps
  if (plan && !plan.planVersion) plan.planVersion = '1.0' as any
  if (plan && !plan.targetRuntime) (plan as any).targetRuntime = 'phaser'
  planValidation = plan ? validateCompositionPlan(plan) : { ok: false, errors: ['missing plan'], warnings: [] }
  opsValidation = runtimeOps ? validateRuntimeOps(runtimeOps) : { ok: false, errors: ['missing runtimeOps'], warnings: [] }

  return { plan, planValidation, runtimeOps, opsValidation, repaired: true }
}
