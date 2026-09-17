import { uniswapQuote, summarizeUniswapQuote } from '@/lib/uniswap'

export type ProviderName = 'bankr' | 'definitive' | 'uniswap'

export type QuoteRequest = {
  chainId: 8453
  sellToken: string
  buyToken: string
  amount: string
  orderType: 'market' | 'dca' | 'limit'
  swapper?: string
  slippageTolerance?: number
}

export type ProviderQuote = {
  provider: ProviderName
  quoteId?: string
  estimatedOutput?: string
  expiresAt?: string
  raw?: unknown
}

export interface ExecutionProvider {
  name: ProviderName
  supports(orderType: QuoteRequest['orderType']): boolean
  quote(request: QuoteRequest): Promise<ProviderQuote>
}

const uniswapProvider: ExecutionProvider = {
  name: 'uniswap',
  supports: orderType => orderType === 'market',
  async quote(request) {
    if (!request.swapper) throw new Error('A swapper wallet is required for a Uniswap quote.')
    const raw = await uniswapQuote({
      tokenIn: request.sellToken,
      tokenOut: request.buyToken,
      amount: request.amount,
      swapper: request.swapper,
      slippageTolerance: request.slippageTolerance ?? 0.5,
    })
    const summary = summarizeUniswapQuote(raw)
    return {
      provider: 'uniswap',
      quoteId: summary.requestId,
      estimatedOutput: summary.quote?.output?.amount ?? summary.quote?.output?.endAmount,
      raw: summary,
    }
  },
}

export function providerRegistry() {
  return new Map<ProviderName, ExecutionProvider>([['uniswap', uniswapProvider]])
}

export function selectProvider(orderType: QuoteRequest['orderType']): ExecutionProvider | null {
  for (const provider of providerRegistry().values()) {
    if (provider.supports(orderType)) return provider
  }
  return null
}
