# Flitzr

**Understand the work. Check the spend. Keep humans in control.**

Flitzr is a finance-agent project. Its Codegeist 2026 submission track is a dedicated Atlassian Forge and Rovo prototype: a deterministic evaluator for proposed spending.

## Codegeist 2026 — Flitzr Finance Guardian

The Forge prototype includes:

- **Rovo Agent:** Flitzr Finance Guardian explains budget exposure and approval requirements.
- **Policy action:** checks explicitly supplied USD amounts against illustrative demo limits.
- **Rovo MCP:** exposes the policy action to customer-created Rovo agents (Preview capability).
- **Read-only boundary:** this Forge prototype does not connect to wallets, sign transactions, submit orders, transfer funds, or access live financial balances.

### Demo policy

| Rule | Demo value |
|---|---:|
| Maximum single action | USD 25 |
| Maximum daily spend | USD 100 |
| Above single-action limit | Human approval required |
| Projected daily spend above limit | Blocked |

These are illustrative demo values, not live balances, customer policies, or financial advice.

## Forge app files

- `manifest.yml` — Forge app ID, modules, Rovo Agent, action, and MCP declaration.
- `src/index.js` — deterministic policy evaluator.
- `docs/CODEGEIST-2026.md` — submission scope and implementation notes.
- `docs/DEMO_SCRIPT.md` — draft demo sequence.
- `docs/PRODUCTION_CHECKLIST.md` — validation and readiness checklist.

The Atlassian Forge App ID is configured in `manifest.yml`. The app has **not** yet been validated, deployed, or installed in an Atlassian development site.

### Development workflow

1. Install and authenticate the Forge CLI.
2. From the repository root, run `forge lint` and resolve all manifest issues.
3. Test the policy function and review the package.
4. Only after validation, explicitly approve deployment to a development environment and installation on a test Atlassian site.

Do not deploy to production or submit to Devpost before end-to-end testing and final review.

## Existing Flitzr platform — separate from Codegeist prototype

This repository also retains the earlier Next.js/Base application and its wallet, provider, x402, execution-ledger, and Solidity components. Those components are **not used by the Forge prototype**.

Important distinction: the existing web application has wallet-based signing and order-submission flows after explicit user approval. Therefore, only the Forge prototype is described as read-only; the entire Flitzr repository/application must not be represented as read-only.

These legacy platform files are retained for now to avoid deleting existing product functionality. They are outside the Codegeist demo scope.

## Safety

**The model proposes. Deterministic policy evaluates. A human remains in control.**

Never commit credentials, private keys, seed phrases, or `.env.local`. Never connect the legacy wallet execution path to the Forge prototype without a separate security review and explicit approval.

## Links

- Web app: https://flitzr.vercel.app
- GitHub: https://github.com/wadezigh96/Flitzr
- Atlassian Forge build guide: https://developer.atlassian.com/platform/forge/build-and-launch-your-forge-app/
- Codegeist 2026: https://codegeist2026.devpost.com/
