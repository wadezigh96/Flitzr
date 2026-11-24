# Per-installation limits in Forge storage

The demo policy limits were hard-coded constants, which the Codegeist judges' first criterion calls out as a single hard-coded demo path. We store one pair of limits per installation in Forge storage; every evaluation reads them and falls back to the demo defaults when nothing was set.

A demo budget is a team decision, not a personal one, so per-user limits were rejected: they would let each teammate spend the full daily budget on their own. An admin page was rejected as the editing seam for now; the Rovo action is the faster seam and the Jira panel follows for visibility.
