# Set-limits stays off MCP

The new actions include set-limits, which writes. We expose only the read-only actions (evaluate, get-limits, list-recent) through the MCP module; set-limits is available to the Rovo agent only.

MCP tools can be invoked by third-party agents outside Atlassian's UI, so a write tool there widens the surface for accidental or malicious limit changes. A human talking to Rovo can still change limits deliberately.
