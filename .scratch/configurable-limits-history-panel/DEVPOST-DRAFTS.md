# Devpost drafts for the Flitzr upgrade (tickets 01–03)

Status: PUBLISHED to the Devpost form on 25 Nov 2026 ~02:21 WIB (ticket 05
complete: production v3.0.0 deployed and verified live). The live form
(submission ID 1313154) now carries these texts; submission still
SUBMITTED 5/5.

All drafts below match the shipped behavior on branch
`feat/configurable-limits-history-panel`: four Rovo actions (evaluate,
get-limits, set-limits, list-recent-evaluations), limits configurable
per installation with demo defaults USD 25 single / USD 100 daily, a
history of the most recent 20 evaluations, a Jira issue panel, MCP
tools limited to the three read-only ones, one scope (`storage:app`),
38 automated tests. No draft claims the limits are hard-coded.

The demo cases still produce the decisions the video shows (verified
by the test suite against the demo defaults): USD 20 + USD 30 spent
is allowed (projected USD 50, remaining USD 50); USD 30 + USD 20
spent needs human approval; USD 21 + USD 80 spent is blocked
(projected USD 101).

## 1. About the project (Project details) — full replacement

Flitzr Finance Guardian is an Atlassian Forge app that helps teams review proposed operational spending before anyone takes action.

A Rovo agent, Flitzr Finance Guardian, talks through a proposed expense in Jira or Confluence: it identifies the amount in USD and the confirmed spend already used today, and asks the user when either value is missing or ambiguous instead of inventing financial amounts. It then invokes a deterministic Forge action that evaluates the proposal against the installation's spending limits: a maximum single expense and a maximum projected daily spend, configurable per installation (demo defaults USD 25 and USD 100 until a teammate changes them). The action returns a reproducible decision: within both limits, human approval required (above the single limit), or blocked (projected daily spend above the daily limit), plus the projected spend and remaining demo budget.

Every successful evaluation is recorded in a short history (the most recent 20, newest first), which teammates can ask the agent about. The same check is available from a Flitzr panel on Jira issues, where a user enters an amount and spent-today, sees the decision, and sees the same history.

The read-only tools (evaluate, get-limits, list-recent) are exposed through a Rovo MCP module, so custom agents in Rovo Studio and MCP-compatible AI clients can use the same guardrails. Changing limits stays with the Rovo agent by design: set-limits is not exposed through MCP.

Flitzr is evaluation-only by design. It does not connect to wallets or bank accounts, fetch live balances, sign transactions, submit orders, transfer funds, or claim that money moved. A policy result is guidance for human review, not payment authorization.

### Testing instructions for judges

1. Use an Atlassian Cloud site with Rovo enabled. Rovo requires a paid plan; a Standard or Premium trial includes it.
2. Install Flitzr from the installation link below (no configuration steps and no extra integrations are required).
3. Open Flitzr Finance Guardian in Rovo.
4. Try the demo cases: a USD 20 expense with USD 30 already spent today is allowed, with a projected daily spend of USD 50 and USD 50 of demo budget remaining; a USD 30 expense with USD 20 already spent is within the daily budget, but human approval is required (above USD 25); a USD 21 expense with USD 80 already spent is blocked, because the projected daily spend would be USD 101.
5. Try an invalid case, for example a missing amount: the agent asks for the confirmed values instead of guessing.
6. Ask the agent "What are our current spending limits?" (demo defaults USD 25 single, USD 100 daily), then "Set the single limit to USD 50 and the daily limit to USD 200" and re-run the USD 30 + USD 20 case: it is now allowed instead of needing approval, because the new limits apply. Ask "What did we check recently?" to see the evaluation history. Set the limits back to USD 25 and USD 100 afterwards so the demo cases above keep working.
7. On a Jira issue, open the Flitzr Finance Guardian panel (in the issue ••• menu) and run the same USD 20 + USD 30 check: it returns the same allowed decision, and the panel lists the recent evaluations.
8. To try the MCP tools in Rovo Studio, use the "Flitzr Finance Controls" MCP server exposed by the installed app. External MCP exposure is disabled by default; a site or org admin enables it per installation under Apps > Sites > your site > Connected apps. The MCP endpoint is `https://mcp.atlassian.com/forge/0a82f923-7358-413b-b86f-0f88a9e53a47`. The MCP tools are the read-only ones (evaluate, get-limits, list-recent); set-limits is available through the Rovo agent only.
9. Note: the USD 25 and USD 100 figures are the demo defaults, not live balances. An installation can change them through the Rovo agent; until it does, the defaults apply.

## 2. Testing instructions or credentials (Additional info) — full replacement

