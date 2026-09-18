# Hackathon Submission — Flitzr

## Project Name
Flitzr

## Tagline
Defencial-first autonomous onchain financial agent on Base — natural language goals to structured, gated execution with Privy wallet authentication, Dynamic server wallets, and multi-provider routing

## Short Description (card / list)
Flitzr turns natural-language financial goals into Defencial-controlled execution plans on Base. Intent is parsed, checked against deterministic single-trade and daily limits, routed to Bankr / Definitive / Uniswap, and only advanced after explicit approval when required. Privy authenticates the user wallet. A Dynamic Server Wallet supports agent-side payment readiness. Preview-first: the AI never broadcasts transactions on its own.

## Why not just Bankr / MetaMask Agent / HeyAnon
Bankr, HeyAnon, and Griffain optimize conversational execution. MetaMask Agent and Coinbase Agents optimize wallet policy inside a single vendor. Flitzr is the control plane in between: the model proposes, **Defencial** decides, providers execute, Privy signs user funds, Dynamic holds the agent wallet. User wallet ≠ agent wallet. Preview-first. Public evidence at `/api/dynamic/status`.

## Live Dynamic evidence

https://flitzr.vercel.app/api/dynamic/status

Pattern: server-wallet on Base (8453). After the pin deploy, status must not mint a new wallet per request.

## Links
- GitHub: https://github.com/wadezigh96/flitzr
- Live: https://flitzr.vercel.app
- Dynamic status: https://flitzr.vercel.app/api/dynamic/status
- Demo script: docs/DEMO_SCRIPT.md
- Competitors: docs/COMPETITORS.md
- Form paste: docs/FORM_COPY.md
- Demo video: (add Loom / YouTube / X — required for online)

## Tracks
1. Bankr grand prize
2. Dynamic — Best Agentic Wallet or Payment Experience
3. Definitive Flash — if DCA/limit is shown
4. Uniswap — if Base spot routing is shown

## Team
Solo

## Deadline
Saturday, September 19, 2026, 4 PM EDT. Online entries need a recorded demo.
