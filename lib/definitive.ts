const FLASH_BASE_URL = 'https://flash.definitive.fi'
const REQUEST_TIMEOUT_MS = 10_000

export type FlashQuoteInput = {
  targetChain: 'base'
  contraChain: 'base'
  targetAsset: string
  contraAsset: string
  side: 'buy' | 'sell'
  qty: string
  orderType: 'dca' | 'limit' | 'market' | 'twap' | 'stop_loss' | 'take_profit'
  durationSeconds?: number
  limitNotionalPrice?: string
}

export type FlashOrderInput = {
  quoteId: string
  evmOrderTypedData: unknown
  userSignature: string
  flashIntegratorFeeBps?: string
}

function apiKey() {
  const key = process.env.DEFINITIVE_API_KEY
  if (!key) throw new Error('DEFINITIVE_API_KEY is not configured')
  return key
}

async function flashFetch(path: string, body: unknown) {
  const response = await fetch(`${FLASH_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'x-definitive-api-key': apiKey(),
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : `Definitive request failed (${response.status})`
    throw new Error(message)
  }
  return data
}

export async function definitiveQuote(input: FlashQuoteInput) {
  if (!process.env.DEFINITIVE_API_KEY) {
    return { configured: false, demo: true, message: 'DEFINITIVE_API_KEY is not configured. Policy planning is available; live quotes are disabled.' }
  }
  return { configured: true, demo: false, ...(await flashFetch('/v1/quote', input)) }
}

export async function definitiveOrder(input: FlashOrderInput) {
  if (!process.env.DEFINITIVE_API_KEY) {
    return { configured: false, demo: true, message: 'DEFINITIVE_API_KEY is not configured. No order was submitted.' }
  }
  return { configured: true, demo: false, ...(await flashFetch('/v1/order', input)) }
}
