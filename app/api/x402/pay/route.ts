import { NextResponse } from 'next/server'
import { createPaymentRequirement, decodePaymentSignature, facilitatorRequest } from '@/lib/x402'
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

  const payload = decodePaymentSignature(paymentSignature)
  if (!payload) return NextResponse.json({ error: 'Invalid PAYMENT-SIGNATURE encoding.' }, { status: 400 })

  const verification = await facilitatorRequest('/verify', {
    x402Version: 2,
    paymentPayload: payload,
    paymentRequirements: requirements.accepts[0],
  })

  if (!verification.configured) {
    return NextResponse.json({
      status: 'payment_received_for_verification',
      message: 'Facilitator is not configured. No settlement was attempted.',
      paymentPresent: true,
      previewOnly: true,
    }, { status: 503 })
  }

  if (!verification.ok) {
    return NextResponse.json({
      error: 'Payment verification failed.',
      facilitator: verification.response,
      previewOnly: true,
    }, { status: 402 })
  }

  const settled = await facilitatorRequest('/settle', {
    x402Version: 2,
    paymentPayload: payload,
    paymentRequirements: requirements.accepts[0],
  })

  if (!settled.ok) {
    return NextResponse.json({
      error: 'Payment verified but settlement failed.',
      facilitator: settled.response,
      previewOnly: false,
    }, { status: 502 })
  }

  return NextResponse.json({
    status: 'paid',
    message: 'x402 payment settled successfully.',
    paymentPresent: true,
    settlement: settled.response,
  }, {
    headers: { 'PAYMENT-RESPONSE': Buffer.from(JSON.stringify(settled.response)).toString('base64') },
  })
}
