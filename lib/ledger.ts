import type { ExecutionRecord } from '@/lib/execution'

export interface ExecutionStore {
  get(id: string): ExecutionRecord | undefined
  put(record: ExecutionRecord): void
  update(record: ExecutionRecord): void
}

class MemoryExecutionStore implements ExecutionStore {
  private records = new Map<string, ExecutionRecord>()
  get(id: string) { return this.records.get(id) }
  put(record: ExecutionRecord) { this.records.set(record.id, record) }
  update(record: ExecutionRecord) { this.records.set(record.id, record) }
}

export const executionStore: ExecutionStore = new MemoryExecutionStore()
