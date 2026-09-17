export const X402_VERSION = 2
export const X402_NETWORK = 'eip155:8453'
export const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

export type X402PaymentRequirement = {
  scheme: 'exact'
  network: typeof X402_NETWORK
  amount: string
  asset: typeof BASE_USDC
  payTo: string
  maxTimeoutSeconds: number
  extra: { name: 'USDC'; version: '2' }
}

export function createPaymentRequirement(input: {
  amountUsdc: string
  payTo: string
  resource: string
  description: string
}): { x402Version: number; resource: { url: string; description: string; mimeType: string }; accepts: X402PaymentRequirement[]; extensions: Record<string, never> } {
  if (!/^0x[a-fA-F0-9]{40}$/.test(input.payTo)) throw new Error('Invalid x402 payTo address')
  if (!/^\d+(\.\d{1,6})?$/.test(input.amountUsdc) || Number(input.amountUsdc) <= 0) throw new Error('Invalid x402 USDC amount')

  const [whole, fraction = ''] = input.amountUsdc.split('.')
  const atomicAmount = `${whole}${fraction.padEnd(6, '0')}`.replace(/^0+(?=\d)/, '')

  return {
    x402Version: X402_VERSION,
    resource: { url: input.resource, description: input.description, mimeType: 'application/json' },
    accepts: [{
      scheme: 'exact', network: X402_NETWORK, amount: atomicAmount, asset: BASE_USDC,
      payTo: input.payTo, maxTimeoutSeconds: 60, extra: { name: 'USDC', version: '2' },
    }],
    extensions: {},
  }
}

export function decodePaymentSignature(value: string | null): unknown | null {
  if (!value) return null
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

export async function facilitatorRequest(path: '/verify' | '/settle', body: unknown) {
  const base = process.env.X402_FACILITATOR_URL?.replace(/\/$/, '')
  if (!base) return { configured: false, response: null }

  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  const text = await response.text()
  let data: unknown = text
  try { data = JSON.parse(text) } catch {}
  return { configured: true, ok: response.ok, status: response.status, response: data }
}
