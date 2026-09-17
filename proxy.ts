import { paymentProxy, x402ResourceServer } from '@x402/next'
import { HTTPFacilitatorClient } from '@x402/core/server'
import { ExactEvmScheme } from '@x402/evm/exact/server'

const payTo = process.env.X402_PAY_TO
const facilitatorUrl = process.env.X402_FACILITATOR_URL

const facilitator = new HTTPFacilitatorClient({
  url: facilitatorUrl || 'https://x402.org/facilitator',
})

const resourceServer = new x402ResourceServer(facilitator).register(
  'eip155:8453',
  new ExactEvmScheme(),
)

export const proxy = payTo
  ? paymentProxy(
      {
        '/api/x402/premium': {
          accepts: {
            scheme: 'exact',
            price: `$${process.env.X402_PRICE_USDC || '0.01'}`,
            network: 'eip155:8453',
            payTo,
          },
          description: 'Flitzr premium agent resource',
          mimeType: 'application/json',
        },
      },
      resourceServer,
    )
  : () => undefined

export default proxy
