export type OrderIntent = {
  type: 'dca' | 'limit' | 'market' | 'unknown'
  amountUsd: number | null
  text: string
}

export type Policy = {
  chain: 'base'
  maxSingleTradeUsd: number
  maxDailyUsd: number
  approvalAboveUsd: number
}

export const DEFAULT_POLICY: Policy = {
  chain: 'base',
  maxSingleTradeUsd: 25,
  maxDailyUsd: 100,
  approvalAboveUsd: 25,
}

export function detectIntent(text: string): OrderIntent {
  const lower = text.toLowerCase()
  const amountMatch = lower.match(/\$\s*([0-9]+(?:\.[0-9]+)?)/)
  const amountUsd = amountMatch ? Number(amountMatch[1]) : null

  let type: OrderIntent['type'] = 'unknown'
  if (/\bdca\b|every (day|week|month)|weekly|daily|monthly/.test(lower)) type = 'dca'
  else if (/\blimit\b|when .* reaches|at \$/.test(lower)) type = 'limit'
  else if (/\bswap\b|\bbuy\b|\bsell\b|\bmarket\b/.test(lower)) type = 'market'

  return { type, amountUsd, text }
}

export function evaluatePolicy(intent: OrderIntent, policy = DEFAULT_POLICY) {
  const amount = intent.amountUsd
  if (amount === null) {
    return { allowed: false, needsApproval: false, reason: 'Add a USD amount so Flitzr can evaluate the policy.' }
  }
  if (amount > policy.maxDailyUsd) {
    return { allowed: false, needsApproval: false, reason: `Amount exceeds the $${policy.maxDailyUsd} daily budget.` }
  }
  if (amount > policy.maxSingleTradeUsd) {
    return { allowed: false, needsApproval: true, reason: `Amount exceeds the $${policy.maxSingleTradeUsd} single-trade limit and requires approval.` }
  }
  return { allowed: true, needsApproval: amount > policy.approvalAboveUsd, reason: 'Within the configured execution policy.' }
}
