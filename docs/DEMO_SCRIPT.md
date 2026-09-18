# Flitzr Demo Script

## 90-second flow

**1. The problem — 10s**

Bankr, HeyAnon, Griffain can parse a sentence and fire a trade. The failure mode is already public: prompt injection has drained agent wallets on Base. Flitzr puts **Defencial** between intent and money.

**2. Natural language — 15s**

Enter:

`DCA $20 of ETH every week on Base`

Show the parsed DCA intent and the $20 amount.

**3. Defencial — 15s**

- Base
- $25 single-trade limit
- $100 daily budget
- approval required above $25

The model proposes. Defencial decides.

**4. Separation of wallets — 15s**

- User funds: Privy session, user signs
- Agent: Dynamic server wallet on Base — open `/api/dynamic/status`
- Rails: Bankr / Definitive / Uniswap — planner stays preview-only

**5. Guardrail — 15s**

`Buy $150 of ETH on Base` — blocked by the $100 daily Defencial.

`Buy $50 of ETH on Base` — inside daily budget, approval required above $25.

**6. Close — 20s**

We are not replacing Bankr or MetaMask. They are rails and wallets. Flitzr is the gate: intent, Defencial, quote, approval, sign, settle. Never broadcast blind.

## Rules

No API keys on screen. Do not claim x402 is paid unless the response is HTTP 402. Confirm Dynamic status address does not change between two refreshes before recording.
