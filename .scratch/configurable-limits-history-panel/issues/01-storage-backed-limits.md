# 01: Storage-backed limits

**What to build:** A teammate can ask the Rovo agent to set the demo policy limits for the site and to read them back, and every evaluation after that uses the new limits. A site that never set limits keeps the demo defaults (USD 25 single, USD 100 daily).

**Blocked by:** None (can start immediately).

**Status:** done (25 Nov 2026)

- [x] set-limits stores the new limits; get-limits reads them back
- [x] Storage is `@forge/kvs` (see ADR 0003); the manifest gains the `storage:app` scope
- [x] Evaluations after a set-limits call use the new limits
- [x] An unset installation evaluates against the demo defaults
- [x] Invalid limits (missing, negative, non-numeric, daily below single) are rejected with a clear error
- [x] All 14 existing tests still pass; new tests cover the round-trip, the fallback, and the rejections
- [x] The agent prompt describes configurable limits and the new actions
