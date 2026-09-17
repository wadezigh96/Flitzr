const BANKR_BASE_URL = 'https://api.bankr.bot'

function apiKey() {
  const key = process.env.BANKR_API_KEY
  if (!key) throw new Error('BANKR_API_KEY is not configured')
  return key
}

export async function bankrPrompt(prompt: string, threadId?: string) {
  const response = await fetch(`${BANKR_BASE_URL}/agent/prompt`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-API-Key': apiKey()},
    body: JSON.stringify({prompt, ...(threadId ? {threadId} : {})}),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Bankr request failed: ${response.status}`)
  return response.json()
}

export async function bankrJob(jobId: string) {
  const response = await fetch(`${BANKR_BASE_URL}/agent/job/${jobId}`, {
    headers: {'X-API-Key': apiKey()}, cache: 'no-store'
  })
  if (!response.ok) throw new Error(`Bankr job failed: ${response.status}`)
  return response.json()
}
