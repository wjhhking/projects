import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(req: NextRequest) {
  try {
    const base = process.cwd()
    const componentPath = join(base, 'tmp/tmpPhaserPreview.tsx')
    
    // Check if the generated component file exists
    if (!existsSync(componentPath)) {
      return NextResponse.json({ componentCode: null }, { status: 200 })
    }
    
    // Read the component code
    const componentCode = await readFile(componentPath, 'utf-8')
    
    return NextResponse.json({ 
      componentCode,
      generatedAt: new Date().toISOString()
    }, { status: 200 })
  } catch (error) {
    console.error('Failed to read generated component:', error)
    return NextResponse.json({ error: 'Failed to read generated component' }, { status: 500 })
  }
}
