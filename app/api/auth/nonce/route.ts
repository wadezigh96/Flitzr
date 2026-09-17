import { NextResponse } from 'next/server'
import { createNonce, buildSiweMessage } from '@/lib/auth'
import { getAddress } from 'viem'

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json()
    const address = getAddress(walletAddress)
    const origin = new URL(request.url).origin
    const nonce = createNonce(address)
    return NextResponse.json({ address, nonce, message: buildSiweMessage(origin, address, nonce) })
  } catch {
    return NextResponse.json({ error: 'A valid wallet address is required.' }, { status: 400 })
  }
}
