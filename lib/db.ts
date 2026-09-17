import { sql } from '@vercel/postgres'
import type { ExecutionRecord } from '@/lib/execution'
import type { AuditEvent } from '@/lib/audit'

export async function ensureDatabase() {
  if (!process.env.POSTGRES_URL) return false
  await sql`CREATE TABLE IF NOT EXISTS flitzr_executions (
    id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    intent TEXT NOT NULL,
    amount_usd NUMERIC NOT NULL,
    owner_wallet TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    provider TEXT,
    quote_id TEXT,
    tx_hash TEXT,
    error TEXT
  )`
  await sql`CREATE TABLE IF NOT EXISTS flitzr_idempotency (
    owner_wallet TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    execution_id TEXT NOT NULL REFERENCES flitzr_executions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (owner_wallet, idempotency_key)
  )`
  await sql`CREATE TABLE IF NOT EXISTS flitzr_audit_events (
    id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL,
    event TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB
  )`
  return true
}

export async function persistExecution(record: ExecutionRecord) {
  if (!process.env.POSTGRES_URL) return
  await ensureDatabase()
  await sql`
    INSERT INTO flitzr_executions (id,state,chain_id,intent,amount_usd,owner_wallet,created_at,updated_at,provider,quote_id,tx_hash,error)
    VALUES (${record.id},${record.state},${record.chainId},${record.intent},${record.amountUsd},${record.ownerWallet},${record.createdAt},${record.updatedAt},${record.provider ?? null},${record.quoteId ?? null},${record.txHash ?? null},${record.error ?? null})
    ON CONFLICT (id) DO UPDATE SET state=EXCLUDED.state,updated_at=EXCLUDED.updated_at,provider=EXCLUDED.provider,quote_id=EXCLUDED.quote_id,tx_hash=EXCLUDED.tx_hash,error=EXCLUDED.error
  `
}

export async function persistIdempotency(ownerWallet: string, key: string, executionId: string) {
  if (!process.env.POSTGRES_URL) return
  await ensureDatabase()
  await sql`INSERT INTO flitzr_idempotency (owner_wallet,idempotency_key,execution_id) VALUES (${ownerWallet},${key},${executionId}) ON CONFLICT DO NOTHING`
}

export async function findPersistentExecution(id: string) {
  if (!process.env.POSTGRES_URL) return undefined
  await ensureDatabase()
  const { rows } = await sql`SELECT * FROM flitzr_executions WHERE id=${id} LIMIT 1`
  const row = rows[0] as Record<string, unknown> | undefined
  if (!row) return undefined
  return rowToExecution(row)
}

export async function findPersistentByIdempotency(key: string, ownerWallet: string) {
  if (!process.env.POSTGRES_URL) return undefined
  await ensureDatabase()
  const { rows } = await sql`SELECT e.* FROM flitzr_executions e JOIN flitzr_idempotency i ON i.execution_id=e.id WHERE i.idempotency_key=${key} AND i.owner_wallet=${ownerWallet} LIMIT 1`
  const row = rows[0] as Record<string, unknown> | undefined
  return row ? rowToExecution(row) : undefined
}

export async function persistAudit(event: AuditEvent) {
  if (!process.env.POSTGRES_URL) return
  await ensureDatabase()
  await sql`INSERT INTO flitzr_audit_events (id,execution_id,event,timestamp,metadata) VALUES (${event.id},${event.executionId},${event.event},${event.timestamp},${event.metadata ? JSON.stringify(event.metadata) : null}) ON CONFLICT (id) DO NOTHING`
}

function rowToExecution(row: Record<string, unknown>): ExecutionRecord {
  return {
    id: String(row.id), state: row.state as ExecutionRecord['state'], chainId: 8453, intent: row.intent as ExecutionRecord['intent'], amountUsd: Number(row.amount_usd), ownerWallet: String(row.owner_wallet), createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString(), provider: row.provider as ExecutionRecord['provider'], quoteId: row.quote_id ? String(row.quote_id) : undefined, txHash: row.tx_hash ? String(row.tx_hash) : undefined, error: row.error ? String(row.error) : undefined,
  }
}
