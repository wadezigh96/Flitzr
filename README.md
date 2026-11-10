# Flitzr

**Understand the work. Check the spend. Keep humans in control.**

Flitzr is a finance-agent control platform. Its Codegeist 2026 direction brings a deterministic, read-only finance policy evaluator into Atlassian through Forge and Rovo.

## Codegeist 2026: Flitzr Finance Guardian

The Forge prototype includes:

- Rovo Agent — Flitzr Finance Guardian: explains budget exposure and approval requirements for finance-related work.
- Deterministic policy action: checks a proposed USD amount against explicit demo limits.
- Rovo MCP exposure: declares the policy evaluator as a tool for customer-created Rovo agents (Preview capability).
- Human control: the Forge prototype cannot sign, submit, transfer, or broadcast funds.

### Demo policy

| Rule | Demo value |
|---|---:|
| Maximum single action | USD 25 |
| Maximum daily spend | USD 100 |
| Above single-action limit | Human approval required |
| Projected daily spend above limit | Blocked |

These values are illustrative defaults, not live balances, account policies, or financial advice.

## Forge app

The Forge app lives alongside the existing Flitzr platform:

- manifest.yml — Forge modules, Rovo Agent, action, MCP declaration.
- src/index.js — deterministic policy evaluator.
- docs/CODEGEIST-2026.md — project scope and implementation notes.
- docs/DEMO_SCRIPT.md — draft demo sequence.
- docs/PRODUCTION_CHECKLIST.md — validation and submission checklist.

### Setup

1. Create a Forge app in the Atlassian Developer Console.
2. Replace the placeholder app.id in manifest.yml with the generated Forge app ID.
3. Install the Forge CLI and authenticate.
4. From the repository root, validate with forge lint, then deploy and install on a development site.

Use a development environment and test Atlassian site first. Do not deploy to production or submit to Devpost before review and approval.

## Existing Flitzr platform

The existing Next.js application, Base integrations, Privy wallet authentication, Dynamic server-wallet adapter, provider adapters, execution ledger, x402 components, and Solidity utility contract are retained as separate infrastructure.

They are not called by the initial Forge prototype. The Forge app deliberately does not connect wallets or perform onchain execution.

## Safety principle

**The model proposes. Deterministic policy evaluates. A human remains in control.**

Never commit credentials, private keys, seed phrases, or .env.local. Do not enable live financial execution through the Forge prototype.

## Links

- Web app: https://flitzr.vercel.app
- GitHub: https://github.com/wadezigh96/Flitzr
- Atlassian Forge docs: https://developer.atlassian.com/platform/forge/
- Codegeist 2026: https://codegeist2026.devpost.com/
