import type { ExecutionRecord } from '@/lib/execution'
import type { AuditEvent } from '@/lib/audit'
import {
  findPersistentByIdempotency,
  findPersistentExecution,
  persistAudit,
  persistExecution,
  persistIdempotency,
} from '@/lib/db'

export interface ExecutionStore {
  get(id: string): Promise<ExecutionRecord | undefined>
  put(record: ExecutionRecord, idempotencyKey?: string): Promise<void>
  update(record: ExecutionRecord): Promise<void>
  getByIdempotencyKey(key: string, ownerWallet: string): Promise<ExecutionRecord | undefined>
  addAudit(event: AuditEvent): Promise<void>
  getAudit(executionId: string): Promise<AuditEvent[]>
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

  async addAudit(event: AuditEvent) {
    const existing = this.audits.get(event.executionId) ?? []
    this.audits.set(event.executionId, [...existing, event])
    await persistAudit(event)
  }

  async getAudit(executionId: string) {
    return this.audits.get(executionId) ?? []
  }
}

export const executionStore: ExecutionStore = new ExecutionStoreImpl()
