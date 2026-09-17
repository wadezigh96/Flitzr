import { NextResponse } from 'next/server'
import { createNonce, buildSiweMessage } from '@/lib/auth'
import { getAddress } from 'viem'

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json()
    if (typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Wallet address is required.' }, { status: 400 })
    }
    const address = getAddress(walletAddress)
    const origin = new URL(request.url).origin
    const nonce = await createNonce(address)
    return NextResponse.json({ address, nonce, message: buildSiweMessage(origin, address, nonce) })
  } catch (error) {
    console.error('auth_nonce_failed', error)
    if (error instanceof Error && error.message.includes('POSTGRES_URL')) {
      return NextResponse.json({ error: 'Wallet authentication is not configured on production: POSTGRES_URL is missing.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Could not create a wallet authentication nonce.' }, { status: 400 })
  }
}
