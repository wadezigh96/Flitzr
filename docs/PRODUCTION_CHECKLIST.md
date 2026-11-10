# Flitzr — Codegeist Readiness Checklist

## Forge prototype
- [x] Dedicated Codegeist branch created
- [x] Initial Forge manifest drafted
- [x] Registered Atlassian Forge app ID configured in manifest
- [x] Rovo Finance Guardian agent declared
- [x] Deterministic read-only policy action implemented
- [x] Rovo MCP tool declaration added (Preview capability)
- [ ] Run Forge CLI lint and package validation
- [ ] Review action payload and context handling
- [ ] Test policy function, including invalid and boundary inputs
- [ ] Deploy to a development environment after validation and explicit approval
- [ ] Install on a development Atlassian site
- [ ] Verify Rovo action invocation
- [ ] Verify MCP tool discovery where Preview access is available
- [ ] Record an actual end-to-end demo

## Product and security
- [x] Forge prototype does not sign or execute transactions
- [x] No Atlassian OAuth scopes requested by initial evaluator
- [ ] Tenant-scoped policy configuration
- [ ] Durable, privacy-reviewed audit trail
- [ ] Jira/Confluence data integration only if required, with minimum scopes
- [ ] Threat model and abuse testing
- [ ] Privacy and data-retention review
- [ ] Clearly separate the legacy Base wallet execution app from the Forge demo

## Submission
- [ ] Confirm Codegeist eligibility and current category rules
- [ ] Final product description and screenshots
- [ ] Demo video within event limits
- [ ] Test installation link
- [ ] Final human review and explicit submission approval

The Forge prototype must remain evaluation-only until security, persistence, authorization, and user-approval controls are independently implemented and tested. No production deployment or Devpost submission is authorized by this checklist.
