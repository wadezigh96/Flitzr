import { NextResponse } from 'next/server'
import { bankrPrompt } from '@/lib/bankr'
import { requirePrivyWallet } from '@/lib/privy'
import { DEFAULT_DEFENCIAL, detectIntent, evaluateDefencial } from '@/lib/defencial'
import { normalizeWallet } from '@/lib/execution'

export async function POST(request: Request) {
  try {
    const { prompt, walletAddress } = await request.json()

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const wallet = normalizeWallet(walletAddress)
    if (!wallet) {
      return NextResponse.json({ error: 'A valid Base wallet is required.' }, { status: 400 })
    }

    const authenticated = await requirePrivyWallet(request, wallet)
    if (!authenticated) {
      return NextResponse.json({ error: 'Authenticate the connected wallet with Privy first.' }, { status: 401 })
    }

    const intent = detectIntent(prompt.trim())
    const defencial = evaluateDefencial(intent, DEFAULT_DEFENCIAL)

    if (!defencial.allowed) {
      return NextResponse.json({ provider: 'bankr', defencial, status: 'blocked' }, { status: 403 })
    }

    if (defencial.needsApproval) {
      return NextResponse.json({
        provider: 'bankr',
        defencial,
        status: 'approval_required',
        message: 'Defencial approval is required before sending this command to Bankr.',
      }, { status: 403 })
    }

    const result = await bankrPrompt(prompt.trim())
    const raw = result as Record<string, unknown>
    const jobId =
      typeof raw.jobId === 'string' ? raw.jobId :
      typeof raw.job_id === 'string' ? raw.job_id :
      typeof raw.id === 'string' ? raw.id :
      null

    return NextResponse.json({
      provider: 'bankr',
      defencial,
      status: jobId ? 'processing' : 'submitted',
      jobId,
      result,
    })
  } catch (error) {
    return NextResponse.json({
      provider: 'bankr',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Bankr agent request failed',
    }, { status: 500 })
  }
}
