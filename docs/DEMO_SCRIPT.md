# Flitzr Demo Script

## 90-second flow

**1. The problem — 10s**

“Most AI trading agents can understand what I say, but the dangerous part is what happens after the decision. Flitzr puts a deterministic policy layer between intent and money.”

**2. Natural language — 15s**

Enter:

`DCA $20 of ETH every week on Base`

Show the parsed DCA intent and the $20 amount.

**3. Policy — 15s**

Show:

- Base
- $25 single-action approval threshold
- $100 daily budget
- approval boundary

Explain that the LLM proposes; the policy engine decides whether execution may proceed.

**4. Sponsor execution plan — 20s**

Show Definitive as the advanced-order execution adapter and Bankr as the agent/wallet layer. The planner stays preview-only until approval.

**5. Guardrail demo — 15s**

Enter:

`Buy $150 of ETH on Base`

Show that the $100 daily budget blocks the action.

Then enter:

`Buy $50 of ETH on Base`

Show that it is within the daily budget but requires approval above $25.

**6. Close — 15s**

“Flitzr is not an LLM with a wallet. It is a policy-controlled execution system: intent, policy, quote, approval, execution, confirmation.”

## Important demo rule

Do not expose API keys or private keys on screen. Use preview/read-only mode unless a real transaction is explicitly approved and funded for the demo.