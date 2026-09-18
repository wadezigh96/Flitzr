import { NextRequest, NextResponse } from 'next/server'
import { withX402 } from '@x402/next'
import {
  x402Configured,
  x402PremiumConfig,
  x402Server,
  X402_NETWORK,
  X402_PAY_TO,
  X402_PRICE,
} from '@/lib/x402-server'

async function paidHandler() {
  return NextResponse.json({
    ok: true,
    paid: true,
    service: 'flitzr',
    resource: 'premium-agent',
    network: X402_NETWORK,
    message: 'x402 settlement accepted. Premium Flitzr resource is available.',
  })
}

async function unpaidHandler() {
  return NextResponse.json(
    {
      ok: false,
      paid: false,
      configured: false,
      service: 'flitzr',
      resource: 'premium-agent',
      network: X402_NETWORK,
      price: X402_PRICE,
      message:
        'x402 is not live until X402_PAY_TO is set on the server. This response is not a settlement.',
    },
    { status: 402 },
  )
}

export const GET = x402Configured
  ? withX402(paidHandler, x402PremiumConfig, x402Server)
  : unpaidHandler

export async function OPTIONS() {
  return NextResponse.json({
    protocol: 'x402',
    version: 2,
    configured: x402Configured,
    network: X402_NETWORK,
    price: X402_PRICE,
    payTo: x402Configured ? X402_PAY_TO : null,
  })
}
