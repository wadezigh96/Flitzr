import { NextResponse } from 'next/server'
import { normalizeWallet } from '@/lib/execution'
import { readSession } from '@/lib/auth'
import { executionStore } from '@/lib/ledger'

function sessionFromRequest(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('flitzr_session='))?.slice('flitzr_session='.length)
  return readSession(token)
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const executionId = url.searchParams.get('executionId')
    const walletAddress = normalizeWallet(url.searchParams.get('walletAddress'))
    if (!executionId || !walletAddress) return NextResponse.json({ error: 'executionId and walletAddress are required.' }, { status: 400 })
    const session = sessionFromRequest(request)
    if (!session || session.address.toLowerCase() !== walletAddress) return NextResponse.json({ error: 'Wallet authentication required.' }, { status: 401 })
    const execution = await executionStore.get(executionId)
    if (!execution) return NextResponse.json({ error: 'Execution not found.' }, { status: 404 })
    if (execution.ownerWallet !== walletAddress) return NextResponse.json({ error: 'Execution belongs to a different wallet.' }, { status: 403 })
    return NextResponse.json({ execution, audit: await executionStore.getAudit(executionId) })
  } catch {
    return NextResponse.json({ error: 'Could not load execution audit.' }, { status: 500 })
  }
}
