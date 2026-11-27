# Flitzr Finance Guardian

The Forge app that checks proposed spending against transparent demo guardrails, through a Rovo agent and a Jira issue panel. It evaluates only; it never moves money.

## Language

**Evaluation**:
One policy check of a single proposed amount against the demo policy, producing a decision and the projected daily spend.
_Avoid_: Check, assessment, transaction

**Demo policy**:
The two spending limits the guardian enforces: the maximum single action and the maximum daily spend.
_Avoid_: Budget, rule set

**Demo default**:
The built-in limits (USD 25 single, USD 100 daily) used until an installation sets its own.
_Avoid_: Hard-coded limit, fixed limit

**Installation limits**:
The limits an installation has chosen, replacing the demo defaults for every evaluation on that site.
_Avoid_: Custom limits, tenant limits

**History record**:
The stored outcome of one evaluation: when it happened, the amounts, the decision, and the Jira issue key when one was in context.
_Avoid_: Log entry, audit event

**Approval**:
The human step an evaluation can require. The guardian reports that approval is needed; it never approves anything itself.
_Avoid_: Authorization, sign-off
