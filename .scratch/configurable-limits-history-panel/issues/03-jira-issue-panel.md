# 03: Jira issue panel

**What to build:** A Flitzr panel on Jira issues where a user can run the same policy check with an amount and spent-today, see the decision, and see the recent evaluations for the site.

**Blocked by:** 01 (storage-backed limits), 02 (evaluation history).

**Status:** done except live verification on the demo site (ticket 05)

- [ ] The panel renders on a Jira issue on the demo site (needs deploy + live check, ticket 05)
- [x] The panel is built with UI Kit (`@forge/react`), no bundler (see ADR 0004)
- [x] The form evaluation returns the same decisions as the Rovo agent for the same inputs
- [x] The panel shows recent evaluations matching list-recent-evaluations
- [x] No new Atlassian API scopes are added (issue key from context only, no Jira API reads)
- [x] The panel's resolvers are covered by tests through the same seams as the actions
