import { NextResponse } from 'next/server'
import { normalizeWallet } from '@/lib/execution'
import { executionStore } from '@/lib/ledger'
import { requirePrivyWallet } from '@/lib/privy'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const executionId = url.searchParams.get('executionId')
    const walletAddress = normalizeWallet(url.searchParams.get('walletAddress'))
    if (!executionId || !walletAddress) {
      return NextResponse.json({ error: 'executionId and walletAddress are required.' }, { status: 400 })
    }
    if (!await requirePrivyWallet(request, walletAddress)) {
      return NextResponse.json({ error: 'Authenticate the connected wallet with Privy first.' }, { status: 401 })
    }
    const execution = await executionStore.get(executionId)
    if (!execution) return NextResponse.json({ error: 'Execution not found.' }, { status: 404 })
    if (execution.ownerWallet !== walletAddress) return NextResponse.json({ error: 'Execution belongs to a different wallet.' }, { status: 403 })
    return NextResponse.json({ execution, audit: await executionStore.getAudit(executionId) })
  } catch {
    return NextResponse.json({ error: 'Could not load execution audit.' }, { status: 500 })
  }
}
