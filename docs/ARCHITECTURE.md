# Flitzr Architecture

## Product boundaries

This repository currently contains two separate product surfaces:

1. **Existing Flitzr web platform:** Next.js, Base integrations, wallet authentication, provider adapters, execution ledger, x402 components, and Solidity utility contract. Its wallet flow can sign and submit orders after explicit user approval.
2. **Codegeist Forge prototype:** Rovo Finance Guardian plus a deterministic, read-only finance policy action. It does not call the existing wallet or transaction-execution code.

Only the second surface is the Codegeist Forge prototype. Do not describe the entire repository or existing web application as read-only.

## Forge request flow

Rovo Agent
  -> Identify explicitly supplied USD amount and confirmed daily spend
  -> Ask the user if either value is missing or ambiguous
  -> Invoke Forge action
  -> Validate inputs independently
  -> Evaluate illustrative demo policy
  -> Return decision, projected daily spend, and remaining demo budget
  -> Rovo explains the result

The prototype does not fetch Jira or Confluence data through REST APIs. Context supplied by Atlassian must not be treated as verified financial data unless its source and meaning are clear.

## Demo policy

- Maximum single action: USD 25
- Maximum daily spend: USD 100
- Amount above USD 25: human approval required
- Projected daily spend above USD 100: blocked

These values are illustrative and are not persisted, tenant-configurable, or connected to real financial accounts.

## Forge modules

- `manifest.yml` — registered Forge app ID, Node.js runtime, action, Rovo Agent, and Rovo MCP declaration.
- `src/index.js` — deterministic read-only policy evaluator.
- `permissions.scopes` is empty because the first action does not call Jira or Confluence APIs.

## Trust boundaries

1. Rovo may interpret natural-language context, but must not invent missing amounts.
2. The Forge action validates numeric inputs independently.
3. The policy action returns an evaluation only. It cannot approve, sign, submit, transfer, or broadcast.
4. Jira issue context is not equivalent to verified budget or transaction data.
5. The existing onchain platform remains outside the Forge execution path.

## Production requirements

- Replace demo thresholds with tenant-scoped policy configuration.
- Persist audit events with appropriate retention and privacy controls.
- Add only the minimum Jira/Confluence scopes required by implemented read APIs.
- Add explicit approval and authorization before any future financial execution integration.
- Threat-model prompt injection, untrusted issue content, replay, cross-tenant access, and forged action inputs.
- Do not connect live wallets or enable transactions in the Codegeist prototype.
