# Flitzr Architecture

## Product boundaries

Flitzr now has two related but separately deployed surfaces:

1. Existing finance platform: Next.js, Base integrations, wallet authentication, provider adapters, execution ledger, and Solidity utility contract.
2. Codegeist Forge prototype: Rovo Finance Guardian plus a deterministic read-only finance policy action.

The Forge prototype does not invoke the existing wallet or transaction execution code.

## Forge request flow

Rovo Agent
  -> Extract explicitly supplied USD amount and confirmed daily spend
  -> Ask the user if either value is missing or ambiguous
  -> Forge action
  -> Deterministic input validation
  -> Demo policy evaluation
  -> Return decision, projected daily spend, remaining demo budget
  -> Rovo explains the result

## Demo policy

- Maximum single action: USD 25
- Maximum daily spend: USD 100
- Amount above USD 25: human approval required
- Projected daily spend above USD 100: blocked

These values are illustrative and are not persisted, tenant-configurable, or connected to real financial accounts.

## Forge modules

- manifest.yml — Forge app ID, Node.js runtime, action, Rovo Agent, and Rovo MCP declaration.
- src/index.js — deterministic read-only policy evaluator.
- permissions.scopes is empty because the first action does not call Jira or Confluence APIs.

## Trust boundaries

1. Rovo may interpret natural-language context, but must not invent missing amounts.
2. The Forge action validates numeric inputs independently.
3. The policy action only returns an evaluation. It cannot approve, sign, submit, transfer, or broadcast.
4. Jira issue context may be returned as a reference only; this prototype does not fetch issue data through the REST API.
5. The existing onchain platform remains outside the Forge execution path.

## Production requirements

- Replace demo thresholds with tenant-scoped policy configuration.
- Persist audit events with appropriate retention and privacy controls.
- Add only the minimum Jira/Confluence scopes required by implemented read APIs.
- Add explicit approval and authorization before any future financial execution integration.
- Threat-model prompt injection, untrusted issue content, replay, cross-tenant access, and forged action inputs.
- Do not connect live wallets or enable transactions in the Codegeist prototype.
