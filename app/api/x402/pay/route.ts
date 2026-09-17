import { NextResponse } from 'next/server'

/**
 * Legacy compatibility endpoint.
 * New x402 v2 payments should use /api/x402/premium, which is protected by
 * the official @x402/next payment proxy.
 */
export async function GET() {
  return NextResponse.json({
    error: 'This x402 endpoint moved to /api/x402/premium.',
    endpoint: '/api/x402/premium',
    version: 2,
  }, { status: 308, headers: { location: '/api/x402/premium' } })
}
