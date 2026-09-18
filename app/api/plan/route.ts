import { NextResponse } from 'next/server'
import { DEFAULT_DEFENCIAL, detectIntent, evaluateDefencial } from '@/lib/defencial'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    if (typeof prompt !== 'string' || !prompt.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })

    const intent = detectIntent(prompt.trim())
    const defencial = evaluateDefencial(intent, DEFAULT_DEFENCIAL)
    return NextResponse.json({
      plan: {
        chain: 'Base',
        intent,
        defencial,
        policy: defencial,
        execution: 'preview-only',
        nextStep: defencial.allowed ? 'Prepare a provider quote after approval when required.' : 'Defencial blocked this execution request.',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Planning failed' }, { status: 500 })
  }
}
