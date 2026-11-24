# 02: Evaluation history

**What to build:** Every successful evaluation is recorded, and a teammate can ask the Rovo agent for the recent evaluations on the site, newest first.

**Blocked by:** 01 (storage-backed limits).

**Status:** done (25 Nov 2026)

- [x] A successful evaluation appends one history record (time, amounts, decision, issue key when in context)
- [x] list-recent-evaluations returns the records newest first
- [x] History keeps only the most recent 20 records; the 21st evaluation drops the oldest
- [x] Rejected inputs are not recorded
- [x] get-limits and list-recent are exposed through the MCP tools list; set-limits is not
- [x] New tests cover append, ordering, the 20-record cap, and exclusion of rejected inputs
