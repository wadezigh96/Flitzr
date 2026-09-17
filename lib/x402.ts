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

/**
 * Compatibility helpers for displaying/inspecting x402 v2 requirements.
 * Payment verification and settlement are handled by the official @x402/next
 * middleware in proxy.ts, not by hand-rolled facilitator calls.
 */
export function createPaymentRequirement(input: {
  amountUsdc: string
  payTo: string
  resource: string
  description: string
}) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(input.payTo)) throw new Error('Invalid x402 payTo address')
  if (!/^\d+(\.\d{1,6})?$/.test(input.amountUsdc) || Number(input.amountUsdc) <= 0) throw new Error('Invalid x402 USDC amount')

  const [whole, fraction = ''] = input.amountUsdc.split('.')
  const amount = `${whole}${fraction.padEnd(6, '0')}`.replace(/^0+(?=\d)/, '')

  return {
    x402Version: X402_VERSION,
    resource: { url: input.resource, description: input.description, mimeType: 'application/json' },
    accepts: [{
      scheme: 'exact' as const,
      network: X402_NETWORK,
      amount,
      asset: BASE_USDC,
      payTo: input.payTo,
      maxTimeoutSeconds: 60,
      extra: { name: 'USDC' as const, version: '2' as const },
    }],
    extensions: {},
  }
}
