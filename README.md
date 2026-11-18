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

## Install and try it

Install Flitzr on an Atlassian Cloud site with Rovo enabled (Rovo
requires a paid plan; a Standard or Premium trial includes it) using
the installation link:

https://developer.atlassian.com/console/install/0a82f923-7358-413b-b86f-0f88a9e53a47?signature=AYABeEAhf%2BkjQ%2BUOoBaJzLckiR4AAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucBpIdHuyGQrMLmmRtRx4AVJgAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDHrNsZ6WZ1v5l24HjAIBEIA7C9HJpD79XF6EtsoXTfp7seGUw252rGB3RCq2yKH8TKM3ETRITAsTrX375%2FLfPc819ko7YPTsGrivZKwAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgETn5MW%2B%2FEGzq%2B5JvIi9kWcAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQML%2BkVWfydNPqIILWLAgEQgDu82RjZuMGFeewjwIDrTiGp4QrzHCoGy4%2BPHaEJtmlVAeYsFqKlukqCNxBfV2%2B%2BSEbriEAE7%2BmVj7csVAAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEAU1n%2FDAgwnH6bkTBguWEUU0AAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAwQGFZpWFHCIv0VJj4CARCAO4SHvJ4pWZU1enVZg6zj1t41ITkIxgVAGDtguqsVLW%2F%2FH91ErXfplBoN6de4ZHqtPtdl%2BxQlEVHf9YqhAgAAAAAMAAAQAAAAAAAAAAAAAAAAANOkJngBqIDz8jHVQjxn3tf%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADLdnqJgQMyeftCBLEYuhWZmg7IPgw7Aqyf9MDDli7IHWaHBgOEjaBevJJIvnaWY%2F2HnwUkiaKUJUl6IYB7VX%2B9zpZo%3D&product=jira

Then open Flitzr Finance Guardian in Rovo Chat and try the demo cases:

- USD 20 expense with USD 30 already spent today: allowed, projected
  daily spend USD 50, remaining demo budget USD 50.
- USD 30 expense with USD 20 already spent today: within the daily
  budget, but human approval is required (above USD 25).
- USD 21 expense with USD 80 already spent today: blocked, projected
  daily spend would be USD 101.

The same policy action is also exposed as an MCP tool ("Flitzr Finance
Controls") at `https://mcp.atlassian.com/forge/0a82f923-7358-413b-b86f-0f88a9e53a47`.
External MCP exposure is disabled by default; a site or org admin
enables it per installation under Apps > Sites > your site >
Connected apps. Full judge instructions live in
`docs/SUBMISSION.md`.

## Safety boundary

This Forge app is an **evaluation-only prototype**. It does not connect to wallets or bank accounts, fetch verified financial balances, sign transactions, submit orders, transfer funds, or broadcast transactions. It must never claim that money moved.

The action requires an explicit proposed amount and an explicit confirmed daily-spend value. Missing, blank, malformed, negative, or non-finite values are rejected rather than guessed.

## Repository layout

- `manifest.yml` — Forge app, Rovo agent, action, and MCP declarations.
- `src/index.js` — deterministic policy evaluator.
- `test/index.test.js` — built-in Node.js tests.
- `docs/ARCHITECTURE.md` — request flow and trust boundaries.
- `docs/AUDIT-2026-11-18.md` — full audit report.
- `docs/CODEGEIST-2026.md` — project scope and remaining work.
- `docs/DEMO_SCRIPT.md` — demo outline.
- `docs/PRODUCTION_CHECKLIST.md` — validation and release checklist.
- `docs/SECURITY.md` — security boundary and threat considerations.
- `docs/SUBMISSION.md` — Devpost submission draft and judge instructions.
- `LICENSE` — MIT license.

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

The app is deployed to development and production (version 2.0.0) and
was installed and verified on a demo site on 18 November 2026; see
`docs/SUBMISSION.md` for the current status.

## App identity

The registered Forge app ID is configured in `manifest.yml`. Do not run `forge register` again unless Atlassian app registration has been deliberately reviewed; re-registering can create a different app identity.

## Project links

- Repository: https://github.com/wadezigh96/Flitzr
- Atlassian Forge build and launch guide: https://developer.atlassian.com/platform/forge/build-and-launch-your-forge-app/
- Codegeist 2026: https://codegeist2026.devpost.com/
