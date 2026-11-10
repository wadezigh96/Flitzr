# Flitzr — Codegeist 2026

## Product direction

Flitzr is being adapted into a finance-operations control layer for Atlassian teams.

Working title: Flitzr Finance Guardian  
Tagline: Understand the work. Check the spend. Keep humans in control.

The Forge app introduces a Rovo Agent and a deterministic, read-only finance policy action. It evaluates explicitly supplied USD amounts against demo limits. It does not connect to wallets, submit transactions, or claim access to live finance data.

## Current Forge implementation

- manifest.yml declares a Forge app using Node.js 24.
- rovo:agent declares Flitzr Finance Guardian.
- action declares the deterministic finance-policy evaluator.
- rovo:mcp exposes the evaluator as an MCP tool for customer-created Rovo agents (Preview capability).
- src/index.js validates inputs and calculates the policy decision.
- permissions.scopes is empty because this first action does not call Jira or Confluence REST APIs.

## Demo policy

- Maximum single action: USD 25.
- Maximum daily spend: USD 100.
- Above USD 25: human approval required.
- Projected daily spend above USD 100: blocked.

These are illustrative defaults, not user account balances or financial advice. They must become configurable, persisted, and tenant-scoped before production use.

## Safety boundary

The Forge action is evaluation-only. It does not sign, submit, transfer, broadcast, or execute funds. Inputs are untrusted and validated independently. Rovo must ask the user when required amounts are missing or ambiguous.

## Remaining work

- Replace the placeholder Forge app ID after creating the app in Atlassian Developer Console.
- Install Forge CLI and validate the manifest with forge lint.
- Deploy to a development environment and install on a test Atlassian site.
- Verify Rovo Agent invocation and MCP tool exposure in the target tenant.
- Add tenant-scoped policy configuration and durable audit events.
- Add Jira/Confluence read scopes only when a concrete, reviewed API integration is implemented.
- Build the UI and demo workflow.
- Review privacy, security, Marketplace requirements, and Codegeist eligibility.

## Preserve existing Flitzr platform

The existing Next.js/Base finance-agent application, wallet adapters, smart contract, provider adapters, and execution ledger remain separate infrastructure. They are not automatically part of the Forge app and are not invoked by this initial Rovo action.

Do not enable live execution or connect a wallet to the Forge action as part of the initial prototype.
