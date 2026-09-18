import type { ExecutionRecord } from '@/lib/execution'
import type { AuditEvent } from '@/lib/audit'
import {
  claimPersistentIdempotency,
  findPersistentAudit,
  findPersistentByIdempotency,
  findPersistentExecution,
  findPersistentExecutions,
  persistAudit,
  persistExecution,
  persistIdempotency,
} from '@/lib/db'

const OPEN_STATES: ExecutionRecord['state'][] = [
  'planned',
  'awaiting_approval',
  'approved',
  'quoted',
  'signing',
  'submitted',
  'confirmed',
]

export interface ExecutionStore {
  get(id: string): Promise<ExecutionRecord | undefined>
  put(record: ExecutionRecord, idempotencyKey?: string): Promise<void>
  update(record: ExecutionRecord): Promise<void>
  getByIdempotencyKey(key: string, ownerWallet: string): Promise<ExecutionRecord | undefined>
  claimIdempotency(key: string, ownerWallet: string, executionId: string): Promise<{ claimed: boolean; sameExecution: boolean; existingExecution?: ExecutionRecord }>
  addAudit(event: AuditEvent): Promise<void>
  getAudit(executionId: string): Promise<AuditEvent[]>
  spentTodayUsd(ownerWallet: string): Promise<number>
}

class ExecutionStoreImpl implements ExecutionStore {
  private records = new Map<string, ExecutionRecord>()
  private idempotency = new Map<string, string>()
  private audits = new Map<string, AuditEvent[]>()

  async get(id: string) {
    const memory = this.records.get(id)
    if (memory) return memory
    const persistent = await findPersistentExecution(id)
    if (persistent) this.records.set(id, persistent)
    return persistent
  }

  async put(record: ExecutionRecord, idempotencyKey?: string) {
    this.records.set(record.id, record)
    if (idempotencyKey) this.idempotency.set(`${record.ownerWallet}:${idempotencyKey}`, record.id)
    await persistExecution(record)
    if (idempotencyKey) await persistIdempotency(record.ownerWallet, idempotencyKey, record.id)
  }

  async update(record: ExecutionRecord) {
    this.records.set(record.id, record)
    await persistExecution(record)
  }

  async getByIdempotencyKey(key: string, ownerWallet: string) {
    const memoryId = this.idempotency.get(`${ownerWallet}:${key}`)
    if (memoryId) return this.get(memoryId)
    const persistent = await findPersistentByIdempotency(key, ownerWallet)
    if (persistent) {
      this.records.set(persistent.id, persistent)
      this.idempotency.set(`${ownerWallet}:${key}`, persistent.id)
    }
    return persistent
  }

  async claimIdempotency(key: string, ownerWallet: string, executionId: string) {
    const memoryKey = `${ownerWallet}:${key}`
    const memoryId = this.idempotency.get(memoryKey)
    if (memoryId) {
      return {
        claimed: false,
        sameExecution: memoryId === executionId,
        existingExecution: await this.get(memoryId),
      }
    }

    const result = await claimPersistentIdempotency(ownerWallet, key, executionId)
    if (result.claimed) {
      this.idempotency.set(memoryKey, executionId)
      return { claimed: true, sameExecution: true, existingExecution: undefined }
    }

    if (result.existingExecutionId) {
      this.idempotency.set(memoryKey, result.existingExecutionId)
      return {
        claimed: false,
        sameExecution: result.existingExecutionId === executionId,
        existingExecution: await this.get(result.existingExecutionId),
      }
    }

    return { claimed: false, sameExecution: false, existingExecution: undefined }
  }

  async addAudit(event: AuditEvent) {
    const existing = this.audits.get(event.executionId) ?? []
    this.audits.set(event.executionId, [...existing, event])
    await persistAudit(event)
  }

  async getAudit(executionId: string) {
    const memory = this.audits.get(executionId)
    if (memory?.length) return memory
    const persistent = await findPersistentAudit(executionId)
    this.audits.set(executionId, persistent)
    return persistent
  }

  async spentTodayUsd(ownerWallet: string) {
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    const startIso = start.toISOString()
    const persistent = await findPersistentExecutions(ownerWallet, 50)
    const merged = new Map<string, ExecutionRecord>()
    for (const record of this.records.values()) {
      if (record.ownerWallet === ownerWallet) merged.set(record.id, record)
    }
    for (const record of persistent) merged.set(record.id, record)
    let total = 0
    for (const record of merged.values()) {
      if (record.createdAt < startIso) continue
      if (!OPEN_STATES.includes(record.state)) continue
      total += record.amountUsd
    }
    return total
  }
}

export const executionStore: ExecutionStore = new ExecutionStoreImpl()
