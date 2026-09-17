const UNISWAP_API = 'https://api.uniswap.org'

export type UniswapQuoteInput = {
  tokenIn: string
  tokenOut: string
  amount: string
  type: 'EXACT_INPUT'
  chainId: 8453
}

export async function uniswapQuote(input: UniswapQuoteInput) {
  const apiKey = process.env.UNISWAP_API_KEY
  if (!apiKey) {
    return { configured: false, demo: true, message: 'UNISWAP_API_KEY is not configured. Route preview remains available.' }
  }
  const response = await fetch(`${UNISWAP_API}/v2/quote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || data?.error || `Uniswap quote failed (${response.status})`)
  return { configured: true, demo: false, ...data }
}
