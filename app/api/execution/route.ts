import { NextResponse } from 'next/server'
import { createExecution, normalizeWallet, transition } from '@/lib/execution'
import { DEFAULT_POLICY, detectIntent, evaluatePolicy } from '@/lib/policy'
import { auditEvent } from '@/lib/audit'
import { executionStore } from '@/lib/ledger'
import { readSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { prompt, walletAddress } = await request.json()
    if (typeof prompt !== 'string' || !prompt.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    const ownerWallet = normalizeWallet(walletAddress)
    if (!ownerWallet) return NextResponse.json({ error: 'Connect a valid Base wallet before creating an execution.' }, { status: 400 })
    const cookie = request.headers.get('cookie') || ''
    const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('flitzr_session='))?.slice('flitzr_session='.length)
    const session = readSession(token)
    if (!session || session.address.toLowerCase() !== ownerWallet) return NextResponse.json({ error: 'Authenticate the connected wallet before creating an execution.' }, { status: 401 })

    const idempotencyKey = request.headers.get('Idempotency-Key')?.trim()
    if (idempotencyKey) {
      if (idempotencyKey.length < 8 || idempotencyKey.length > 128) return NextResponse.json({ error: 'Idempotency-Key must be 8-128 characters.' }, { status: 400 })
      const existing = executionStore.getByIdempotencyKey(idempotencyKey, ownerWallet)
      if (existing) return NextResponse.json({ policy: null, execution: existing, previewOnly: true, idempotentReplay: true })
    }

    const intent = detectIntent(prompt.trim())
    const policy = evaluatePolicy(intent, DEFAULT_POLICY)
    executionStore.addAudit(auditEvent('pending', 'policy_checked', { wallet: ownerWallet, amountUsd: intent.amountUsd ?? 0, intent: intent.type }))
    if (intent.amountUsd === null) return NextResponse.json({ error: 'A USD amount is required before creating an execution.' }, { status: 400 })
    if (!policy.allowed) return NextResponse.json({ policy, execution: null }, { status: 403 })

    const execution = createExecution({ intent: intent.type, amountUsd: intent.amountUsd, ownerWallet, provider: intent.type === 'dca' || intent.type === 'limit' ? 'definitive' : 'uniswap' })
    const next = policy.needsApproval ? transition(execution, 'awaiting_approval') : transition(execution, 'quoted')
    executionStore.put(next, idempotencyKey)
    executionStore.addAudit(auditEvent(next.id, 'planned', { wallet: ownerWallet, amountUsd: next.amountUsd, provider: next.provider ?? 'unknown' }))
    if (policy.needsApproval) executionStore.addAudit(auditEvent(next.id, 'approval_requested', { thresholdUsd: DEFAULT_POLICY.approvalThresholdUsd }))
    return NextResponse.json({ policy, execution: next, previewOnly: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Execution planning failed' }, { status: 500 })
  }
}
