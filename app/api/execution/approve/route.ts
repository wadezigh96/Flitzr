import { NextResponse } from 'next/server'
import { normalizeWallet, transition } from '@/lib/execution'
import { auditEvent } from '@/lib/audit'
import { executionStore } from '@/lib/ledger'
import { readSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { executionId, approval, walletAddress } = await request.json()
    if (typeof executionId !== 'string' || !executionId) return NextResponse.json({ error: 'executionId is required' }, { status: 400 })
    if (approval !== true) return NextResponse.json({ error: 'Explicit approval is required.' }, { status: 400 })
    const ownerWallet = normalizeWallet(walletAddress)
    if (!ownerWallet) return NextResponse.json({ error: 'A valid Base wallet is required for approval.' }, { status: 400 })
    const cookie = request.headers.get('cookie') || ''
    const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('flitzr_session='))?.slice('flitzr_session='.length)
    const session = readSession(token)
    if (!session || session.address.toLowerCase() !== ownerWallet) return NextResponse.json({ error: 'Authenticate the connected wallet before approving an execution.' }, { status: 401 })
    const execution = await executionStore.get(executionId)
    if (!execution) return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
    if (execution.ownerWallet !== ownerWallet) return NextResponse.json({ error: 'This execution belongs to a different wallet.' }, { status: 403 })
    if (execution.state === 'approved') return NextResponse.json({ execution, previewOnly: true, idempotentReplay: true })
    const approved = transition(execution, 'approved')
    await executionStore.update(approved)
    await executionStore.addAudit(auditEvent(approved.id, 'approved', { wallet: ownerWallet }))
    return NextResponse.json({ execution: approved, previewOnly: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Approval failed' }, { status: 409 })
  }
}
