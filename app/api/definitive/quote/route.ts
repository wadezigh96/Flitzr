import { NextResponse } from 'next/server'
import { definitiveQuote } from '@/lib/definitive'
import { normalizeWallet } from '@/lib/execution'
import { readSession } from '@/lib/auth'

const WETH_BASE = '0x4200000000000000000000000000000000000006'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

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

    const orderType = body.orderType
    if (!['dca', 'limit'].includes(orderType)) {
      return NextResponse.json({ error: 'Only DCA and Limit quotes are enabled in this flow.' }, { status: 400 })
    }

    const amountUsd = Number(body.amountUsd)
    if (!Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 100) {
      return NextResponse.json({ error: 'Amount must be greater than $0 and at most $100.' }, { status: 400 })
    }

    const quote = await definitiveQuote({
      targetChain: 'base',
      contraChain: 'base',
      targetAsset: WETH_BASE,
      contraAsset: USDC_BASE,
      side: 'buy',
      qty: String(Math.round(amountUsd * 1_000_000)),
      orderType,
      ...(orderType === 'dca' ? { durationSeconds: 604800 } : {}),
      ...(orderType === 'limit' && typeof body.limitNotionalPrice === 'string' ? { limitNotionalPrice: body.limitNotionalPrice } : {}),
    })

    return NextResponse.json({ previewOnly: true, wallet, quote })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Definitive quote failed' }, { status: 502 })
  }
}
