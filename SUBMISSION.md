# Hackathon Submission — Flitzr

## Project Name
Flitzr

## Tagline
Defencial-first autonomous onchain financial agent on Base — natural language goals to structured, gated execution with Privy wallet authentication, Dynamic server wallets, and multi-provider routing

## Short Description (card / list)
Flitzr is an autonomous onchain financial agent designed to turn natural-language financial goals into controlled execution plans on Base. Instead of allowing an AI agent to execute transactions freely, Flitzr uses **Defencial** — a deterministic control layer for spending limits, daily budgets, and approval requirements. Intent is parsed, checked, routed to Bankr / Definitive / Uniswap, and only advanced after explicit approval when required. Privy handles the user's wallet authentication and signing flow, while Dynamic Server Wallets support agent-side signing and payment readiness, including x402-style flows. User funds remain under explicit user authorization. Preview-first: the AI never broadcasts transactions on its own.

## About Flitzr

Flitzr is built around a simple principle: **autonomous finance should automate execution without removing user control.**

### How it works

**Intent → Defencial → Approval → Quote → Sign → Submit**

A user describes a financial goal in natural language. Flitzr converts that goal into a structured intent, evaluates it against deterministic Defencial rules, selects an appropriate provider, prepares a quote, and requires explicit wallet signing before state-changing execution.

### Core features

- **Autonomous financial agent** — natural language to structured financial execution plans.
- **Defencial guardrails** — deterministic single-trade and daily budget controls with approval thresholds.
- **Privy wallet authentication** — authenticated wallet sessions without Flitzr handling private keys.
- **Base Mainnet** — onchain execution environment.
- **Multi-provider routing** — Bankr, Definitive Flash, and Uniswap integrations under one control layer.
- **Dynamic Server Wallets** — agent-side wallet and payment actions, including x402-compatible readiness.
- **Explicit signing** — user funds require the user's wallet signature.
- **Execution audit trail** — idempotent execution records and optional Postgres persistence.
- **Tokenized stocks interface** — tokenized-asset workflows presented alongside crypto operations.

## Problem
Most “agent” finance apps either (a) let models call tools with weak guardrails, or (b) hard-code a single DEX with no shared Defencial or audit trail. Reviewers cannot see a clear path from intent → decision → wallet action, and agent payments rarely use a documented wallet pattern.

## Solution
Flitzr is a **Defencial-first** agent runtime on **Base (8453)**:

1. **Structured pipeline** — Intent → deterministic Defencial → provider routing → explicit approval → signing → settlement / audit. No silent broadcasts.

2. **Multi-provider routing** — Bankr (agent/wallet ops), Definitive Flash (DCA/limit), Uniswap Trading API (Base spot), under one Defencial engine and idempotent execution ledger.

3. **Privy user wallet authentication** — Privy provides the authenticated user wallet session and client-side signing flow. User funds remain separate from the agent's server wallet.

4. **Dynamic Server Wallets** — documented agent wallet pattern (API token auth, developer-owned wallets). The agent can sign and support payment flows after Defencial gates.

5. **x402 v2** — premium resources protected by the official `@x402/next` payment proxy on Base USDC.

6. **Auditability** — optional Postgres persistence; public Dynamic status endpoint for reviewers without exposing secrets.

## Why this is differentiated
- Preview-first execution model with deterministic Defencial gates
- Explicit user signing between intent and state-changing execution
- Privy wallet authentication for the user experience
- Real Dynamic **server wallet** integration (`lib/dynamic.ts`, `GET /api/dynamic/status`)
- Multi-provider execution path across Bankr, Definitive, and Uniswap
- Production-shaped stack: Next.js 16, TypeScript, CI typecheck + build, Vercel deploy

## How to run
```bash
git clone https://github.com/wadezigh96/flitzr.git
cd flitzr
npm install
cp .env.example .env.local
# Set PRIVY_APP_ID, PRIVY_APP_SECRET, NEXT_PUBLIC_PRIVY_APP_ID and provider keys as needed
npm run dev
```

## Links (paste into form)
- **GitHub:** https://github.com/wadezigh96/flitzr
- **Live app:** https://flitzr.vercel.app
- **Dynamic status (reviewers):** https://flitzr.vercel.app/api/dynamic/status
- **Dynamic track guide:** https://runtime.nyc/tracks/dynamic
- **Demo video:** (add your Loom / YouTube / X recording — required for online)

## Tracks to select
1. **Bankr grand prize** — Defencial-first autonomous agent on Base  
2. **Dynamic** — Best Agentic Wallet or Payment Experience (server wallets)  
3. **Definitive Flash** — Best Social Trading Build (if DCA/limit demo is shown)  
4. **Uniswap** — New Assets, New Agents (if Uniswap integration is highlighted)

## Dynamic track — what to tell reviewers
- **Pattern:** Server wallets (API token; wallets belong to developer account)
- **Job:** Agent evaluates Defencial-gated financial intents, then uses Dynamic to sign / prepare payment actions on Base
- **User wallet:** Privy-authenticated wallet for user-owned funds and explicit transaction signing
- **Evidence:** `lib/dynamic.ts` · `GET /api/dynamic/status` · README Dynamic section · recorded demo of intent → Defencial → Dynamic readiness/action
- **Separation:** Dynamic server wallet for agent-side actions; user wallet remains under explicit user authorization

## Team
Solo

## Deadline reminder
Submit project links by **Saturday, September 19, 2026, 4 PM EDT**. Demos start 5 PM EDT. Online submissions must include a recorded demo.
