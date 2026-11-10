# Flitzr — Codegeist 2026

## Product

Flitzr Finance Guardian is an Atlassian Forge prototype for reviewing operational spending proposals.

**Tagline:** Understand the work. Check the spend. Keep humans in control.

## Included implementation

- Forge manifest with a Rovo agent, deterministic action, and Rovo MCP declaration.
- Input validation and policy evaluation in `src/index.js`.
- Automated tests using Node.js's built-in test runner.
- Documentation for architecture, demo, security, and readiness.

The Rovo MCP module is a Preview capability. Its availability and behavior must be verified in the actual Atlassian development site before being described as working.

## Explicit limitations

The prototype uses hard-coded demo thresholds (USD 25 per expense and USD 100 daily). It does not fetch live financial balances, connect to payment accounts or wallets, sign or submit transactions, transfer funds, or prove that an expense was paid.

## Remaining work

- [ ] Install/authenticate Forge CLI and run `forge lint`.
- [ ] Validate the manifest and action payload against the current Forge platform contract.
- [ ] Run all local tests and add any missing edge cases.
- [ ] Deploy only to a development environment after explicit approval.
- [ ] Install on a test Atlassian site and verify Rovo invocation.
- [ ] Verify MCP discovery where Preview access is available.
- [ ] Review privacy, security, tenant isolation, and Codegeist eligibility.
- [ ] Record a real end-to-end demo only after successful testing.
- [ ] Obtain explicit approval before production deployment or event submission.
