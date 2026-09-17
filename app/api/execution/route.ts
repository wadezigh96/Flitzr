import { NextResponse } from 'next/server'
import { createExecution, normalizeWallet, transition } from '@/lib/execution'
import { DEFAULT_POLICY, detectIntent, evaluatePolicy } from '@/lib/policy'
import { executionStore } from '@/lib/ledger'

export async function POST(request: Request) {
  try {
    const { prompt, walletAddress } = await request.json()
    if (typeof prompt !== 'string' || !prompt.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    const ownerWallet = normalizeWallet(walletAddress)
    if (!ownerWallet) return NextResponse.json({ error: 'Connect a valid Base wallet before creating an execution.' }, { status: 400 })

    const intent = detectIntent(prompt.trim())
    const policy = evaluatePolicy(intent, DEFAULT_POLICY)
    if (intent.amountUsd === null) return NextResponse.json({ error: 'A USD amount is required before creating an execution.' }, { status: 400 })
    if (!policy.allowed) return NextResponse.json({ policy, execution: null }, { status: 403 })

    const execution = createExecution({
      intent: intent.type,
      amountUsd: intent.amountUsd,
      ownerWallet,
      provider: intent.type === 'dca' || intent.type === 'limit' ? 'definitive' : 'uniswap',
    })
    const next = policy.needsApproval ? transition(execution, 'awaiting_approval') : transition(execution, 'quoted')
    executionStore.put(next)
    return NextResponse.json({ policy, execution: next, previewOnly: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Execution planning failed' }, { status: 500 })
  }
}
