export type ExecutionState =
  | 'planned'
  | 'awaiting_approval'
  | 'approved'
  | 'quoted'
  | 'signing'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'failed'
  | 'cancelled'

export type ExecutionRecord = {
  id: string
  state: ExecutionState
  chainId: 8453
  intent: 'dca' | 'limit' | 'market' | 'unknown'
  amountUsd: number
  ownerWallet: string
  createdAt: string
  updatedAt: string
  provider?: 'bankr' | 'definitive' | 'uniswap'
  quoteId?: string
  txHash?: string
  error?: string
}

const transitions: Record<ExecutionState, ExecutionState[]> = {
  planned: ['awaiting_approval', 'quoted', 'rejected', 'cancelled'],
  awaiting_approval: ['approved', 'rejected', 'cancelled'],
  approved: ['quoted', 'signing', 'rejected', 'cancelled'],
  quoted: ['signing', 'rejected', 'cancelled'],
  signing: ['submitted', 'rejected', 'failed', 'cancelled'],
  submitted: ['confirmed', 'failed'],
  confirmed: [], rejected: [], failed: [], cancelled: [],
}

export function canTransition(from: ExecutionState, to: ExecutionState) {
  return transitions[from].includes(to)
}

export function transition(record: ExecutionRecord, next: ExecutionState): ExecutionRecord {
  if (!canTransition(record.state, next)) throw new Error(`Invalid execution transition: ${record.state} -> ${next}`)
  return { ...record, state: next, updatedAt: new Date().toISOString() }
}

export function normalizeWallet(value: unknown): string | null {
  if (typeof value !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(value)) return null
  return value.toLowerCase()
}

export function createExecution(input: Pick<ExecutionRecord, 'intent' | 'amountUsd' | 'provider' | 'ownerWallet'>): ExecutionRecord {
  const now = new Date().toISOString()
  return { id: `exec_${crypto.randomUUID()}`, state: 'planned', chainId: 8453, createdAt: now, updatedAt: now, ...input }
}
