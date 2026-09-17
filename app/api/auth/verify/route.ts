import { NextResponse } from 'next/server'
import { createSession, verifySiwe } from '@/lib/auth'
import { getAddress } from 'viem'

export async function POST(request: Request) {
  try {
    const { address, message, signature, nonce } = await request.json()
    if (typeof address !== 'string' || typeof message !== 'string' || typeof signature !== 'string' || typeof nonce !== 'string') {
      return NextResponse.json({ error: 'Incomplete authentication request.' }, { status: 400 })
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address) || !/^0x[0-9a-fA-F]+$/.test(signature)) {
      return NextResponse.json({ error: 'Invalid wallet address or signature.' }, { status: 400 })
    }
    const normalized = getAddress(address)
    const ok = await verifySiwe(normalized, message, signature as `0x${string}`, new URL(request.url).origin, nonce)
    if (!ok) return NextResponse.json({ error: 'Signature verification failed or the nonce is invalid.' }, { status: 401 })
    const response = NextResponse.json({ authenticated: true, address: normalized })
    response.cookies.set('flitzr_session', createSession(normalized), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Wallet authentication failed.' }, { status: 401 })
  }
}
