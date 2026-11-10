# Flitzr Architecture

## Scope

This repository contains only the Atlassian Forge implementation of Flitzr Finance Guardian. Previous web, wallet, provider, and smart-contract code is not part of this project tree.

## Request flow

1. Rovo identifies a proposed expense and the confirmed amount already spent today.
2. If either amount is missing or ambiguous, Rovo asks the user instead of guessing.
3. The Forge action validates both numeric inputs independently.
4. The evaluator applies the illustrative demo policy.
5. The action returns a decision, projected daily spend, remaining demo budget, and explicit non-execution flags.
6. Rovo explains the result and any human-approval requirement.

## Demo policy

- Maximum single expense: USD 25.
- Maximum daily spend: USD 100.
- Above USD 25: human approval required, provided the daily cap is not exceeded.
- Projected daily spend above USD 100: blocked.

The values are hard-coded for demonstration. They are not persistent, tenant-configurable, or connected to live financial accounts.

## Trust boundaries

- Natural-language context is untrusted; the agent must not invent amounts.
- The action rejects missing, blank, malformed, negative, and non-finite numeric inputs.
- A policy result is not payment authorization.
- Jira issue context is not proof of a budget, bank balance, or completed transaction.
- The action cannot sign, submit, transfer, or broadcast funds.

## Before production

Implement tenant-scoped policy configuration, authenticated data sources, durable audit events, privacy and retention controls, abuse testing, and a separately reviewed human-approval workflow. Add Jira or Confluence scopes only when a concrete API integration requires them.
