import { PrivyClient, verifyAccessToken } from '@privy-io/node'
import { createRemoteJWKSet } from 'jose'
import { getAddress } from 'viem'

function appId() {
  const value = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID
  if (!value) throw new Error('PRIVY_APP_ID is required.')
  return value
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function verificationKeys() {
  jwks ??= createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${appId()}/jwks.json`))
  return jwks
}

function client() {
  const secret = process.env.PRIVY_APP_SECRET
  if (!secret) throw new Error('PRIVY_APP_SECRET is required.')
  return new PrivyClient({ appId: appId(), appSecret: secret })
}

export async function requirePrivyWallet(request: Request, walletAddress: string) {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) return null

  try {
    const claims = await verifyAccessToken({
      access_token: token,
      app_id: appId(),
      verification_key: verificationKeys(),
    })
    const user = await client().users()._get(claims.user_id)
    const expected = getAddress(walletAddress).toLowerCase()
    const linkedWallet = user.linked_accounts.find((account: any) => account.type === 'wallet' && typeof account.address === 'string' && account.address.toLowerCase() === expected)
    return linkedWallet ? { userId: claims.user_id, address: getAddress(walletAddress) } : null
  } catch {
    return null
  }
}
