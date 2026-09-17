import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { getAddress, verifyMessage } from 'viem'
import { sql } from '@vercel/postgres'
import { ensureDatabase } from '@/lib/db'

const CHAIN_ID = 8453
const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const NONCE_TTL_MS = 5 * 60 * 1000

type Session = { address: string; issuedAt: number; expiresAt: number }

function secret() {
  const value = process.env.AUTH_SECRET
  if (value) return value
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is required in production.')
  return 'flitzr-dev-only-change-me'
}

export async function createNonce(address: string) {
  const normalized = getAddress(address)
  if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is required for wallet authentication.')
  const nonce = randomBytes(16).toString('hex')
  await ensureDatabase()
  await sql`INSERT INTO flitzr_auth_nonces (address, nonce, expires_at) VALUES (${normalized.toLowerCase()}, ${nonce}, ${new Date(Date.now() + NONCE_TTL_MS).toISOString()}) ON CONFLICT (address) DO UPDATE SET nonce=EXCLUDED.nonce, expires_at=EXCLUDED.expires_at`
  return nonce
}

export async function consumeNonce(address: string, nonce: string) {
  const key = getAddress(address).toLowerCase()
  if (!process.env.POSTGRES_URL) return false
  await ensureDatabase()
  const result = await sql`DELETE FROM flitzr_auth_nonces WHERE address=${key} AND nonce=${nonce} AND expires_at > NOW() RETURNING address`
  return result.rows.length > 0
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
  const expirationLine = message.match(/\nExpiration Time: ([^\n]+)/)?.[1]
  if (!expirationLine || Number.isNaN(Date.parse(expirationLine)) || Date.parse(expirationLine) < Date.now()) return false
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
  try {
    const actual = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)
    if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) return null
  } catch {
    return null
  }
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    if (!session.address || !Number.isFinite(session.expiresAt) || session.expiresAt < Date.now()) return null
    return session
  } catch {
    return null
  }
}
