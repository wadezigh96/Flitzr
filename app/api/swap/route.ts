import { NextResponse } from 'next/server'
import { normalizeWallet } from '@/lib/execution'
import { readSession } from '@/lib/auth'

const BASE_URL = 'https://trade-api.gateway.uniswap.org/v1'

function sessionFromRequest(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('flitzr_session='))?.slice('flitzr_session='.length)
  return readSession(token)
}

function apiKey() {
  const key = process.env.UNISWAP_API_KEY
  if (!key) throw new Error('UNISWAP_API_KEY is not configured')
  return key
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sellToken = typeof body.sellToken === 'string' ? body.sellToken : ''
    const buyToken = typeof body.buyToken === 'string' ? body.buyToken : ''
    const amount = typeof body.amount === 'string' ? body.amount : ''
    const swapper = normalizeWallet(body.swapper)
    if (!/^0x[a-fA-F0-9]{40}$/.test(sellToken) || !/^0x[a-fA-F0-9]{40}$/.test(buyToken)) return NextResponse.json({ error: 'Valid token addresses are required.' }, { status: 400 })
    if (!/^\d+$/.test(amount) || amount === '0' || !swapper) return NextResponse.json({ error: 'Valid wallet and positive amount are required.' }, { status: 400 })
    const session = sessionFromRequest(request)
    if (!session || session.address.toLowerCase() !== swapper) return NextResponse.json({ error: 'Authenticate the connected wallet first.' }, { status: 401 })

    const headers = { 'x-api-key': apiKey(), 'content-type': 'application/json', accept: 'application/json', 'x-universal-router-version': '2.0', 'x-permit2-disabled': 'true' }
    const quoteResponse = await fetch(`${BASE_URL}/quote`, {
      method: 'POST', headers,
      body: JSON.stringify({ type: 'EXACT_INPUT', tokenInChainId: 8453, tokenOutChainId: 8453, tokenIn: sellToken, tokenOut: buyToken, amount, swapper, slippageTolerance: typeof body.slippageTolerance === 'number' ? body.slippageTolerance : 0.5 }),
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    })
    const quote = await quoteResponse.json().catch(() => ({}))
    if (!quoteResponse.ok) return NextResponse.json({ error: quote?.detail || quote?.message || 'Uniswap quote failed.' }, { status: 502 })
    if (!['CLASSIC', 'WRAP', 'UNWRAP'].includes(quote.routing)) return NextResponse.json({ error: `This routing type (${quote.routing || 'unknown'}) needs a different execution flow.` }, { status: 422 })

    const swapResponse = await fetch(`${BASE_URL}/swap`, {
      method: 'POST', headers,
      body: JSON.stringify({ quote: quote.quote, ...(quote.permitData ? { permitData: quote.permitData } : {}) }),
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    })
    const swap = await swapResponse.json().catch(() => ({}))
    if (!swapResponse.ok || !swap?.swap?.to || !swap?.swap?.data) return NextResponse.json({ error: swap?.detail || swap?.message || 'Uniswap transaction build failed.' }, { status: 502 })

    return NextResponse.json({ provider: 'uniswap', routing: quote.routing, requestId: swap.requestId || quote.requestId, transaction: swap.swap, quote: quote.quote, chainId: 8453, previewOnly: false, requiresWalletSignature: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Swap build failed.' }, { status: 502 })
  }
}
