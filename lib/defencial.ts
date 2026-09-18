export type OrderIntent = {
  type: 'dca' | 'limit' | 'market' | 'unknown'
  amountUsd: number | null
  text: string
}

export type Defencial = {
  chain: 'base'
  maxSingleTradeUsd: number
  maxDailyUsd: number
  approvalAboveUsd: number
}

export const DEFAULT_DEFENCIAL: Defencial = {
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

export function evaluateDefencial(
  intent: OrderIntent,
  defencial = DEFAULT_DEFENCIAL,
  usage: { spentTodayUsd?: number } = {},
) {
  const amount = intent.amountUsd
  const spentTodayUsd = Math.max(0, usage.spentTodayUsd ?? 0)
  if (amount === null) {
    return { allowed: false, needsApproval: false, spentTodayUsd, remainingDailyUsd: defencial.maxDailyUsd, reason: 'Add a USD amount so Flitzr can evaluate the Defencial.' }
  }
  if (amount <= 0) {
    return { allowed: false, needsApproval: false, spentTodayUsd, remainingDailyUsd: defencial.maxDailyUsd - spentTodayUsd, reason: 'Amount must be greater than $0.' }
  }
  if (spentTodayUsd + amount > defencial.maxDailyUsd) {
    return {
      allowed: false,
      needsApproval: false,
      spentTodayUsd,
      remainingDailyUsd: Math.max(0, defencial.maxDailyUsd - spentTodayUsd),
      reason: `Amount exceeds the $${defencial.maxDailyUsd} daily Defencial budget (already planned $${spentTodayUsd.toFixed(2)} today).`,
    }
  }
  const needsApproval = amount > defencial.approvalAboveUsd
  return {
    allowed: true,
    needsApproval,
    spentTodayUsd,
    remainingDailyUsd: defencial.maxDailyUsd - spentTodayUsd - amount,
    reason: needsApproval
      ? `Within daily budget, but user approval is required above $${defencial.approvalAboveUsd}.`
      : `Within the configured $${defencial.maxSingleTradeUsd} single-trade Defencial.`,
  }
}
