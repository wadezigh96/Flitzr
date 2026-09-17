import type { ExecutionRecord } from '@/lib/execution'
import type { AuditEvent } from '@/lib/audit'

export interface ExecutionStore {
  get(id: string): ExecutionRecord | undefined
  put(record: ExecutionRecord, idempotencyKey?: string): void
  update(record: ExecutionRecord): void
  getByIdempotencyKey(key: string, ownerWallet: string): ExecutionRecord | undefined
  addAudit(event: AuditEvent): void
  getAudit(executionId: string): AuditEvent[]
}

class MemoryExecutionStore implements ExecutionStore {
  private records = new Map<string, ExecutionRecord>()
  private idempotency = new Map<string, string>()
  private audits = new Map<string, AuditEvent[]>()

  get(id: string) { return this.records.get(id) }

  put(record: ExecutionRecord, idempotencyKey?: string) {
    this.records.set(record.id, record)
    if (idempotencyKey) this.idempotency.set(`${record.ownerWallet}:${idempotencyKey}`, record.id)
  }

  update(record: ExecutionRecord) { this.records.set(record.id, record) }

  getByIdempotencyKey(key: string, ownerWallet: string) {
    const id = this.idempotency.get(`${ownerWallet}:${key}`)
    return id ? this.records.get(id) : undefined
  }

  addAudit(event: AuditEvent) {
    const existing = this.audits.get(event.executionId) ?? []
    this.audits.set(event.executionId, [...existing, event])
  }

  getAudit(executionId: string) { return this.audits.get(executionId) ?? [] }
}

export const executionStore: ExecutionStore = new MemoryExecutionStore()
