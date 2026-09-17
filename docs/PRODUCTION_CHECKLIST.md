# Flitzr Production Checklist

## Core execution
- [x] Intent parsing
- [x] Policy evaluation
- [x] Execution state machine
- [x] Provider abstraction
- [x] Audit event model
- [x] Preview-only execution endpoint
- [ ] Persistent execution database
- [ ] Idempotency keys
- [ ] Wallet signature/approval UX
- [ ] Transaction submission
- [ ] Confirmation watcher

## Provider layer
- [x] Bankr adapter
- [x] Definitive adapter
- [ ] Uniswap adapter
- [ ] Provider health checks
- [ ] Quote expiry validation
- [ ] Retry/backoff policy

## Security
- [x] Server-only secrets
- [x] Policy gate before execution
- [x] Explicit approval state
- [ ] Authentication/session binding
- [ ] Per-user policy storage
- [ ] Rate limiting
- [ ] Replay protection
- [ ] Structured server audit storage

## Hackathon demo
- [ ] Wallet connect
- [ ] DCA demo
- [ ] Limit demo
- [ ] Approval gate demo
- [ ] Social strategy/leaderboard view
- [ ] Recorded demo
- [ ] Submission package

Flitzr should not move from preview-only to live execution until the unchecked security and persistence controls are implemented and tested.
