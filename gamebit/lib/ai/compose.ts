import type { RuntimeOps } from '@/lib/composition/runtimeOps'



function runtimeOpsSchemaSnippet() {
  return `RuntimeOps { world: { tileSize: number; width: number; height: number; wrapEdges?: boolean }, systems: Array<{ type: string; params?: Record<string, any> }>, entities?: Array<{ id: string; name?: string; components: Array<Record<string, any>> }> }`
}

function buildSystemPrompt() {
  return [
    'You are a veteran arcade game designer.',
    'Return ONLY a RuntimeOps JSON object directly (not wrapped in another object).',
    'Use the RuntimeOps schema: { world: { tileSize, width, height, wrapEdges? }, systems: [{ type, params? }], entities?: [{ id, name?, components }] }.',
    'Pick stable, playable parameter values within safe ranges.',
    'Include a title and description in the RuntimeOps metadata if needed.',
    'Do not include comments or extra text outside the JSON.'
  ].join(' ')
}

function buildUserPrompt(userPrompt: string) {
  const constraints = {
    grid: 'grid width/height ≤ 30, tileSize between 8 and 32',
    timing: 'stepHz or stepPerSecond between 4 and 12',
    safety: 'avoid extreme speeds; keep values integers when sensible'
  }
  return JSON.stringify({
    instruction: 'Generate a RuntimeOps object for game preview/playback. Keep the response small (≤ 600 tokens).',
    userPrompt,
    schema: runtimeOpsSchemaSnippet(),
    constraints,
    examples: {
      snake: 'systems like gridInput, snakeMovement, foodSpawner, collisionDetection',
      tetris: 'systems like tetrisCore, lineClear, gravityDrop, inputAxis',
      breakout: 'systems like paddleCore, ballCore, brickFieldCore'
    }
  })
}

function buildSlimUserPrompt(userPrompt: string) {
  return JSON.stringify({
    instruction: 'Return ONLY a RuntimeOps JSON object. Keep it minimal and under 300 tokens. Use 3–6 systems max. Prefer small integers.',
    userPrompt,
    schema: runtimeOpsSchemaSnippet()
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

export async function generateRuntimeOpsViaLLM(userPrompt: string) {
  const system = buildSystemPrompt()
  const full = buildUserPrompt(userPrompt)

  let runtimeOps: any
  try {
    runtimeOps = await callOpenAI([
      { role: 'system', content: system },
      { role: 'user', content: full }
    ])
  } catch (e) {
    console.warn('[compose] First attempt failed, trying slim prompt:', (e as Error).message)
    const slim = buildSlimUserPrompt(userPrompt)
    runtimeOps = await callOpenAI([
      { role: 'system', content: system },
      { role: 'user', content: slim }
    ])
  }

  // Validate basic structure
  if (!runtimeOps.world || !runtimeOps.systems) {
    throw new Error('Invalid RuntimeOps: missing world or systems')
  }

  // Add metadata for display purposes if not present
  if (!runtimeOps.metadata) {
    runtimeOps.metadata = {
      title: `Game from "${userPrompt.slice(0, 50)}${userPrompt.length > 50 ? '...' : ''}"`,
      description: userPrompt,
      generatedAt: new Date().toISOString()
    }
  }

  return runtimeOps as RuntimeOps
}

function buildComponentSystemPrompt() {
  return [
    'You are an expert React and Phaser developer.',
    'Generate a complete React component that renders a game using Phaser based on RuntimeOps data.',
    'The component should be named TmpPhaserPreview and export it as default.',
    'Use TypeScript and include proper imports.',
    'The component should accept props: { runtimeOps: RuntimeOps, width?: number, height?: number }.',
    'Create a fully functional game implementation that interprets the RuntimeOps systems and renders accordingly.',
    'Use modern React hooks (useEffect, useRef) and handle cleanup properly.',
    'Include proper game loop, input handling, and rendering based on the systems and entities.',
    'Make it playable and responsive to user input.',
    'Return ONLY the complete TypeScript React component code without markdown code blocks or extra text.'
  ].join(' ')
}

function buildComponentUserPrompt(runtimeOps: RuntimeOps) {
  return JSON.stringify({
    instruction: 'Generate a complete React component that renders this game using Phaser. Make it fully playable.',
    runtimeOps,
    requirements: {
      componentName: 'TmpPhaserPreview',
      exportDefault: true,
      typescript: true,
      framework: 'React with Phaser',
      features: 'Game loop, input handling, rendering, collision detection based on systems'
    },
    structure: {
      imports: 'Include React imports and Phaser dynamic import',
      component: 'Functional component with proper props typing',
      game: 'Initialize Phaser game, handle systems and entities',
      cleanup: 'Proper cleanup in useEffect'
    }
  })
}

async function callOpenAIForComponent(messages: Array<{ role: 'system'|'user'; content: string }>): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')
  const model = process.env.OPENAI_MODEL || 'gpt-5'
  const body = { 
    model, 
    messages, 
    max_completion_tokens: 20000
  }
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
    throw new Error('Empty response from OpenAI')
  }
  return text
}

export async function generatePhaserComponentViaLLM(runtimeOps: RuntimeOps): Promise<string> {
  const system = buildComponentSystemPrompt()
  const user = buildComponentUserPrompt(runtimeOps)

  try {
    const componentCode = await callOpenAIForComponent([
      { role: 'system', content: system },
      { role: 'user', content: user }
    ])
    
    // Clean up the response - remove markdown code blocks if present
    let cleanCode = componentCode.trim()
    if (cleanCode.startsWith('```typescript') || cleanCode.startsWith('```tsx') || cleanCode.startsWith('```ts')) {
      const lines = cleanCode.split('\n')
      lines.shift() // Remove first line with ```
      if (lines[lines.length - 1].trim() === '```') {
        lines.pop() // Remove last line with ```
      }
      cleanCode = lines.join('\n')
    } else if (cleanCode.startsWith('```')) {
      const firstNewline = cleanCode.indexOf('\n')
      if (firstNewline !== -1) {
        cleanCode = cleanCode.substring(firstNewline + 1)
      }
      if (cleanCode.endsWith('```')) {
        cleanCode = cleanCode.substring(0, cleanCode.lastIndexOf('```'))
      }
    }
    
    return cleanCode.trim()
  } catch (e) {
    console.error('[compose] Failed to generate Phaser component:', e)
    throw new Error(`Failed to generate Phaser component: ${(e as Error).message}`)
  }
}
