# Flitzr — Codegeist 2026 Submission Draft

Ready-to-paste draft for the Devpost form at
https://codegeist2026.devpost.com/. All submission materials must be in
English. Deadline: Tuesday, 22 December 2026, 12:00 pm Pacific Time
(23 December 2026, 03:00 WIB).

Status: draft prepared 18 November 2026. Installation link filled in
18 November 2026 (production 2.0.0, Sharing with anyone, Jira).
Landing page deployed to Vercel 18 November 2026
(https://flitzr-lxug.vercel.app/). Demo
video uploaded publicly to YouTube 20 November 2026
(https://youtu.be/InF-f00m1oE, 1:34, under the 5-minute limit).
Ready to review and submit.

## Title

Flitzr — Finance Guardian for Atlassian

## Tagline

Understand the work. Check the spend. Keep humans in control.

## Category

**Apps for Business Teams.** Flitzr helps finance and operations
colleagues decide on proposed spending with the right information in
front of them.

## Bonus prizes

- **Best Agents — Rovo/Assignable agents.** Flitzr declares a
  `rovo:agent` module ("Flitzr Finance Guardian") with a dedicated
  policy-checking action.
- **Best app with Atlassian MCP.** Flitzr declares a `rovo:mcp` module
  ("Flitzr Finance Controls") exposing the same policy action as a tool
  for custom agents in Rovo Studio and for MCP-compatible AI clients.

## Description (for the Devpost form)

Flitzr Finance Guardian is an Atlassian Forge app that helps teams
review proposed operational spending before anyone takes action.

A Rovo agent, Flitzr Finance Guardian, talks through a proposed expense
in Jira or Confluence: it identifies the amount in USD and the confirmed
spend already used today, and asks the user when either value is missing
or ambiguous instead of inventing financial amounts. It then invokes a
deterministic Forge action that evaluates the proposal against
transparent demo guardrails: a maximum single expense of USD 25 and a
maximum projected daily spend of USD 100. The action returns a
reproducible decision: within both limits, human approval required
(above USD 25), or blocked (projected daily spend above USD 100), plus
the projected spend and remaining demo budget.

The same policy action is exposed through a Rovo MCP module, so custom
agents in Rovo Studio and MCP-compatible AI clients can use the same
guardrails.

Flitzr is evaluation-only by design. It does not connect to wallets or
bank accounts, fetch live balances, sign transactions, submit orders,
transfer funds, or claim that money moved. A policy result is guidance
for human review, not payment authorization.

## How it meets the technology requirement

Built on Atlassian Forge and integrated with Rovo:

- `manifest.yml` declares a Forge function, a Rovo `action`, a
  `rovo:agent`, and a `rovo:mcp` module.
- The action runs a deterministic policy evaluator (`src/index.js`)
  with strict input validation and 14 automated tests
  (`npm test`, Node.js built-in test runner).
- No Atlassian API scopes are required: the app makes no API calls and
  reads no Jira or Confluence data beyond the issue key passed in
  context.

## Installation link for judges

https://developer.atlassian.com/console/install/0a82f923-7358-413b-b86f-0f88a9e53a47?signature=AYABeEAhf%2BkjQ%2BUOoBaJzLckiR4AAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucBpIdHuyGQrMLmmRtRx4AVJgAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDHrNsZ6WZ1v5l24HjAIBEIA7C9HJpD79XF6EtsoXTfp7seGUw252rGB3RCq2yKH8TKM3ETRITAsTrX375%2FLfPc819ko7YPTsGrivZKwAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgETn5MW%2B%2FEGzq%2B5JvIi9kWcAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQML%2BkVWfydNPqIILWLAgEQgDu82RjZuMGFeewjwIDrTiGp4QrzHCoGy4%2BPHaEJtmlVAeYsFqKlukqCNxBfV2%2B%2BSEbriEAE7%2BmVj7csVAAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEAU1n%2FDAgwnH6bkTBguWEUU0AAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAwQGFZpWFHCIv0VJj4CARCAO4SHvJ4pWZU1enVZg6zj1t41ITkIxgVAGDtguqsVLW%2F%2FH91ErXfplBoN6de4ZHqtPtdl%2BxQlEVHf9YqhAgAAAAAMAAAQAAAAAAAAAAAAAAAAANOkJngBqIDz8jHVQjxn3tf%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADLdnqJgQMyeftCBLEYuhWZmg7IPgw7Aqyf9MDDli7IHWaHBgOEjaBevJJIvnaWY%2F2HnwUkiaKUJUl6IYB7VX%2B9zpZo%3D&product=jira

Distribution status: Sharing with anyone. Product: Jira. Shared
version: production 2.0.0, deployed 18 November 2026.

## Testing instructions for judges

1. Use an Atlassian Cloud site with Rovo enabled. Rovo requires a paid
   plan; a Standard or Premium trial includes it.
2. Install Flitzr from the installation link above (no configuration
   steps and no extra integrations are required).
3. Open Flitzr Finance Guardian in Rovo.
4. Try the demo cases:
   - USD 20 expense with USD 30 already spent today: allowed, projected
     daily spend USD 50, remaining demo budget USD 50.
   - USD 30 expense with USD 20 already spent today: within the daily
     budget, but human approval is required (above USD 25).
   - USD 21 expense with USD 80 already spent today: blocked, projected
     daily spend would be USD 101.
5. Try an invalid case, for example a missing amount: the agent asks
   for the confirmed values instead of guessing.
6. To try the MCP tools in Rovo Studio, use the "Flitzr Finance
   Controls" MCP server exposed by the installed app. External MCP
   exposure is disabled by default; a site or org admin enables it per
   installation under Apps > Sites > your site > Connected apps. The
   MCP endpoint is `https://mcp.atlassian.com/forge/0a82f923-7358-413b-b86f-0f88a9e53a47`.
7. Note: the USD 25 and USD 100 limits are hard-coded demonstration
   values, not live balances or customer-configured policies.

## Demo video

https://youtu.be/InF-f00m1oE

Uploaded publicly to YouTube 20 November 2026. Duration 1:34 (under
the 5-minute limit). Shows the landing page, the three verified demo
cases (allowed, human approval required, blocked), and the MCP
module. Paste this link into the Devpost form.

## Links

- Live landing page: https://flitzr-lxug.vercel.app/
- Source code: https://github.com/wadezigh96/Flitzr
- Forge build and launch guide:
  https://developer.atlassian.com/platform/forge/build-and-launch-your-forge-app/
- Codegeist 2026: https://codegeist2026.devpost.com/

## Pre-submit checklist

- [x] `forge login` and `forge lint` pass with no errors (18 Nov 2026).
- [x] Deployed to development (version 2.0.0, 18 Nov 2026).
- [x] Deployed to production (version 2.0.0, 18 Nov 2026).
- [x] Installed on a test site (demo site one-atlas-idsa.atlassian.net, Jira, 18 Nov 2026).
- [x] Rovo agent verified end to end on the test site (USD 20 case: allowed, projected USD 50, 18 Nov 2026).
- [ ] MCP tool discovery verified where Preview access is available (endpoint verified live 18 Nov 2026: unauthenticated requests return 401 as expected; full tool listing via an MCP client not yet done).
- [x] Installation link created and pasted above (Sharing with anyone, Jira, 18 Nov 2026).
- [x] Demo video recorded, uploaded publicly to YouTube, link pasted above.
- [ ] Owner reviewed this draft and the Devpost form, then submitted.
