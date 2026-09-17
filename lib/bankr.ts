const BANKR_BASE_URL = 'https://api.bankr.bot'

function apiKey() {
  const key = process.env.BANKR_API_KEY
  if (!key) throw new Error('BANKR_API_KEY is not configured')
  return key
}

async function bankrFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${BANKR_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey(),
      ...(init.headers || {}),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const text = await response.text()
  let data: unknown = text
  try { data = JSON.parse(text) } catch {}
  if (!response.ok) {
    const detail = typeof data === 'object' && data !== null && 'message' in data ? String((data as { message?: unknown }).message) : `HTTP ${response.status}`
    throw new Error(`Bankr request failed: ${detail}`)
  }
  return data
}

export async function bankrPrompt(prompt: string, threadId?: string) {
  return bankrFetch('/agent/prompt', {
    method: 'POST',
    body: JSON.stringify({ prompt, ...(threadId ? { threadId } : {}) }),
  })
}

export async function bankrJob(jobId: string) {
  return bankrFetch(`/agent/job/${encodeURIComponent(jobId)}`)
}

export async function bankrWalletMe() {
  return bankrFetch('/wallet/me')
}

export async function bankrPortfolio(chain = 'base') {
  return bankrFetch(`/wallet/portfolio?chain=${encodeURIComponent(chain)}`)
}

export async function bankrSwapQuote(input: {
  chain: 'base'
  sellToken: string
  buyToken: string
  amount: string
}) {
  return bankrFetch('/wallet/swap-quote', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function bankrTransfer(input: {
  tokenAddress: string
  recipientAddress: string
  amount: string
  isNativeToken?: boolean
  chain?: 'base'
}) {
  return bankrFetch('/wallet/transfer', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      chain: input.chain ?? 'base',
      isNativeToken: input.isNativeToken ?? false,
    }),
  })
}
