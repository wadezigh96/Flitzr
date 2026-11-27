# Spec: configurable limits, evaluation history, Jira issue panel

Status: implemented (tickets 01–04 on branch
`feat/configurable-limits-history-panel`, 25 Nov 2026); deploy and
live verification are ticket 05. The Problem Statement below describes
the pre-upgrade app.

## Problem Statement

Flitzr evaluates proposed spending against hard-coded demo limits (USD 25 single, USD 100 daily) through one Rovo action. The Codegeist judges' first criterion asks whether the app feels like a genuine, working, non-trivial implementation rather than a single hard-coded demo path, and the second asks for a complete, coherent product experience rather than a technical proof of concept. One action with fixed numbers and no visible surface inside Jira scores weakly on both, even though the evaluation itself is correct and verified.

## Solution

Make the demo policy configurable per installation, record every evaluation in a short history, and show the check inside Jira where the work happens. A teammate can ask the Rovo agent to change the limits, ask what they are, and ask for recent evaluations; a Jira user can run the same check from an issue panel and see the same history. The demo defaults stay USD 25 / USD 100, so the demo video and its cases keep working exactly as recorded.

## User Stories

1. As a finance teammate, I want to ask the Rovo agent whether a proposed expense fits, so that I get a decision against our limits.
2. As a teammate, I want to ask the agent what our current limits are, so that I know the guardrails before proposing spend.
3. As a teammate, I want to tell the agent new limits, so that the guardrails match our team's demo budget.
4. As a teammate, I want the new limits to apply to every later evaluation on our site, so that the whole team shares one budget.
5. As a teammate, I want the demo defaults (USD 25 / USD 100) to apply when no limits were set, so that the app works immediately after install.
6. As a teammate, I want to ask the agent for recent evaluations, so that I can see what was checked and decided.
7. As a Jira user, I want to open an issue and see the Flitzr panel, so that I can check spend in the context of the work.
8. As a Jira user, I want to enter an amount and spent-today in the panel and see the decision, so that I do not have to switch to chat.
9. As a Jira user, I want the panel to show recent evaluations, so that I can see the history without asking the agent.
10. As a judge, I want the demo cases from the video (20+30 allow, 30+20 approval, 21+80 block) to still produce the same decisions, so that the submission stays consistent with its video.
11. As a teammate, I want invalid amounts (missing, negative, non-numeric) to be rejected with a clear error, so that no evaluation is recorded from bad input.
12. As a teammate, I want only successful evaluations recorded in history, so that the history reflects real checks.
13. As a teammate, I want the history to keep only the most recent 20 evaluations, so that old checks do not accumulate without bound.
14. As an MCP user, I want to invoke the read-only tools (evaluate, get-limits, list-recent) from my own agent, so that the guardrails work outside Rovo.
15. As a teammate, I want to change limits only through the Rovo agent (not via MCP), so that limit changes stay a deliberate human step.

## Implementation Decisions

- New Rovo actions: get-limits, set-limits, list-recent-evaluations. All three are exposed to the Flitzr Finance Guardian agent; get-limits and list-recent join the MCP tools list, set-limits does not (see ADR 0002).
- New module: a Jira issue panel showing the check form, the decision, and recent history.
- The agent prompt is updated to describe configurable limits and the new actions, keeping the existing rules (never invent amounts, never claim funds moved).
- Evaluation reads the installation limits from storage and falls back to the demo defaults when unset. The pure decision logic stays a separate function so the existing tests keep passing against the defaults.
- Every successful evaluation appends one history record; history is capped at 20 records, newest first. Rejected inputs are not recorded.
- New limits follow the evaluator's validation: positive finite numbers; the daily limit must not be below the single limit.
- Storage is the Key-Value Store (`@forge/kvs`): one key for the limits (`config:limits`), one key holding the history array (`history:recent`, capped at 20). The legacy `storage` module from `@forge/api` is unsupported and must not be used; the npm package `@forge/storage` is an internal shared library, not the app-facing API. See ADR 0003 and the research file.
- The panel is built with UI Kit (`@forge/react`): no bundler or build step, the manifest resource points at the source file. See ADR 0004 and the research file.
- One new scope: `storage:app` (Forge storage access). No Jira API scopes: the panel uses only the issue key from context and app resolvers, with no Jira API reads. Confirm with `forge lint` at build time.
- Before 5 Jan 2027, apps defining `rovo:mcp` must also define `app.rovo` metadata or future deployments are blocked. Add it now if the rovo-mcp reference shows the required shape; otherwise leave a note in the ticket-04 docs.

## Testing Decisions

- Test external behavior only (decisions, stored limits, history contents), never implementation details.
- The existing 14 tests keep passing unchanged: they exercise the defaults behavior.
- New tests cover: limits round-trip (set, then evaluate uses the new limits), defaults fallback on an unset installation, invalid limit rejection, history append and the 20-record cap, history excluding rejected inputs, and get/list actions returning what was stored.
- The panel's resolvers are tested through the same seams as the actions. Panel rendering itself is verified live on the demo site; the repo has no headless UI test harness.
- Prior art: node:test with node:assert/strict in test/, no test framework dependency.

## Out of Scope

- Real transactions, payments, and bank or wallet connections. Explicitly not wanted.
- An admin page for limits. The Rovo action is the editing seam; the panel is for checking and viewing.
- Per-user limits, and roles or permissions enforcement for set-limits. Documented demo limitation.
- Teamwork Graph integration, Marketplace listing, video re-record, thumbnail and gallery images.
- Changing the demo cases or the demo video.

## Further Notes

- The Devpost text and repo docs said the limits are hard-coded; the
  repo docs were updated in ticket 04, and the Devpost texts are
  drafted for ticket 05 (publish only after production is verified).
- Deploy needs a fresh Atlassian API token login; the 18 Nov login did not persist in this VM and the old token must be revoked, not reused. Build and unit tests do not need a login.
- Forge CLI here: ~/workspace/forge-cli, run with XDG_CONFIG_HOME=/tmp/forge-xdg and FORGE_DISABLE_ANALYTICS=1 (see AGENTS.md for why).
