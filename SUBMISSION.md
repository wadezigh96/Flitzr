# Hackathon Submission — Flitzr

## Project Name
Flitzr

## Tagline
Defencial-first autonomous onchain financial agent on Base — natural language goals to structured, gated execution with Dynamic server wallets and multi-provider routing

## Short Description (card / list)
Flitzr turns natural-language financial goals into Defencial-controlled execution plans on Base. Intent is parsed, checked against deterministic single-trade and daily limits, routed to Bankr / Definitive / Uniswap, and only advanced after explicit approval when required. The agent uses Dynamic Server Wallets for signing and payment readiness (including x402); user funds stay under the user’s SIWE wallet. Preview-first: the AI never broadcasts transactions on its own.

## Full Description

### Problem
Most “agent” finance apps either (a) let models call tools with weak guardrails, or (b) hard-code a single DEX with no shared Defencial or audit trail. Reviewers cannot see a clear path from intent → decision → wallet action, and agent payments rarely use a documented wallet pattern.

### Solution
Flitzr is a **Defencial-first** agent runtime on **Base (8453)**:

1. **Structured pipeline** — Intent → deterministic Defencial → provider routing → explicit approval → signing → settlement / audit. No silent broadcasts.

2. **Multi-provider routing** — Bankr (agent/wallet ops), Definitive Flash (DCA/limit), Uniswap Trading API (Base spot), under one Defencial engine and idempotent execution ledger.

3. **Dynamic Server Wallets** — Documented agent wallet pattern (API token auth, developer-owned wallets). The agent can sign and support payment flows (x402-compatible readiness) after Defencial gates. User wallets remain separate via SIWE sessions.

4. **x402 v2** — Premium resources protected by the official `@x402/next` payment proxy on Base USDC.

5. **Auditability** — Optional Postgres persistence; public Dynamic status endpoint for reviewers without exposing secrets.

### Why this is differentiated
- Preview-first safety model (Defencial + approval before state change)
- Real Dynamic **server wallet** integration (`lib/dynamic.ts`, `GET /api/dynamic/status`)
- Same project can opt into Bankr grand prize + Dynamic + Definitive + Uniswap tracks
- Production-shaped stack: Next.js 16, TypeScript, CI typecheck + build, Vercel deploy

### How to run
```bash
git clone https://github.com/wadezigh96/flitzr.git
cd flitzr
npm install
cp .env.example .env.local
# Set AUTH_SECRET, DYNAMIC_AUTH_TOKEN, DYNAMIC_ENVIRONMENT_ID, provider keys as needed
npm run dev
```

### Links (paste into form)
- **GitHub:** https://github.com/wadezigh96/flitzr
- **Live app:** https://flitzr.vercel.app
- **Dynamic status (reviewers):** https://flitzr.vercel.app/api/dynamic/status
- **Dynamic track guide:** https://runtime.nyc/tracks/dynamic
- **Demo video:** (add your Loom / YouTube / X recording — required for online)

### Tracks to select
1. **Bankr grand prize** — automatically eligible  
2. **Dynamic** — Best Agentic Wallet or Payment Experience (server wallets)  
3. **Definitive Flash** — Best Social Trading Build (if DCA/limit demo is shown)  
4. **Uniswap** — New Assets, New Agents (if Uniswap integration is highlighted)

### Dynamic track — what to tell reviewers
- **Pattern:** Server wallets (API token; wallets belong to developer account)
- **Job:** Agent evaluates Defencial-gated financial intents, then uses Dynamic to sign / prepare payment actions on Base
- **Evidence:** `lib/dynamic.ts` · `GET /api/dynamic/status` · README Dynamic section · recorded demo of intent → Defencial → Dynamic readiness/action
- **Separation:** User SIWE wallet for user funds; Dynamic server wallet for agent-side actions only

### Team
Solo

### Deadline reminder
Submit project links by **Saturday, September 19, 2026, 4 PM EDT**. Demos start 5 PM EDT. Online submissions must include a recorded demo.