1. Use an Atlassian Cloud site with Rovo enabled. Rovo requires a paid plan; a Standard or Premium trial includes it.
2. Install Flitzr from the installation link below (no configuration steps and no extra integrations are required).
3. Open Flitzr Finance Guardian in Rovo.
4. Try the demo cases:
   - USD 20 expense with USD 30 already spent today: allowed, projected daily spend USD 50, remaining demo budget USD 50.
   - USD 30 expense with USD 20 already spent today: within the daily budget, but human approval is required (above USD 25).
   - USD 21 expense with USD 80 already spent today: blocked, projected daily spend would be USD 101.
5. Try an invalid case, for example a missing amount: the agent asks for the confirmed values instead of guessing.
6. Ask the agent "What are our current spending limits?" (demo defaults USD 25 single, USD 100 daily), then "Set the single limit to USD 50 and the daily limit to USD 200" and re-run the USD 30 + USD 20 case: it is now allowed instead of needing approval, because the new limits apply. Ask "What did we check recently?" to see the evaluation history. Set the limits back to USD 25 and USD 100 afterwards so the demo cases above keep working.
7. On a Jira issue, open the Flitzr Finance Guardian panel (in the issue ••• menu) and run the same USD 20 + USD 30 check: it returns the same allowed decision, and the panel lists the recent evaluations.
8. To try the MCP tools in Rovo Studio, use the "Flitzr Finance Controls" MCP server exposed by the installed app. External MCP exposure is disabled by default; a site or org admin enables it per installation under Apps > Sites > your site > Connected apps. The MCP endpoint is `https://mcp.atlassian.com/forge/0a82f923-7358-413b-b86f-0f88a9e53a47`. The MCP tools are the read-only ones (evaluate, get-limits, list-recent); set-limits is available through the Rovo agent only.
9. Note: the USD 25 and USD 100 figures are the demo defaults, not live balances. An installation can change them through the Rovo agent; until it does, the defaults apply.

## 3. Explain how your project meets the main technology requirement — full replacement

Flitzr is built on Atlassian Forge and integrated with Rovo. Its manifest.yml declares Forge functions, four Rovo action modules (evaluate, get-limits, set-limits, list-recent-evaluations), a rovo:agent, a rovo:mcp module, and a jira:issuePanel module (UI Kit, @forge/react, no bundler). The actions run a deterministic policy evaluator (src/index.js) with strict input validation and 38 automated tests (npm test, Node.js built-in test runner). Limits and history live in the Forge Key-Value Store (@forge/kvs, src/storage.js), scoped per installation; the manifest carries the storage:app scope. No Jira or Confluence API scopes are required: the app makes no Atlassian API calls and reads no Jira or Confluence data beyond the issue key passed in context.

## 4. How I built it — full replacement

Flitzr is built on Atlassian Forge, integrated with Rovo. Its manifest.yml declares Forge functions, four Rovo actions, a rovo:agent, a rovo:mcp module, and a jira:issuePanel module. The actions run a deterministic policy evaluator with strict input validation and 38 automated tests. Limits and history live in the Forge Key-Value Store, scoped per installation; the manifest carries the storage:app scope and no Jira or Confluence API scopes.

Flitzr was my first Forge app, and I built it working with an AI coding assistant. I directed the work — designing the product, deciding what each Forge module should do, and writing and reviewing code — while the assistant helped implement features and fix errors.

## 5. Accomplishments I'm proud of — full replacement

- The real demo: verified end to end on a test site. A USD 20 expense with USD 30 already spent today is allowed, with a projected daily spend of USD 50 and USD 50 of demo budget remaining. A USD 21 expense with USD 80 already spent is blocked, because the projected daily spend would be USD 101.
- The agent never guesses: when an amount is missing or ambiguous, it asks the user for the confirmed values instead of inventing financial amounts.
- The limits are configurable per installation, with a short evaluation history: a teammate can ask the agent to change the limits or to list recent evaluations, and the same check runs from a panel on Jira issues.
- The read-only tools are exposed as MCP tools, so custom agents in Rovo Studio can use the same guardrails.

## 6. What's next — full replacement

- Approval workflows: add approval workflows for spends that need a manager's sign-off, with a human in the loop for edge cases.
- Richer history: keep a longer, searchable evaluation history with filters, beyond the current 20 most recent evaluations.
- Deeper Jira integration: make Flitzr available across the Atlassian suite, starting with deeper integration into Jira and Confluence, so teams can manage spending from anywhere they work.

## Do NOT change

Title, tagline, video URL, installation link, category, bonus prize,
"Try it out" links, Built With tags, dates, submitter info, AI tools
field, attestations, existing-project explanation, category
explanation, Forge experience field.
