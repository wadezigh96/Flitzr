# Flitzr

**Policy-first autonomous onchain financial agent for Base.**

Flitzr turns natural-language financial goals into structured, policy-controlled execution plans. The system separates intent, deterministic policy, provider routing, explicit approval, signing, and settlement confirmation.

## Current stack

- Next.js 16 + React 19 + TypeScript
- Base Mainnet (chain ID 8453)
- SIWE-style wallet authentication with signed session cookie
- Deterministic policy engine with single-trade and daily limits
- Idempotent execution ledger
- Persistent PostgreSQL execution + audit storage when `POSTGRES_URL` is configured
- Bankr Agent/Wallet API adapter
- Definitive Flash adapter for DCA/limit quote and order flows
- Uniswap Trading API quote adapter for Base spot routing
- **Dynamic Server Wallets** for agentic wallet + payment actions (x402 / agent signing)
- x402 v2 premium resource protected by the x402 Next payment proxy
- Tokenized-stock dashboard with Base ERC-20 transfers
- GitHub Actions typecheck + production build validation

## Safety model

Flitzr is **preview-first**. An AI suggestion never directly broadcasts a transaction. State-changing actions must pass the deterministic policy and, when required, an explicit user approval. The user's wallet is responsible for signing wallet transactions.

When Dynamic Server Wallets are configured, the **agent** can hold a developer-owned server wallet and sign payment / policy-gated actions. User funds and SIWE sessions remain separate. API keys are server-only and must never be committed to GitHub or exposed to the browser.

## Dynamic integration (Runtime track)

Flitzr uses the **Server wallets** pattern from Dynamic:

| Pattern | Ownership | Auth | Used in Flitzr |
| --- | --- | --- | --- |
| Server wallets | Developer account | API token | Yes – agent payments & signing |
| Agent wallets | Dynamic user | User JWT | Future |
| Delegated access | End-user embedded wallet | User-approved materials | Future |

**What the agent does with Dynamic**

1. Policy engine evaluates the intent (single-trade + daily limits).
2. If approved, the agent can use a Dynamic server wallet on Base to sign messages or prepare payment headers (including x402 flows).
3. Live money movement for user funds still requires the user’s own wallet signature.

**Status endpoint (for reviewers / demo)**  
`GET /api/dynamic/status` — returns whether the server wallet is configured and ready (never leaks secrets).

**Setup**

1. Create an environment at [app.dynamic.xyz](https://app.dynamic.xyz).
2. Enable embedded / server wallets and Base (EVM).
3. Create an API token and set:

```text
DYNAMIC_AUTH_TOKEN=
DYNAMIC_ENVIRONMENT_ID=
```

4. Install the SDK:

```bash
npm i @dynamic-labs-wallet/node-evm @dynamic-labs-wallet/node
```

See [Agents Overview](https://www.dynamic.xyz/docs/overview/agents/overview) and [Agent Payments](https://www.dynamic.xyz/docs/overview/agents/agent-payments).

## Environment

Copy `.env.example` to `.env.local` and configure secrets locally or in Vercel:

```text
BANKR_API_KEY=
DEFINITIVE_API_KEY=
UNISWAP_API_KEY=
AUTH_SECRET=
POSTGRES_URL=
X402_PAY_TO=
X402_PRICE_USDC=0.01
X402_FACILITATOR_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
DYNAMIC_AUTH_TOKEN=
DYNAMIC_ENVIRONMENT_ID=
```

Use separate, least-privileged production credentials. Never paste secrets into chat, issues, commits, or screenshots.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Main API surfaces

- `POST /api/auth/nonce` — create wallet authentication nonce
- `POST /api/auth/verify` — verify signed wallet session
- `POST /api/auth/logout` — revoke the browser session cookie
- `POST /api/plan` — parse and evaluate an intent
- `POST /api/execution` — create an idempotent, policy-checked execution plan
- `POST /api/execution/approve` — explicit approval transition
- `GET /api/execution/audit?executionId=...&walletAddress=...` — authenticated audit history
- `POST /api/quote` — provider quote preview
- `GET /api/x402/premium` — x402-protected premium resource
- `GET /api/dynamic/status` — Dynamic server wallet readiness (Runtime track)

## Provider model

| Provider | Role | Current state |
| --- | --- | --- |
| Bankr | Agent + wallet operations | Server adapter / quote support |
| Definitive Flash | DCA + advanced order planning | Server quote/order adapter |
| Uniswap | Base spot routing | Server quote adapter |
| **Dynamic** | Agent server wallet + payment signing | Server wallet adapter (optional) |

Live money movement remains deliberately gated behind user-controlled wallet signing and provider-specific validation.

## CI

Every push to `main` and feature branches runs:

```bash
npm install
npx tsc --noEmit
npm run build
```

## Production checklist

Before enabling real-money execution, configure a stable `AUTH_SECRET`, PostgreSQL, provider credentials, rate limiting, monitoring, provider-specific order validation, transaction receipt polling, and small-fund/testnet validation. Confirm the exact provider response and transaction before marking an execution `confirmed`.

For the Dynamic track, also confirm:

- `DYNAMIC_AUTH_TOKEN` + `DYNAMIC_ENVIRONMENT_ID` are set
- `GET /api/dynamic/status` returns `ready: true`
- Demo shows the agent decision → policy check → Dynamic server-wallet action (with tx hash or signature evidence where applicable)
