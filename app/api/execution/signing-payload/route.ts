import { NextResponse } from 'next/server'
import { executionStore } from '@/lib/ledger'
import { normalizeWallet } from '@/lib/execution'
import { requirePrivyWallet } from '@/lib/privy'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const executionId = typeof body.executionId === 'string' ? body.executionId : ''
    const walletAddress = normalizeWallet(body.walletAddress)
    if (!executionId || !walletAddress) return NextResponse.json({ error: 'executionId and a valid Base wallet are required.' }, { status: 400 })
    if (!await requirePrivyWallet(request, walletAddress)) return NextResponse.json({ error: 'Authenticate the connected wallet with Privy first.' }, { status: 401 })

    const execution = await executionStore.get(executionId)
    if (!execution) return NextResponse.json({ error: 'Execution not found.' }, { status: 404 })
    if (execution.ownerWallet !== walletAddress) return NextResponse.json({ error: 'This execution belongs to a different wallet.' }, { status: 403 })
    if (execution.state !== 'quoted') return NextResponse.json({ error: `Execution must be quoted before signing. Current state: ${execution.state}.` }, { status: 409 })
    if (execution.provider !== 'definitive') return NextResponse.json({ error: 'This signing flow currently supports Definitive Flash orders only.' }, { status: 422 })
    if (!execution.quoteId || !execution.quoteTypedData) return NextResponse.json({ error: 'This quote does not contain a signable Definitive EIP-712 payload. Request a fresh quote.' }, { status: 409 })

    return NextResponse.json({ executionId, quoteId: execution.quoteId, typedData: execution.quoteTypedData, previewOnly: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not prepare signing payload.' }, { status: 400 })
  }
}
