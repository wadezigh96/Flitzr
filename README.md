# Flitzr — Finance Guardian for Atlassian

**Understand the work. Check the spend. Keep humans in control.**

Flitzr is an Atlassian Forge app prototype with a Rovo agent and a deterministic finance-policy action. It evaluates a proposed expense against clearly labelled demo limits and explains when human approval is required.

## What it does

- **Rovo Agent — Flitzr Finance Guardian:** helps teams review proposed operational spending.
- **Deterministic policy action:** validates supplied USD amounts and returns a reproducible decision.
- **Rovo MCP declaration:** exposes the policy action as a tool for Rovo (MCP availability is a Preview capability and must be verified in the target site).
- **Human control:** identifies approval requirements; it does not authorize or execute payments.

## Demo policy (illustrative only)

| Rule | Value |
| --- | ---: |
| Maximum single expense | USD 25 |
| Maximum daily spend | USD 100 |
| Single expense above USD 25 | Human approval required |
| Projected daily spend above USD 100 | Blocked |

These are hard-coded demonstration values. They are not live balances, financial advice, or customer-configured policies.

## Safety boundary

This Forge app is an **evaluation-only prototype**. It does not connect to wallets or bank accounts, fetch verified financial balances, sign transactions, submit orders, transfer funds, or broadcast transactions. It must never claim that money moved.

The action requires an explicit proposed amount and an explicit confirmed daily-spend value. Missing, blank, malformed, negative, or non-finite values are rejected rather than guessed.

## Repository layout

- `manifest.yml` — Forge app, Rovo agent, action, and MCP declarations.
- `src/index.js` — deterministic policy evaluator.
- `test/index.test.js` — built-in Node.js tests.
- `docs/ARCHITECTURE.md` — request flow and trust boundaries.
- `docs/CODEGEIST-2026.md` — project scope and remaining work.
- `docs/DEMO_SCRIPT.md` — demo outline.
- `docs/PRODUCTION_CHECKLIST.md` — validation and release checklist.
- `docs/SECURITY.md` — security boundary and threat considerations.

## Local checks

Requires Node.js 20 or newer.

```bash
npm test
```

Install and authenticate the Atlassian Forge CLI separately, then run:

```bash
forge lint
forge install --help
```

Do not run `forge deploy`, install the app, or submit the project until the manifest, action contract, and development-site behavior have been reviewed and explicitly approved.

## App identity

The registered Forge app ID is configured in `manifest.yml`. Do not run `forge register` again unless Atlassian app registration has been deliberately reviewed; re-registering can create a different app identity.

## Project links

- Repository: https://github.com/wadezigh96/Flitzr
- Atlassian Forge build and launch guide: https://developer.atlassian.com/platform/forge/build-and-launch-your-forge-app/
- Codegeist 2026: https://codegeist2026.devpost.com/
