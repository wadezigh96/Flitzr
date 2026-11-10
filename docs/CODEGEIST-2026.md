# Flitzr — Codegeist 2026

## Product direction

Flitzr Finance Guardian is a finance-operations control prototype for Atlassian teams.

**Tagline:** Understand the work. Check the spend. Keep humans in control.

The Forge app provides a Rovo Agent and a deterministic policy action. It evaluates explicitly supplied USD amounts against illustrative demo limits. It does not connect to wallets, submit transactions, or claim access to live financial data.

## Current Forge implementation

- `manifest.yml` declares the Forge app using Node.js 24 and the registered Atlassian app ID.
- `rovo:agent` declares Flitzr Finance Guardian.
- `action` declares the deterministic finance-policy evaluator.
- `rovo:mcp` exposes the evaluator as an MCP tool for customer-created Rovo agents (Preview capability).
- `src/index.js` validates inputs and calculates the policy decision.
- `permissions.scopes` is empty because this first action does not call Jira or Confluence REST APIs.

## Demo policy

- Maximum single action: USD 25.
- Maximum daily spend: USD 100.
- Above USD 25: human approval required.
- Projected daily spend above USD 100: blocked.

These are illustrative defaults, not user account balances or financial advice. They must become configurable, persisted, and tenant-scoped before production use.

## Safety boundary and product separation

The Forge action is evaluation-only. It does not sign, submit, transfer, broadcast, or execute funds. Inputs are untrusted and validated independently. Rovo must ask the user when required amounts are missing or ambiguous.

The repository also contains the earlier Next.js/Base Flitzr platform. That separate application includes wallet-based signing and order-submission capabilities after explicit user approval. It is retained for existing product continuity but is not part of this Forge prototype or Codegeist demo. Do not describe the entire repository as read-only.

## Remaining work

- [x] Register the Forge app ID and configure it in `manifest.yml`.
- [ ] Install Forge CLI and validate the manifest with `forge lint`.
- [ ] Review the action payload and context handling against the current Forge contract.
- [ ] Deploy to a development environment only after validation and explicit approval.
- [ ] Install on a test Atlassian site and verify the Rovo Agent invocation.
- [ ] Verify MCP tool discovery where Preview access is available.
- [ ] Test invalid, missing, negative, fractional, and boundary-value inputs.
- [ ] Add tenant-scoped policy configuration and durable audit events before production.
- [ ] Add Jira/Confluence read scopes only if a concrete, reviewed API integration is implemented.
- [ ] Record an actual end-to-end demo after successful testing.
- [ ] Review privacy, security, Marketplace requirements, and Codegeist eligibility.

## Existing platform files

The existing Next.js/Base application, wallet adapters, smart contract, provider adapters, and execution ledger remain separate. They are not invoked by the initial Forge action. Do not connect live wallets or enable transaction execution through the Codegeist Forge prototype.
