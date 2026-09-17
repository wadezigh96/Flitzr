# Flitzr

<div align="center">

**Defencial Autonomous Financial Agent on Base**

[![Base](https://img.shields.io/badge/Base-Mainnet_8453-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://base.org)
[![Runtime](https://img.shields.io/badge/Runtime_NYC-Sep_13–19_2026-FF4D00?style=for-the-badge)](https://runtime.nyc/handbook)
[![Privy](https://img.shields.io/badge/Privy-Wallet_Auth-7C3AED?style=for-the-badge)](https://www.privy.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)

**Natural language → Defencial → providers → approval → signing → settlement**

[Live App](https://flitzr.vercel.app) · [Submission](SUBMISSION.md)

</div>

---

## About Flitzr

Flitzr is an autonomous onchain financial agent designed to turn natural-language financial goals into controlled execution plans on **Base**.

Instead of allowing an AI agent to execute transactions freely, Flitzr introduces **Defencial** — a deterministic control layer that evaluates spending limits, daily budgets, and approval requirements before execution.

### How it works

**Intent → Defencial → Approval → Quote → Sign → Submit**

Users describe what they want, for example:

> “DCA $20 of ETH every week.”

Flitzr interprets the intent, checks it against the configured Defencial, prepares a provider quote, and requires explicit wallet approval and signing before an order can be submitted.

### Core features

- 🤖 **Autonomous financial agent** — converts natural-language instructions into structured execution plans.
- 🛡️ **Defencial guardrails** — deterministic spending and approval controls independent of the AI.
- 🔐 **Privy wallet authentication** — wallet sessions are protected without Flitzr handling private keys.
- ⛓️ **Base Mainnet** — designed for onchain financial operations on Base.
- 🔄 **Multi-provider execution** — supports integrations such as Bankr, Definitive, and Uniswap.
- ✍️ **Explicit transaction signing** — users remain in control of final transaction authorization.
- 📊 **Execution timeline** — users can see each stage from planning through submission.
- 🧩 **Tokenized stocks interface** — provides an interface for tokenized-asset workflows alongside crypto operations.

### The principle

**Autonomous finance should automate execution without removing user control.**

The agent can plan and coordinate actions, but deterministic Defencial rules and explicit wallet signing remain between the user's intent and onchain execution.

---

## Why Flitzr

| Feature | Typical agent app | **Flitzr** |
|---------|-------------------|------------|
| Intent | Free-form tools | **Structured plans** from natural language |
| Safety | Soft prompts | **Deterministic Defencial** (single-trade + daily limits) |
| Execution | Agent broadcasts | **Preview-first** — never auto-broadcasts |
| Wallet | User only | **Privy wallet authentication** + **Dynamic server wallet** for agent actions |
| Payments | Ad-hoc | **x402 v2** + agent payment readiness |
| Routing | Single DEX | **Bankr · Definitive · Uniswap** under one Defencial |
| Audit | Logs optional | **Idempotent ledger** + optional Postgres audit |

---

## Architecture

```mermaid
flowchart TB
    subgraph Flitzr["Flitzr Runtime"]
        U[User intent NL] --> P[Plan API]
        P --> POL[Deterministic Defencial engine]
        POL -->|allowed| R[Provider router]
        POL -->|blocked| X[Reject / explain]
        R --> B[Bankr]
        R --> D[Definitive Flash]
        R --> UNI[Uniswap Base]
        R --> DYN[Dynamic server wallet]
        POL --> APP[Explicit approval]
        APP --> LED[Idempotent execution ledger]
        DYN -->|sign / pay readiness| LED
        LED --> AUD[Audit trail]
    end

    U2[User wallet via Privy] -.->|authenticated session| P
    U2 -->|signs user funds| LED
    X402[x402 premium resource] -.->|HTTP 402| DYN
```

---

## Dynamic integration (Runtime track)

Flitzr uses Dynamic **Server wallets** for agent-side wallet and payment actions. User wallet authentication is handled by Privy.

| Pattern | Ownership | Auth | In Flitzr |
|---------|-----------|------|-----------|
| **Server wallets** | Developer account | API token | **Yes** — agent payments & signing |
| Agent wallets | Dynamic user | User JWT | Future |
| Delegated access | End-user embedded wallet | User-approved materials | Future |

**Agent flow**

1. Defencial evaluates intent (limits + rules).
2. On approval, the agent may use a Dynamic server wallet on **Base** to sign or prepare payment actions, including x402-style flows.
3. **User funds** still require the user's own Privy-authenticated wallet and explicit signature. Agent wallet ≠ user wallet.

**Reviewer endpoint:** [`GET /api/dynamic/status`](https://flitzr.vercel.app/api/dynamic/status) — configured / ready / address (no secrets).

Code: [`lib/dynamic.ts`](lib/dynamic.ts) · Docs: [Agents Overview](https://www.dynamic.xyz/docs/overview/agents/overview) · [Agent Payments](https://www.dynamic.xyz/docs/overview/agents/agent-payments)

---

## Provider model

| Provider | Role | State |
|----------|------|-------|
| **Bankr** | Agent + wallet operations | Server adapter / quotes |
| **Definitive Flash** | DCA + limit planning | Server quote / order adapter |
| **Uniswap** | Base spot routing | Trading API quote adapter |
| **Dynamic** | Agent server wallet + payment signing | Optional server-wallet adapter |
| **x402** | Premium resource payments | `@x402/next` payment proxy |

---

## Safety model

Flitzr is **preview-first**. An AI suggestion never directly broadcasts a transaction. State-changing actions must pass deterministic Defencial and, when required, explicit user approval. API keys are server-only and must never be committed or exposed to the browser.

---

## Quick start

```bash
git clone https://github.com/wadezigh96/flitzr.git
cd flitzr
npm install
cp .env.example .env.local
# Fill PRIVY_APP_ID, PRIVY_APP_SECRET, NEXT_PUBLIC_PRIVY_APP_ID and provider keys as needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Main API surfaces

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/plan` | Parse & evaluate intent with Defencial |
| POST | `/api/execution` | Idempotent Defencial-checked plan |
| POST | `/api/execution/approve` | Explicit approval |
| POST | `/api/execution/quote` | Provider quote preview |
| POST | `/api/execution/signing-payload` | Prepare typed signing payload |
| POST | `/api/execution/submit` | Verify signature and submit order |
| GET | `/api/execution/audit` | Authenticated audit history |
| GET | `/api/x402/premium` | x402-protected resource |
| GET | `/api/dynamic/status` | Dynamic server wallet readiness |

---

## Project structure

```
flitzr/
├── app/                 # Next.js App Router + API routes
├── components/
├── lib/
│   ├── auth.ts          # Legacy SIWE helpers / compatibility
│   ├── privy.ts         # Privy server-side authentication
│   ├── defencial.ts     # Deterministic Defencial limits
│   ├── execution.ts / ledger.ts / audit.ts
│   ├── bankr.ts / definitive.ts / uniswap.ts
│   ├── dynamic.ts       # Dynamic server wallets
│   └── x402.ts
├── proxy.ts             # x402 payment proxy
├── SUBMISSION.md        # Runtime form copy
└── README.md
```

---

## Tracks (Runtime NYC)

| Track | Integration |
|-------|-------------|
| **Bankr grand prize** | Defencial-first agent on Base |
| **Dynamic** | Server wallets for agentic wallet / payment experience |
| **Definitive Flash** | DCA / limit social trading build |
| **Uniswap** | Base spot routing / new assets agents |

Submit by **Saturday, September 19, 2026, 4 PM EDT**. Online entries need a recorded demo.

---

## CI

```bash
npm install
npx tsc --noEmit
npm run build
```

---

## Production checklist

- Stable Privy credentials and provider credentials
- Rate limiting, monitoring, receipt polling
- Small-fund / test validation before real money
- Dynamic: `DYNAMIC_AUTH_TOKEN` + `DYNAMIC_ENVIRONMENT_ID` set; `/api/dynamic/status` → `ready: true`

---

<div align="center">

**Built for Runtime NYC · Base · Bankr · Dynamic · Privy**  
*Plan with Defencial. Sign with intent. Never broadcast blind.*

[Live](https://flitzr.vercel.app) · [GitHub](https://github.com/wadezigh96/flitzr) · [Submission guide](SUBMISSION.md)

</div>
