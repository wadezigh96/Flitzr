import { NextResponse } from 'next/server'
import { createExecution, normalizeWallet, transition } from '@/lib/execution'
import { DEFAULT_DEFENCIAL, detectIntent, evaluateDefencial } from '@/lib/defencial'
import { auditEvent } from '@/lib/audit'
import { executionStore } from '@/lib/ledger'
import { requirePrivyWallet } from '@/lib/privy'

export async function POST(request: Request) {
  try {
    const { prompt, walletAddress } = await request.json()
    if (typeof prompt !== 'string' || !prompt.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    const ownerWallet = normalizeWallet(walletAddress)
    if (!ownerWallet) return NextResponse.json({ error: 'Connect a valid Base wallet before creating an execution.' }, { status: 400 })
    if (!await requirePrivyWallet(request, ownerWallet)) return NextResponse.json({ error: 'Authenticate the connected wallet with Privy before creating an execution.' }, { status: 401 })

    const idempotencyKey = request.headers.get('Idempotency-Key')?.trim()
    if (idempotencyKey) {
      if (idempotencyKey.length < 8 || idempotencyKey.length > 128) return NextResponse.json({ error: 'Idempotency-Key must be 8-128 characters.' }, { status: 400 })
      const existing = await executionStore.getByIdempotencyKey(idempotencyKey, ownerWallet)
      if (existing) return NextResponse.json({ defencial: null, execution: existing, previewOnly: true, idempotentReplay: true })
    }

    const intent = detectIntent(prompt.trim())
    const spentTodayUsd = await executionStore.spentTodayUsd(ownerWallet)
    const defencial = evaluateDefencial(intent, DEFAULT_DEFENCIAL, { spentTodayUsd })
    if (intent.amountUsd === null) return NextResponse.json({ error: 'A USD amount is required before creating an execution.' }, { status: 400 })
    if (!defencial.allowed) return NextResponse.json({ defencial, execution: null }, { status: 403 })

    const execution = createExecution({ intent: intent.type, amountUsd: intent.amountUsd, ownerWallet, provider: intent.type === 'dca' || intent.type === 'limit' ? 'definitive' : 'uniswap' })
    const next = defencial.needsApproval ? transition(execution, 'awaiting_approval') : execution
    await executionStore.put(next, idempotencyKey)
    await executionStore.addAudit(auditEvent(next.id, 'defencial_checked', { wallet: ownerWallet, amountUsd: intent.amountUsd, intent: intent.type, spentTodayUsd }))
    await executionStore.addAudit(auditEvent(next.id, 'planned', { wallet: ownerWallet, amountUsd: next.amountUsd, provider: next.provider ?? 'unknown' }))
    if (defencial.needsApproval) await executionStore.addAudit(auditEvent(next.id, 'approval_requested', { thresholdUsd: DEFAULT_DEFENCIAL.approvalAboveUsd }))
    return NextResponse.json({ defencial, execution: next, previewOnly: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Execution planning failed' }, { status: 500 })
  }
}
