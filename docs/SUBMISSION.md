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
Submitted to Codegeist 2026 on Devpost 20 November 2026 (submission
ID 1313154, https://devpost.com/software/flitzr-finance-guardian-for-atlassian).
Category: Apps for Business Teams. Bonus prize selected: Best Agents
(the Devpost form allows only one bonus prize choice, so the MCP bonus
could not be selected as well; the MCP module is described in the
submitted project description). The submission stays editable until
the deadline.

Note (25 Nov 2026): the live Devpost edit form held a different,
longer project story than this draft. That form text described features
the app does not have (a finance dashboard, Jira issue panel, admin
page, webtrigger, monthly budgets) and a USD 80 demo case whose numbers
were wrong (80 + 20 = 100 does not exceed the USD 100 daily budget; the
correct outcome is human approval required, not denied). It also linked
to https://flitzr-lxug.vercel.app/install, which returns a Vercel 404.
The form was corrected to match this draft on 25 Nov 2026 (6 fields
replaced, verified on the public page; submission still SUBMITTED, 5/5
steps).

Note (25 Nov 2026, upgrade): configurable limits, evaluation history,
and a Jira issue panel are implemented on branch
`feat/configurable-limits-history-panel` (tickets 01–04) and are NOT
yet deployed. The Devpost drafts for the upgrade live in
`.scratch/configurable-limits-history-panel/DEVPOST-DRAFTS.md` and
must only be published after the upgrade is deployed and verified
live (ticket 05). The sections below already describe the upgraded
app as shipped on that branch.

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
  `rovo:agent` module ("Flitzr Finance Guardian") with four actions:
  evaluate the policy, read the limits, change the limits, and list
  recent evaluations.
- **Best app with Atlassian MCP.** Flitzr declares a `rovo:mcp` module
  ("Flitzr Finance Controls") exposing the three read-only tools
  (evaluate, get-limits, list-recent) for custom agents in Rovo
  Studio and for MCP-compatible AI clients.

Note: the Devpost form allows only one bonus prize choice. Best Agents
was selected on 20 November 2026; the MCP module is still described in
the submitted project description.

## Description (for the Devpost form)

Flitzr Finance Guardian is an Atlassian Forge app that helps teams
review proposed operational spending before anyone takes action.

A Rovo agent, Flitzr Finance Guardian, talks through a proposed expense
in Jira or Confluence: it identifies the amount in USD and the confirmed
spend already used today, and asks the user when either value is missing
or ambiguous instead of inventing financial amounts. It then invokes a
deterministic Forge action that evaluates the proposal against the
installation's spending limits: a maximum single expense and a maximum
projected daily spend, configurable per installation (demo defaults
USD 25 and USD 100 until a teammate changes them). The action returns a
reproducible decision: within both limits, human approval required
(above the single limit), or blocked (projected daily spend above the
daily limit), plus the projected spend and remaining demo budget.

Every successful evaluation is recorded in a short history (the most
recent 20, newest first), which teammates can ask the agent about.
The same check is available from a Flitzr panel on Jira issues, where
a user enters an amount and spent-today, sees the decision, and sees
the same history.

The read-only tools (evaluate, get-limits, list-recent) are exposed
through a Rovo MCP module, so custom agents in Rovo Studio and
MCP-compatible AI clients can use the same guardrails. Changing limits
stays with the Rovo agent by design: set-limits is not exposed
through MCP.

Flitzr is evaluation-only by design. It does not connect to wallets or
bank accounts, fetch live balances, sign transactions, submit orders,
transfer funds, or claim that money moved. A policy result is guidance
for human review, not payment authorization.

## How it meets the technology requirement

Built on Atlassian Forge and integrated with Rovo:

- `manifest.yml` declares Forge functions, four Rovo `action` modules
  (evaluate, get-limits, set-limits, list-recent-evaluations), a
  `rovo:agent`, a `rovo:mcp` module, and a `jira:issuePanel` module
  (UI Kit, `@forge/react`, no bundler).
- The actions run a deterministic policy evaluator (`src/index.js`)
  with strict input validation and 38 automated tests
  (`npm test`, Node.js built-in test runner).
- Limits and history live in the Forge Key-Value Store (`@forge/kvs`,
  `src/storage.js`), scoped per installation; the manifest carries
  the `storage:app` scope. No Jira or Confluence API scopes are
  required: the app makes no Atlassian API calls and reads no Jira or
  Confluence data beyond the issue key passed in context.

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
6. Ask the agent "What are our current spending limits?" (demo
   defaults USD 25 single, USD 100 daily), then "Set the single limit
   to USD 50 and the daily limit to USD 200" and re-run the USD 30 +
   USD 20 case: it is now allowed instead of needing approval, because
   the new limits apply. Ask "What did we check recently?" to see the
   evaluation history. Set the limits back to USD 25 and USD 100
   afterwards so the demo cases above keep working.
7. On a Jira issue, open the Flitzr Finance Guardian panel (in the
   issue ••• menu) and run the same USD 20 + USD 30 check: it returns
   the same allowed decision, and the panel lists the recent
   evaluations.
8. To try the MCP tools in Rovo Studio, use the "Flitzr Finance
   Controls" MCP server exposed by the installed app. External MCP
   exposure is disabled by default; a site or org admin enables it per
   installation under Apps > Sites > your site > Connected apps. The
   MCP endpoint is `https://mcp.atlassian.com/forge/0a82f923-7358-413b-b86f-0f88a9e53a47`.
   The MCP tools are the read-only ones (evaluate, get-limits,
   list-recent); set-limits is available through the Rovo agent only.
9. Note: the USD 25 and USD 100 figures are the demo defaults, not
   live balances. An installation can change them through the Rovo
   agent; until it does, the defaults apply.

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
- [x] MCP tool discovery verified end to end 25 Nov 2026: the
  "Evaluate finance policy" tool is listed in Rovo Studio and on the
  agent profile, MCP exposure on the demo site was enabled during the
  check (it had been disabled), and invoking the tool through the Rovo
  agent returned the expected result (USD 20 + USD 30 spent: allowed,
  projected USD 50, remaining USD 50).
- [x] Installation link created and pasted above (Sharing with anyone, Jira, 18 Nov 2026).
- [x] Demo video recorded, uploaded publicly to YouTube, link pasted above.
- [x] Owner reviewed this draft and the Devpost form, then submitted (20 Nov 2026, submission ID 1313154, https://devpost.com/software/flitzr-finance-guardian-for-atlassian).

## Upgrade checklist (25 Nov 2026, ticket 05 — not done)

- [ ] `forge lint` passes on branch `feat/configurable-limits-history-panel`.
- [ ] Upgrade deployed to development and production.
- [ ] Rovo agent verified end to end on the demo site: configurable
  limits (set, then evaluate uses them), history (list-recent),
  panel (same decisions as the agent).
- [ ] Devpost drafts in
  `.scratch/configurable-limits-history-panel/DEVPOST-DRAFTS.md`
  published to the Devpost form and verified on the public page.
