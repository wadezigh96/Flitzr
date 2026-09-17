# Flitzr Architecture

## Product
Flitzr is a policy-first autonomous onchain financial agent for Base. The agent may interpret natural language, but execution is always constrained by explicit policy and a user approval boundary.

## System flow

```text
Browser
  │
  ├── Wallet session (Base)
  │
  ▼
Next.js App
  │
  ├── Intent Parser
  ├── Policy Engine ───────────────┐
  ├── Execution Planner            │ deny / approval required
  │                                │
  ├── Sponsor Adapters ◄───────────┘
  │     ├── Bankr Agent / Wallet API
  │     ├── Definitive Flash
  │     └── Uniswap routing
  │
  ▼
Approval Gate
  │
  ▼
Transaction / Order Executor
  │
  ▼
Base Mainnet
```

## Trust boundaries

1. **Client boundary** — wallet address, UI state and user intent only. Never expose sponsor API keys.
2. **Server boundary** — sponsor credentials, policy evaluation and quote orchestration.
3. **Approval boundary** — state-changing actions require an explicit user confirmation when policy says approval is required.
4. **Chain boundary** — transaction/order IDs are persisted as references; the app does not assume success until the provider/chain confirms it.

## Core modules

- `lib/policy.ts` — deterministic policy evaluation.
- `lib/bankr.ts` — Bankr Agent API adapter.
- `lib/definitive.ts` — Definitive Flash adapter.
- `app/api/plan` — intent → policy → quote planning endpoint.
- `app/api/agent` — protected server-side Bankr prompt endpoint.
- `app/page.tsx` — demo dashboard.

## Execution states

`draft → planned → quoted → approval_required → signing → submitted → confirmed`

Failure states are terminal for that attempt: `rejected`, `expired`, `failed`, or `cancelled`.

## Policy model

The first demo policy is:

- Chain: Base
- Max daily budget: $100
- Approval threshold: $25
- No state-changing execution from the planner

The policy engine must remain deterministic and independent of the LLM. The LLM can propose an intent; it cannot override policy.

## Sponsor strategy

Bankr is the agent/wallet orchestration layer. Definitive is the advanced-order execution layer. Base is the settlement chain. Uniswap is an optional routing layer for spot swaps. Sponsor adapters must be replaceable so Flitzr is not coupled to a single provider.

## Security

- Keep `BANKR_API_KEY` and `DEFINITIVE_API_KEY` server-only.
- Prefer least-privilege API keys and read-only mode during development.
- Use a dedicated agent wallet for automated execution.
- Add recipient allowlists and IP allowlists where supported.
- Never store private keys in the repository.
- Never auto-submit a state-changing transaction merely because an LLM produced a plan.

## Demo narrative

1. User states a financial goal.
2. Flitzr converts it into a structured intent.
3. Policy engine explains exactly what is allowed.
4. Sponsor adapter produces a quote/order plan.
5. User sees the route, amount, limits and approval requirement.
6. Only after approval can the execution layer submit a real action.

This separation makes the system auditable, testable and easier to extend with additional sponsors.