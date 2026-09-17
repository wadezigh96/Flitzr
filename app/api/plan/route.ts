import { NextResponse } from 'next/server'
import { DEFAULT_POLICY, detectIntent, evaluatePolicy } from '@/lib/policy'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    if (typeof prompt !== 'string' || !prompt.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })

    const intent = detectIntent(prompt.trim())
    const policy = evaluatePolicy(intent, DEFAULT_POLICY)
    return NextResponse.json({
      plan: {
        chain: 'Base',
        intent,
        policy,
        execution: 'preview-only',
        nextStep: policy.allowed ? 'Prepare a provider quote after approval when required.' : 'Policy blocked this execution request.',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Planning failed' }, { status: 500 })
  }
}
