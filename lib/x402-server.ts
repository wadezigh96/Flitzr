import { paymentProxy, x402ResourceServer } from '@x402/next'
import { HTTPFacilitatorClient } from '@x402/core/server'
import { ExactEvmScheme } from '@x402/evm/exact/server'

export const X402_NETWORK = 'eip155:8453' as const
export const X402_PRICE = `$${process.env.X402_PRICE_USDC || '0.01'}`
export const X402_PAY_TO = process.env.X402_PAY_TO?.trim() || ''

const facilitator = new HTTPFacilitatorClient({
  url: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
})

export const x402Server = new x402ResourceServer(facilitator).register(
  X402_NETWORK,
  new ExactEvmScheme(),
)

export const x402PremiumConfig = {
  accepts: {
    scheme: 'exact' as const,
    price: X402_PRICE,
    network: X402_NETWORK,
    payTo: X402_PAY_TO,
  },
  description: 'Flitzr premium agent resource',
  mimeType: 'application/json',
}

export const x402Configured = /^0x[a-fA-F0-9]{40}$/.test(X402_PAY_TO)

/** Page-level proxy only. API settlement uses withX402 on the route. */
export const proxy = x402Configured
  ? paymentProxy(
      {
        '/x402': {
          accepts: x402PremiumConfig.accepts,
          description: 'Flitzr x402 paywall page',
          mimeType: 'text/html',
        },
      },
      x402Server,
    )
  : () => undefined
