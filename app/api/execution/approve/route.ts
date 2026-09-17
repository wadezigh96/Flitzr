import { NextResponse } from 'next/server'
import { normalizeWallet, transition } from '@/lib/execution'
import { executionStore } from '@/lib/ledger'

export async function POST(request: Request) {
  try {
    const { executionId, approval, walletAddress } = await request.json()
    if (typeof executionId !== 'string' || !executionId) return NextResponse.json({ error: 'executionId is required' }, { status: 400 })
    if (approval !== true) return NextResponse.json({ error: 'Explicit approval is required.' }, { status: 400 })
    const ownerWallet = normalizeWallet(walletAddress)
    if (!ownerWallet) return NextResponse.json({ error: 'A valid Base wallet is required for approval.' }, { status: 400 })
    const execution = executionStore.get(executionId)
    if (!execution) return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    if (execution.ownerWallet !== ownerWallet) return NextResponse.json({ error: 'This execution belongs to a different wallet.' }, { status: 403 })
    const approved = transition(execution, 'approved')
    executionStore.update(approved)
    return NextResponse.json({ execution: approved, previewOnly: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Approval failed' }, { status: 409 })
  }
}
