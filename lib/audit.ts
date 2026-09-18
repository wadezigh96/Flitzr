export type AuditEvent = {
  id: string
  executionId: string
  event:
    | 'planned'
    | 'defencial_checked'
    | 'policy_checked'
    | 'approval_requested'
    | 'approved'
    | 'rejected'
    | 'quoted'
    | 'signing'
    | 'submitted'
    | 'confirmed'
    | 'failed'
  timestamp: string
  metadata?: Record<string, string | number | boolean | null>
}

export function auditEvent(
  executionId: string,
  event: AuditEvent['event'],
  metadata?: AuditEvent['metadata'],
): AuditEvent {
  return {
    id: `audit_${crypto.randomUUID()}`,
    executionId,
    event,
    timestamp: new Date().toISOString(),
    metadata,
  }
}
