# Flitzr — Codegeist 2026 Submission Draft

Ready-to-paste draft for the Devpost form at
https://codegeist2026.devpost.com/. All submission materials must be in
English. Deadline: Tuesday, 22 December 2026, 12:00 pm Pacific Time
(23 December 2026, 03:00 WIB).

Status: draft prepared 18 November 2026. The installation link and the
demo video link are still placeholders; fill them in after deploy and
recording, then review and submit.

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

TODO — add after deploy. Create it with the Forge sharing flow
(`forge distribute` / installation link) and paste the link here and
into the Devpost form.

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
   MCP endpoint is `https://mcp.atlassian.com/forge/903e12c5-20be-48bd-a9b2-2f9d6ce524b6`.
7. Note: the USD 25 and USD 100 limits are hard-coded demonstration
   values, not live balances or customer-configured policies.

## Demo video

TODO — record only after the app is installed and verified on a test
site. Requirements: under 5 minutes, publicly visible on YouTube, shows
the project actually functioning. Follow `docs/DEMO_SCRIPT.md`
(2–3 minute outline). Paste the YouTube link here and into the
Devpost form.

## Links

- Source code: https://github.com/wadezigh96/Flitzr
- Forge build and launch guide:
  https://developer.atlassian.com/platform/forge/build-and-launch-your-forge-app/
- Codegeist 2026: https://codegeist2026.devpost.com/

## Pre-submit checklist

- [ ] `forge login` and `forge lint` pass with no errors.
- [ ] Deployed to development and installed on a test site.
- [ ] Rovo agent verified end to end on the test site.
- [ ] MCP tool discovery verified where Preview access is available.
- [ ] Installation link created and pasted above.
- [ ] Demo video recorded, uploaded publicly to YouTube, link pasted above.
- [ ] Owner reviewed this draft and the Devpost form, then submitted.
