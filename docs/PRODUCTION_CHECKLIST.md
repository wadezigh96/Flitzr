# Flitzr — Readiness Checklist

## Local implementation
- [x] Forge app identity configured in `manifest.yml`
- [x] Rovo Finance Guardian declared
- [x] Deterministic evaluation action implemented
- [x] Rovo MCP declaration included (Preview capability; not yet verified)
- [x] Node.js unit tests included
- [x] MIT LICENSE added
- [x] Run `npm test` in a clean environment (14 tests, all passing, 18 Nov 2026)
- [x] Run Forge CLI lint and resolve manifest issues (`forge lint`
  passes with no issues, 18 Nov 2026; fixed the `rovo:mcp` description
  and the function handler path)
- [x] Verify payload and context behavior against the current Forge contract
  (manual schema check, 18 Nov 2026; see `docs/AUDIT-2026-11-18.md`)

## Development-site validation
- [x] Deploy to a development environment only after explicit approval
  (deployed version 2.0.0, 18 Nov 2026)
- [ ] Install on a test Atlassian site
- [ ] Verify Rovo agent invocation and action inputs
- [ ] Verify MCP tool discovery where Preview access is available
- [ ] Capture an actual end-to-end demo

## Production requirements
- [ ] Tenant-scoped policy configuration
- [ ] Authenticated and verified financial data sources, if required
- [ ] Durable audit trail with privacy and retention controls
- [ ] Threat model, abuse tests, and tenant-isolation tests
- [ ] Human approval workflow and authorization review
- [ ] Marketplace requirements and Codegeist eligibility review

No production deployment or event submission is authorized by this checklist.
