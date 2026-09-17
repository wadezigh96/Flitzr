const FLASH_BASE_URL = 'https://flash.definitive.fi'

export type FlashQuoteInput = {
  targetChain: 'base'
  contraChain: 'base'
  targetAsset: string
  contraAsset: string
  side: 'buy' | 'sell'
  qty: string
  orderType: 'dca' | 'limit'
  durationSeconds?: number
  limitNotionalPrice?: string
}

export async function definitiveQuote(input: FlashQuoteInput) {
  const apiKey = process.env.DEFINITIVE_API_KEY
  if (!apiKey) {
    return { configured: false, demo: true, message: 'DEFINITIVE_API_KEY is not configured. Policy planning is available; live quotes are disabled.' }
  }

  const response = await fetch(`${FLASH_BASE_URL}/v1/quote`, {
    method: 'POST',
    headers: {
      'x-definitive-api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.message || data?.error || `Definitive quote failed (${response.status})`)
  return { configured: true, demo: false, ...data }
}
