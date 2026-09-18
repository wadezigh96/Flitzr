# Runtime form — paste this

## Project name
Flitzr

## Tagline
Defencial-first autonomous financial agent on Base.

## Short description
Flitzr turns natural-language financial goals into Defencial-controlled execution plans on Base. Intent is parsed, checked against deterministic single-trade and daily limits, routed to Bankr, Definitive, and Uniswap, and only advanced after explicit approval when required. Privy authenticates the user wallet. A Dynamic Server Wallet supports agent-side payment readiness. Preview-first: the AI never broadcasts on its own.

## Links
- App: https://flitzr.vercel.app
- GitHub: https://github.com/wadezigh96/flitzr
- Dynamic status: https://flitzr.vercel.app/api/dynamic/status
- Demo script: https://github.com/wadezigh96/flitzr/blob/main/docs/DEMO_SCRIPT.md

## Tracks
- Bankr grand prize
- Dynamic — Best Agentic Wallet or Payment Experience
- Definitive Flash (if you show DCA / limit)
- Uniswap (if you show Base spot quote)

## Dynamic reviewer note
Pattern: server wallets (API token, developer-owned).
Job: after Defencial gates an intent, the agent can use a Dynamic server wallet on Base for signing / payment readiness. User funds stay on the Privy-authenticated user wallet.
Evidence: lib/dynamic.ts and GET /api/dynamic/status.

## After deploy of commit 8c9455a+
Status should stay on one pinned address and must not mint a new wallet per request.
If the live JSON details still say "created" or the address changes, Redeploy main on Vercel.
