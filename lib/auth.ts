import { createHmac, randomBytes } from 'node:crypto'
import { getAddress, verifyMessage } from 'viem'

const CHAIN_ID = 8453
const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const nonces = new Map<string, { nonce: string; expiresAt: number }>()

type Session = { address: string; issuedAt: number; expiresAt: number }

function secret() {
  return process.env.AUTH_SECRET || 'flitzr-dev-only-change-me'
}

export function createNonce(address: string) {
  const nonce = randomBytes(16).toString('hex')
  nonces.set(address.toLowerCase(), { nonce, expiresAt: Date.now() + 5 * 60 * 1000 })
  return nonce
}

export function consumeNonce(address: string, nonce: string) {
  const key = address.toLowerCase()
  const item = nonces.get(key)
  if (!item || item.expiresAt < Date.now() || item.nonce !== nonce) return false
  nonces.delete(key)
  return true
}

export function buildSiweMessage(origin: string, address: string, nonce: string) {
  const issuedAt = new Date().toISOString()
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  return `${new URL(origin).host} wants you to sign in with your Ethereum account:\n${getAddress(address)}\n\nSign in to Flitzr. This signature authenticates your wallet session only; it does not authorize a transaction.\n\nURI: ${origin}\nVersion: 1\nChain ID: ${CHAIN_ID}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expirationTime}`
}

export async function verifySiwe(address: string, message: string, signature: `0x${string}`, expectedOrigin: string, nonce: string) {
  const normalized = getAddress(address)
  const expectedHost = new URL(expectedOrigin).host
  if (!message.startsWith(`${expectedHost} wants you to sign in with your Ethereum account:\n${normalized}\n`)) return false
  if (!message.includes(`URI: ${expectedOrigin}\n`) || !message.includes(`Version: 1\nChain ID: ${CHAIN_ID}\nNonce: ${nonce}\n`)) return false
  const ok = await verifyMessage({ address: normalized, message, signature })
  if (!ok) return false
  return consumeNonce(normalized, nonce)
}

export function createSession(address: string) {
  const now = Date.now()
  const session: Session = { address: getAddress(address), issuedAt: now, expiresAt: now + SESSION_TTL_MS }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function readSession(token: string | undefined) {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  if (signature !== expected) return null
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    if (session.expiresAt < Date.now()) return null
    return session
  } catch {
    return null
  }
}
