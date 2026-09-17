const UNISWAP_BASE_URL = 'https://trade-api.gateway.uniswap.org/v1'

export type UniswapQuoteInput = {
  tokenIn: string
  tokenOut: string
  amount: string
  swapper: string
  slippageTolerance?: number
  protocols?: string[]
}

function apiKey() {
  const key = process.env.UNISWAP_API_KEY
  if (!key) throw new Error('UNISWAP_API_KEY is not configured')
  return key
}

export async function uniswapQuote(input: UniswapQuoteInput) {
  const response = await fetch(`${UNISWAP_BASE_URL}/quote`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey(),
      'content-type': 'application/json',
      accept: 'application/json',
      'x-universal-router-version': '2.0',
    },
    body: JSON.stringify({
      type: 'EXACT_INPUT',
      tokenInChainId: 8453,
      tokenOutChainId: 8453,
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      amount: input.amount,
      swapper: input.swapper,
      slippageTolerance: input.slippageTolerance ?? 0.5,
      ...(input.protocols ? { protocols: input.protocols } : {}),
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.detail || data?.message || data?.errorCode || `Uniswap quote failed (${response.status})`)
  }
  return data
}

export function summarizeUniswapQuote(data: any) {
  return {
    provider: 'uniswap' as const,
    requestId: data?.requestId,
    routing: data?.routing,
    estimatedGas: data?.permitGasFee ?? data?.gasFee,
    quote: data?.quote,
    permitData: data?.permitData ?? null,
    approvalApplicable: data?.isTokenApprovalApplicable ?? true,
  }
}
