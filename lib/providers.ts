export type ProviderName = 'bankr' | 'definitive' | 'uniswap'

export type QuoteRequest = {
  chainId: 8453
  sellToken: string
  buyToken: string
  amount: string
  orderType: 'market' | 'dca' | 'limit'
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
  quote(request: QuoteRequest): Promise<ProviderQuote>
}

export function providerRegistry() {
  return new Map<ProviderName, ExecutionProvider>()
}
