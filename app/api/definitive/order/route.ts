import { NextResponse } from 'next/server'
import { definitiveOrder } from '@/lib/definitive'
import { normalizeWallet } from '@/lib/execution'
import { readSession } from '@/lib/auth'

function sessionWallet(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('flitzr_session='))?.slice('flitzr_session='.length)
  return readSession(token)?.address.toLowerCase() ?? null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const wallet = normalizeWallet(body.walletAddress)
    if (!wallet || sessionWallet(request) !== wallet) {
      return NextResponse.json({ error: 'Authenticate the connected wallet first.' }, { status: 401 })
    }
    if (typeof body.quoteId !== 'string' || !body.quoteId || typeof body.evmOrderTypedData !== 'object' || typeof body.userSignature !== 'string') {
      return NextResponse.json({ error: 'quoteId, evmOrderTypedData and userSignature are required.' }, { status: 400 })
    }

    const result = await definitiveOrder({
      quoteId: body.quoteId,
      evmOrderTypedData: body.evmOrderTypedData,
      userSignature: body.userSignature,
    })

    return NextResponse.json({ wallet, result, previewOnly: false })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Definitive order submission failed' }, { status: 502 })
  }
}
