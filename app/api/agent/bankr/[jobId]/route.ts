import { NextResponse } from 'next/server'
import { bankrJob } from '@/lib/bankr'
import { requirePrivyWallet } from '@/lib/privy'
import { normalizeWallet } from '@/lib/execution'

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params
    const wallet = normalizeWallet(new URL(request.url).searchParams.get('walletAddress'))
    if (!wallet) return NextResponse.json({ error: 'A valid Base wallet is required.' }, { status: 400 })
    if (!await requirePrivyWallet(request, wallet)) return NextResponse.json({ error: 'Authenticate the connected wallet with Privy first.' }, { status: 401 })
    if (!jobId) return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 })
    const result = await bankrJob(jobId) as Record<string, unknown>
    const status = typeof result.status === 'string' ? result.status : typeof result.state === 'string' ? result.state : 'processing'
    return NextResponse.json({ provider: 'bankr', jobId, status, result })
  } catch (error) {
    return NextResponse.json({ provider: 'bankr', status: 'failed', error: error instanceof Error ? error.message : 'Bankr job request failed' }, { status: 500 })
  }
}
