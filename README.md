# Flitzr

**Autonomous onchain financial agent for Base.**

Flitzr converts natural-language financial goals into policy-controlled execution plans. The architecture is designed for sponsor integrations while keeping credentials server-side.

## Current foundation

- Next.js + TypeScript dashboard
- Base-first agent policy model
- Bankr Agent API server adapter
- Protected `/api/agent` route
- Definitive integration placeholder for advanced orders
- Uniswap routing planned as an execution adapter
- Environment template with no real secrets

## Architecture

`User → Flitzr → Policy Engine → Sponsor Adapter → Base`

The policy layer is intentionally explicit: maximum single trade, daily budget, network, and approval threshold can be enforced before execution adapters are allowed to transact.

## Environment

Copy `.env.example` to `.env.local` and add your own credentials locally or in Vercel environment variables. **Never commit API keys.**

```bash
BANKR_API_KEY=your_key
DEFINITIVE_API_KEY=your_key
```

Bankr's API key should remain server-side. Its current Agent API uses `POST /agent/prompt` and `GET /agent/job/{jobId}` with the `X-API-Key` header.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Roadmap

1. Connect the dashboard prompt to `/api/agent`.
2. Add policy evaluation before any write action.
3. Add Definitive Flash adapter and advanced order flows (DCA + limit).
4. Add Base wallet connection and transaction status.
5. Add Uniswap routing.
6. Add demo-ready strategy/social trading view.

## Security

Do not put Bankr or Definitive credentials in client-side code, GitHub, screenshots, or chat. Start with read-only/scoped keys and a dedicated agent wallet before enabling real-money execution.
