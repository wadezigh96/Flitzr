# Flitzr Demo Script

## 90-second flow

**1. The problem — 10s**

Most AI trading agents can parse a sentence. The dangerous part is what happens after the decision. Flitzr puts **Defencial** — a deterministic control layer — between intent and money.

**2. Natural language — 15s**

Enter:

`DCA $20 of ETH every week on Base`

Show the parsed DCA intent and the $20 amount.

**3. Defencial — 15s**

Show:

- Base
- $25 single-trade limit
- $100 daily budget
- approval required above $25

The model proposes. Defencial decides whether execution may proceed.

**4. Providers — 15s**

- Bankr — agent / wallet layer
- Definitive Flash — DCA / limit planning
- Uniswap — Base spot quotes
- Dynamic — agent server wallet on Base

Planner stays preview-only until approval.

**5. Dynamic evidence — 15s**

Open https://flitzr.vercel.app/api/dynamic/status

Show `ready: true` and the pinned address `0xC9d6d9a9D059c6E3F41744FeD834bE818DB389e8`.

**6. Guardrail — 10s**

`Buy $150 of ETH on Base` — blocked by the $100 daily Defencial.

`Buy $50 of ETH on Base` — allowed inside daily budget, approval required above $25.

**7. Close — 10s**

Flitzr is not an LLM with a wallet. It is Defencial-gated execution: intent, Defencial, quote, approval, sign, settle.

## Rules

Do not show API keys. Do not claim x402 is paid unless the response is HTTP 402 then a verified retry. Do not call `/api/dynamic/status` as a wallet factory — the address is pinned.
