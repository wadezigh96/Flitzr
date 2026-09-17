import { NextResponse } from 'next/server'
import { selectProvider } from '@/lib/providers'
import { normalizeWallet } from '@/lib/execution'
import { readSession } from '@/lib/auth'

function sessionFromRequest(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('flitzr_session='))?.slice('flitzr_session='.length)
  return readSession(token)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sellToken = typeof body.sellToken === 'string' ? body.sellToken : ''
    const buyToken = typeof body.buyToken === 'string' ? body.buyToken : ''
    const amount = typeof body.amount === 'string' ? body.amount : ''
    const orderType = body.orderType === 'market' || body.orderType === 'dca' || body.orderType === 'limit' ? body.orderType : 'market'
    const swapper = normalizeWallet(body.swapper)

    if (!/^0x[a-fA-F0-9]{40}$/.test(sellToken) || !/^0x[a-fA-F0-9]{40}$/.test(buyToken)) {
      return NextResponse.json({ error: 'Valid token addresses are required.' }, { status: 400 })
    }
    if (!/^\d+$/.test(amount) || amount === '0') {
      return NextResponse.json({ error: 'Amount must be a positive base-unit integer.' }, { status: 400 })
    }
    if (!swapper) return NextResponse.json({ error: 'A valid Base wallet is required.' }, { status: 400 })

    const session = sessionFromRequest(request)
    if (!session || session.address.toLowerCase() !== swapper) return NextResponse.json({ error: 'Authenticate the connected wallet before requesting a quote.' }, { status: 401 })

    const provider = selectProvider(orderType)
    if (!provider) return NextResponse.json({ error: `No provider supports ${orderType} orders yet.` }, { status: 422 })

    const quote = await provider.quote({
      chainId: 8453,
      sellToken,
      buyToken,
      amount,
      orderType,
      swapper,
      slippageTolerance: typeof body.slippageTolerance === 'number' ? body.slippageTolerance : 0.5,
    })

    return NextResponse.json({ provider: provider.name, quote, previewOnly: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Quote failed' }, { status: 502 })
  }
}
