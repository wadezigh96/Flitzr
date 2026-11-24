# Flitzr Architecture

## Scope

This repository contains only the Atlassian Forge implementation of Flitzr Finance Guardian. Previous web, wallet, provider, and smart-contract code is not part of this project tree.

## Request flow

1. Rovo identifies a proposed expense and the confirmed amount already spent today.
2. If either amount is missing or ambiguous, Rovo asks the user instead of guessing.
3. The Forge action validates both numeric inputs independently.
4. The evaluator reads the installation limits from Forge storage, falling back to the demo defaults (USD 25 single, USD 100 daily) when nothing was set, and applies the demo policy.
5. A successful evaluation is recorded in the history (time, amounts, decision, issue key when in context). Rejected inputs are not recorded.
6. The action returns a decision, projected daily spend, remaining demo budget, and explicit non-execution flags.
7. Rovo explains the result and any human-approval requirement.

The Jira issue panel follows the same flow through Forge resolvers
(`evaluate`, `getLimits`, `listRecent` in `src/index.js`), which
delegate to the same handlers as the Rovo actions, so the panel and
the agent always agree. The panel reads the issue key from extension
context (`useProductContext`) and passes it to the evaluator.

## Demo policy

- Maximum single expense: USD 25 (demo default).
- Maximum daily spend: USD 100 (demo default).
- Above the single limit: human approval required, provided the daily cap is not exceeded.
- Projected daily spend above the daily limit: blocked.

The limits are configurable per installation: a teammate asks the
Rovo agent to change them (`set-limits` action), and every later
evaluation on that site uses the new limits. New limits must be
positive finite numbers, and the daily limit must not be below the
single limit. Until an installation sets its own, the demo defaults
apply. The values are demonstration values, not live balances or
financial advice, and are not connected to live financial accounts.

## Storage

Limits and history live in the Forge Key-Value Store (`@forge/kvs`;
see ADR 0003). All storage access goes through the thin wrapper in
`src/storage.js`, which takes a store object so tests can pass a
Map-backed fake.

- `config:limits` — one pair of numbers per installation. A missing
  key means the demo defaults apply.
- `history:recent` — one array holding the most recent 20 evaluation
  records, newest first. The 21st evaluation drops the oldest record.

KVS data is scoped per app installation automatically, so one site's
limits and history cannot leak into another's. The app needs the
`storage:app` scope and no Jira or Confluence API scopes: the panel
uses only the issue key from context and the app's own resolvers.

Known limitation: history uses a read-modify-write on a single array,
so two near-simultaneous evaluations can drop one record
(last-write-wins). Acceptable for a demo app; transactions could
remove the race later. The history is a short demo list, not a durable
audit log.

## Modules

- `rovo:agent` (Flitzr Finance Guardian) with four actions: evaluate,
  get-limits, set-limits, list-recent-evaluations.
- `rovo:mcp` (Flitzr Finance Controls) exposing the three read-only
  tools: evaluate, get-limits, list-recent-evaluations. Set-limits
  stays off MCP by design (ADR 0002), so limit changes stay a
  deliberate step through the Rovo agent.
- `jira:issuePanel` (Flitzr Finance Guardian) built with UI Kit
  (`@forge/react`, no bundler; see ADR 0004), with a resolver function
  in `src/index.js`.

## Trust boundaries

- Natural-language context is untrusted; the agent must not invent amounts.
- The action rejects missing, blank, malformed, negative, and non-finite numeric inputs.
- A policy result is not payment authorization.
- Jira issue context is not proof of a budget, bank balance, or completed transaction.
- The action cannot sign, submit, transfer, or broadcast funds.
- Storage is per installation; tenant data is never kept in module-level variables or in-memory caches, which could leak across tenants.

## Before production

Implement authenticated data sources, durable audit events (the
20-record history is a demo list, not an audit log), privacy and
retention controls, abuse testing, and a separately reviewed
human-approval workflow. Per-installation limits are already
implemented via Forge storage; per-user limits and roles for
set-limits are explicitly out of scope for the demo. Add Jira or
Confluence scopes only when a concrete API integration requires them.
