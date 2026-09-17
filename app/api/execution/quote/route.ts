import { NextResponse } from 'next/server'
import { selectProvider } from '@/lib/providers'
import { normalizeWallet, transition } from '@/lib/execution'
import { auditEvent } from '@/lib/audit'
import { executionStore } from '@/lib/ledger'
import { requirePrivyWallet } from '@/lib/privy'

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const WETH = '0x4200000000000000000000000000000000000006'

function usdcBaseUnits(amountUsd: number) { return String(Math.round(amountUsd * 1_000_000)) }

function extractDefinitiveTypedData(raw: unknown) {
  const candidate = (raw as { evm?: { orderTypedData?: unknown } } | null)?.evm?.orderTypedData
  if (!candidate || typeof candidate !== 'object') return undefined
  const value = candidate as Record<string, unknown>
  if (!value.domain || !value.types || !value.primaryType || !value.message) return undefined
  return candidate as import('@/lib/execution').TypedDataPayload
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const executionId = typeof body.executionId === 'string' ? body.executionId : ''
    const walletAddress = normalizeWallet(body.walletAddress)
    if (!executionId || !walletAddress) return NextResponse.json({ error: 'executionId and a valid Base wallet are required.' }, { status: 400 })
    if (!await requirePrivyWallet(request, walletAddress)) return NextResponse.json({ error: 'Authenticate the connected wallet with Privy before requesting a quote.' }, { status: 401 })

    const execution = await executionStore.get(executionId)
    if (!execution) return NextResponse.json({ error: 'Execution not found.' }, { status: 404 })
    if (execution.ownerWallet !== walletAddress) return NextResponse.json({ error: 'This execution belongs to a different wallet.' }, { status: 403 })
    if (execution.state !== 'approved' && execution.state !== 'planned' && execution.state !== 'quoted') return NextResponse.json({ error: `Execution cannot be quoted from state ${execution.state}.` }, { status: 409 })

    const orderType = execution.intent === 'dca' ? 'dca' : execution.intent === 'limit' ? 'limit' : 'market'
    const provider = selectProvider(orderType)
    if (!provider) return NextResponse.json({ error: `No provider supports ${orderType} orders.` }, { status: 422 })
    if (orderType === 'limit' && (typeof body.limitNotionalPrice !== 'string' || !/^\d+(\.\d+)?$/.test(body.limitNotionalPrice))) return NextResponse.json({ error: 'A limit price in USDC per ETH is required for a limit quote.' }, { status: 400 })

    const rawQuote = await provider.quote({ chainId: 8453, sellToken: USDC, buyToken: WETH, amount: orderType === 'dca' ? execution.amountUsd.toString() : usdcBaseUnits(execution.amountUsd), orderType, swapper: walletAddress, slippageTolerance: typeof body.slippageTolerance === 'number' ? body.slippageTolerance : 0.5, ...(orderType === 'dca' ? { durationSeconds: 7 * 24 * 60 * 60 } : {}), ...(orderType === 'limit' ? { limitNotionalPrice: body.limitNotionalPrice as string } : {}) })

    let next = execution
    if (execution.state !== 'quoted') next = transition(execution, 'quoted')
    next = { ...next, provider: rawQuote.provider, quoteId: rawQuote.quoteId, quoteTypedData: rawQuote.provider === 'definitive' ? extractDefinitiveTypedData(rawQuote.raw) : undefined }
    await executionStore.update(next)
    await executionStore.addAudit(auditEvent(next.id, 'quoted', { provider: rawQuote.provider, quoteId: rawQuote.quoteId ?? null, signingPayloadAvailable: Boolean(next.quoteTypedData) }))
    return NextResponse.json({ execution: next, quote: rawQuote, previewOnly: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Quote preparation failed' }, { status: 502 })
  }
}
