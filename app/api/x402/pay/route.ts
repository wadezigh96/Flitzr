import { NextResponse } from 'next/server'
import { createPaymentRequirement } from '@/lib/x402'
import { normalizeWallet } from '@/lib/execution'

export async function GET(request: Request) {
  const payTo = normalizeWallet(process.env.X402_PAY_TO)
  if (!payTo) return NextResponse.json({ error: 'X402_PAY_TO is not configured.' }, { status: 503 })

  const url = new URL('/api/x402/pay', request.url).toString()
  const requirements = createPaymentRequirement({
    amountUsdc: process.env.X402_PRICE_USDC ?? '0.01',
    payTo,
    resource: url,
    description: 'Flitzr agent payment endpoint',
  })

  const paymentSignature = request.headers.get('PAYMENT-SIGNATURE')
  if (!paymentSignature) {
    return NextResponse.json({ ...requirements, error: 'Payment required' }, {
      status: 402,
      headers: { 'PAYMENT-REQUIRED': Buffer.from(JSON.stringify(requirements)).toString('base64') },
    })
  }

  return NextResponse.json({
    status: 'payment_received_for_verification',
    message: 'Payment signature received. Configure an x402 facilitator before settlement.',
    paymentPresent: true,
    previewOnly: true,
  })
}
