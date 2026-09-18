import { NextResponse } from 'next/server'
import { uniswapQuote, summarizeUniswapQuote } from '@/lib/uniswap'
import { normalizeWallet } from '@/lib/execution'
import { requirePrivyWallet } from '@/lib/privy'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sellToken = typeof body.sellToken === 'string' ? body.sellToken : ''
    const buyToken = typeof body.buyToken === 'string' ? body.buyToken : ''
    const amount = typeof body.amount === 'string' ? body.amount : ''
    const orderType = body.orderType === 'market' ? 'market' : 'market'
    const swapper = normalizeWallet(body.swapper)

    if (!/^0x[a-fA-F0-9]{40}$/.test(sellToken) || !/^0x[a-fA-F0-9]{40}$/.test(buyToken)) return NextResponse.json({ error: 'Valid token addresses are required.' }, { status: 400 })
    if (!/^\d+$/.test(amount) || amount === '0') return NextResponse.json({ error: 'Amount must be a positive base-unit integer.' }, { status: 400 })
    if (!swapper) return NextResponse.json({ error: 'A valid Base wallet is required.' }, { status: 400 })
    if (!await requirePrivyWallet(request, swapper)) return NextResponse.json({ error: 'Authenticate the connected wallet with Privy before requesting a quote.' }, { status: 401 })

    const raw = await uniswapQuote({ tokenIn: sellToken, tokenOut: buyToken, amount, swapper, slippageTolerance: typeof body.slippageTolerance === 'number' ? body.slippageTolerance : 0.5 })
    const summary = summarizeUniswapQuote(raw)
    return NextResponse.json({ provider: 'uniswap', routing: summary.routing, quote: summary.quote, quoteId: summary.requestId, permitData: summary.permitData, approvalApplicable: summary.approvalApplicable, previewOnly: true, chainId: 8453 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Quote failed' }, { status: 502 })
  }
}
