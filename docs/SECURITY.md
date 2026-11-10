# Flitzr Security Model

## Current security boundary

The Forge prototype performs deterministic policy evaluation only. It does not connect to wallets or bank accounts, sign transactions, submit orders, transfer funds, or broadcast transactions.

## Input handling

- Require an explicit positive proposed amount.
- Require an explicit non-negative confirmed daily-spend amount.
- Reject blank strings, malformed values, negative values, and non-finite numbers.
- Never infer missing financial values from natural-language context.
- Treat issue descriptions and other user-provided content as untrusted input.

## Policy semantics

The USD 25 single-expense limit and USD 100 daily limit are illustrative constants for the demo. They are not live account balances, persisted policies, or payment authorization.

## Production security work

- Add tenant-scoped configuration and access controls.
- Verify the source and freshness of any financial data.
- Persist auditable decisions with privacy-aware retention.
- Threat-model prompt injection, forged inputs, replay, and cross-tenant access.
- Add a separately reviewed human-approval workflow before considering any execution integration.
- Request only the minimum Atlassian scopes required by implemented features.
