# Flitzr Security Model

## Principle

Flitzr follows **intent → policy → approval → execution → confirmation**. No model response is itself authorization to move funds.

## API credentials

Sponsor API keys are server-side environment variables only. They must never be committed, rendered in the browser, or pasted into public issues/screenshots.

For Bankr, use least-privilege keys, read-only mode during development, IP allowlisting where practical, and a dedicated agent wallet. Bankr also supports recipient allowlists for relevant wallet operations.

## Transaction safety

- Reject malformed or missing amounts.
- Enforce chain and asset allowlists.
- Enforce per-action and daily budgets.
- Require explicit approval above the configured threshold.
- Display destination, asset, amount and provider before signing.
- Treat provider responses as untrusted until validated.
- Never assume a submitted transaction succeeded without confirmation.

## Secrets

Required local variables:

```text
BANKR_API_KEY=
DEFINITIVE_API_KEY=
```

Use Vercel environment variables for deployment. `.env.local` remains local and is ignored by Git.

## Production hardening checklist

- [ ] Add authenticated user sessions.
- [ ] Bind policies to a user/wallet identity.
- [ ] Add persistent execution ledger with idempotency keys.
- [ ] Add rate limiting on agent and execution endpoints.
- [ ] Add server-side audit logs without secrets.
- [ ] Add replay protection for approvals.
- [ ] Add provider timeout/retry policies.
- [ ] Add monitoring and alerting.
- [ ] Run testnet/small-fund validation before enabling live execution.
