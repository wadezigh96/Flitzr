import { NextResponse } from 'next/server'
import { definitiveQuote } from '@/lib/definitive'
import { DEFAULT_POLICY, detectIntent, evaluatePolicy } from '@/lib/policy'

const WETH_BASE = '0x4200000000000000000000000000000000000006'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const intent = detectIntent(prompt.trim())
    const policy = evaluatePolicy(intent, DEFAULT_POLICY)
    const plan = {
      chain: 'Base',
      intent,
      policy,
      execution: 'preview-only',
      nextStep: policy.allowed ? 'Ready for a quote/signature flow.' : 'Policy approval required before execution.',
    }

    if (!policy.allowed || intent.type === 'unknown' || intent.amountUsd === null) {
      return NextResponse.json({ plan })
    }

    const qty = String(Math.round(intent.amountUsd * 1_000_000))
    const quote = await definitiveQuote({
      targetChain: 'base',
      contraChain: 'base',
      targetAsset: WETH_BASE,
      contraAsset: USDC_BASE,
      side: 'buy',
      qty,
      orderType: intent.type === 'dca' ? 'dca' : 'limit',
      ...(intent.type === 'dca' ? { durationSeconds: 604800 } : {}),
    })

    return NextResponse.json({ plan, quote })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Planning failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
