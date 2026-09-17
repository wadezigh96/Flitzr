import { bankrSwapQuote } from '@/lib/bankr'
import { definitiveQuote } from '@/lib/definitive'
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
  durationSeconds?: number
  limitNotionalPrice?: string
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
    return { provider: 'uniswap', quoteId: summary.requestId, raw: summary }
  },
}

const bankrProvider: ExecutionProvider = {
  name: 'bankr',
  supports: orderType => orderType === 'market',
  async quote(request) {
    const raw = await bankrSwapQuote({ chain: 'base', sellToken: request.sellToken, buyToken: request.buyToken, amount: request.amount })
    return {
      provider: 'bankr',
      quoteId: typeof (raw as { quoteId?: unknown })?.quoteId === 'string' ? (raw as { quoteId: string }).quoteId : undefined,
      raw,
    }
  },
}

const definitiveProvider: ExecutionProvider = {
  name: 'definitive',
  supports: orderType => orderType === 'dca' || orderType === 'limit',
  async quote(request) {
    const raw = await definitiveQuote({
      targetChain: 'base',
      contraChain: 'base',
      targetAsset: request.buyToken,
      contraAsset: request.sellToken,
      side: 'buy',
      qty: request.amount,
      orderType: request.orderType,
      ...(request.durationSeconds ? { durationSeconds: request.durationSeconds } : {}),
      ...(request.limitNotionalPrice ? { limitNotionalPrice: request.limitNotionalPrice } : {}),
    })
    const value = raw as { quoteId?: unknown; expiresAt?: unknown }
    return {
      provider: 'definitive',
      quoteId: typeof value.quoteId === 'string' ? value.quoteId : undefined,
      expiresAt: typeof value.expiresAt === 'string' ? value.expiresAt : undefined,
      raw,
    }
  },
}

export function providerRegistry() {
  return new Map<ProviderName, ExecutionProvider>([
    ['bankr', bankrProvider],
    ['definitive', definitiveProvider],
    ['uniswap', uniswapProvider],
  ])
}

export function selectProvider(orderType: QuoteRequest['orderType']): ExecutionProvider | null {
  for (const provider of providerRegistry().values()) if (provider.supports(orderType)) return provider
  return null
}
