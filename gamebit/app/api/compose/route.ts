import { NextRequest, NextResponse } from 'next/server'
import { snakePlan } from '@/lib/composition'
import { generateRuntimeOpsViaLLM, generatePhaserComponentViaLLM } from '@/lib/ai/compose'
import { buildRuntimeOps } from '@/lib/composition/builder'
import { writeFile, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const { prompt, forceGenerate } = await req.json()

    // 🎯 HACK: Check if tmp files already exist and use them directly (unless forced to regenerate)
    const base = process.cwd()
    const runtimeOpsPath = join(base, 'tmp/runtimeOps.json')
    const componentPath = join(base, 'tmp/tmpPhaserPreview.tsx')
    
    if (!forceGenerate && existsSync(runtimeOpsPath) && existsSync(componentPath)) {
      console.log('🚀 [HACK] Using existing tmp files instead of LLM generation!')
      try {
        const runtimeOpsContent = await readFile(runtimeOpsPath, 'utf-8')
        const runtimeOps = JSON.parse(runtimeOpsContent)
        
        console.log('✅ [HACK] Successfully loaded existing runtimeOps and component from tmp/')
        console.log(`📋 [HACK] Game: ${runtimeOps.metadata?.title || 'Untitled'}`)
        console.log(`🎮 [HACK] Prompt: ${prompt} (ignored - using cached files)`)
        console.log('💡 [HACK] To force regeneration, delete tmp files or use forceGenerate=true')
        
        return NextResponse.json({ runtimeOps, hasGeneratedComponent: true }, { status: 200 })
      } catch (hackError) {
        console.warn('⚠️  [HACK] Failed to read tmp files, falling back to normal generation:', hackError)
      }
    } else {
      if (forceGenerate) {
        console.log('🔄 [FORCE] Forced regeneration requested, bypassing tmp files...')
      } else {
        console.log('🔄 [NORMAL] tmp files not found, proceeding with LLM generation...')
      }
    }

    const hasKey = !!process.env.OPENAI_API_KEY
    if (hasKey) {
      try {
        const runtimeOps = await generateRuntimeOpsViaLLM(prompt)
        
        // Generate tmpPhaserPreview.tsx component using LLM
        console.log('[compose] Generating tmpPhaserPreview.tsx component via LLM...')
        const componentCode = await generatePhaserComponentViaLLM(runtimeOps)
        console.log('[compose] Successfully generated tmpPhaserPreview.tsx component via LLM')
        
        // Store to tmp for debugging purposes only
        try {
          const base = process.cwd()
          await writeFile(join(base, 'tmp/runtimeOps.json'), JSON.stringify(runtimeOps, null, 2))
          await writeFile(join(base, 'tmp/tmpPhaserPreview.tsx'), componentCode)
          console.log('[compose] Stored LLM-generated files to tmp/')
        } catch (tmpError) {
          console.warn('[compose] Failed to write debug tmp files:', tmpError)
        }
        
        return NextResponse.json({ runtimeOps, hasGeneratedComponent: true }, { status: 200 })
      } catch (e) {
        console.error('LLM compose failed, falling back to stub:', e)
      }
    }

    // Use fallback snake game
    const plan = snakePlan
    const runtimeOps = buildRuntimeOps(plan)
    
    // Add metadata for consistency
    runtimeOps.metadata = {
      title: plan.title,
      description: plan.description || 'Classic snake game',
      generatedAt: new Date().toISOString()
    }
    
    // Component generation is required - fail if no API key
    if (!hasKey) {
      return NextResponse.json({ 
        error: 'Component generation failed: OpenAI API key is required' 
      }, { status: 500 })
    }
    
    // Generate tmpPhaserPreview.tsx component for fallback case too
    console.log('[compose] Generating tmpPhaserPreview.tsx component for fallback via LLM...')
    const componentCode = await generatePhaserComponentViaLLM(runtimeOps)
    console.log('[compose] Successfully generated tmpPhaserPreview.tsx component for fallback via LLM')
    
    // Store fallback to tmp for debugging purposes only
    try {
      const base = process.cwd()
      await writeFile(join(base, 'tmp/runtimeOps.json'), JSON.stringify(runtimeOps, null, 2))
      await writeFile(join(base, 'tmp/tmpPhaserPreview.tsx'), componentCode)
      console.log('[compose] Stored fallback files to tmp/')
    } catch (tmpError) {
      console.warn('[compose] Failed to write debug tmp files:', tmpError)
    }
    
    return NextResponse.json({ runtimeOps, hasGeneratedComponent: true }, { status: 200 })
  } catch (err) {
    console.error('[compose] Compose API error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: `Component generation failed: ${errorMessage}` 
    }, { status: 500 })
  }
}
