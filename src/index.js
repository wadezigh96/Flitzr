const Resolver = require("@forge/resolver").default;
const { createFlitzrStorage, DEMO_DEFAULTS } = require("./storage");

function requireNumber(value, fieldName, { allowZero = true } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(fieldName + " must be a finite number.");
  }
  if (value < 0 || (!allowZero && value === 0)) {
    throw new Error(fieldName + (allowZero ? " must be non-negative." : " must be greater than zero."));
  }
  return value;
}

// Pure policy decision: no storage access, so it stays unit-testable on its
// own. `limits` defaults to the demo defaults, which keeps the original
// behavior for callers that pass nothing.
async function evaluateFinancePolicy(payload = {}, context = {}, limits = DEMO_DEFAULTS) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("A valid action payload is required.");
  }

  const amountUsd = requireNumber(payload.amountUsd, "amountUsd", { allowZero: false });
  const dailySpentUsd = requireNumber(payload.dailySpentUsd, "dailySpentUsd");

  const projectedDailySpendUsd = dailySpentUsd + amountUsd;
  if (!Number.isFinite(projectedDailySpendUsd)) {
    throw new Error("Projected daily spend is outside the supported numeric range.");
  }

  const remainingBeforeUsd = Math.max(0, limits.maxDailyUsd - dailySpentUsd);
  const remainingAfterUsd = Math.max(0, limits.maxDailyUsd - projectedDailySpendUsd);
  const blocked = projectedDailySpendUsd > limits.maxDailyUsd;
  const needsApproval = !blocked && amountUsd > limits.maxSingleUsd;
  const decision = blocked
    ? "BLOCK_DAILY_LIMIT"
    : needsApproval
      ? "HUMAN_APPROVAL_REQUIRED"
      : "ALLOW_WITHIN_DEMO_LIMITS";

  return {
    product: "Flitzr",
    mode: "DEMO_POLICY_ONLY",
    decision,
    allowedToProceedToApproval: !blocked,
    needsHumanApproval: needsApproval,
    executionPerformed: false,
    transactionSigned: false,
    transactionSubmitted: false,
    currency: "USD",
    amountUsd,
    dailySpentUsd,
    projectedDailySpendUsd,
    remainingBeforeUsd,
    remainingAfterUsd,
    limits: {
      maxSingleSpendUsd: limits.maxSingleUsd,
      maxDailySpendUsd: limits.maxDailyUsd
    },
    purpose: typeof payload.purpose === "string" ? payload.purpose.slice(0, 240) : null,
    jiraIssueKey: context && context.jira && typeof context.jira.issueKey === "string"
      ? context.jira.issueKey
      : null,
    explanation: blocked
      ? "Blocked: this action would exceed the USD " + limits.maxDailyUsd + " demo daily budget."
      : needsApproval
        ? "Within the demo daily budget, but above USD " + limits.maxSingleUsd + "; human approval is required."
        : "Within both demo spending limits. This is policy evaluation only, not transaction authorization."
  };
}

// Storage-aware action handlers. The storage object is injected so tests
// can pass a fake; production handlers use the real KVS-backed storage.
function createHandlers(storage) {
  const store = storage || createFlitzrStorage();
  return {
    async evaluateFinancePolicyAction(payload, context) {
      const limits = await store.getLimits();
      const result = await evaluateFinancePolicy(payload, context, limits);
      // Only successful evaluations are recorded: a rejected input throws
      // above, before this line is reached.
      await store.recordEvaluation({
        amountUsd: result.amountUsd,
        dailySpentUsd: result.dailySpentUsd,
        projectedDailySpendUsd: result.projectedDailySpendUsd,
        decision: result.decision,
        issueKey: result.jiraIssueKey
      });
      return result;
    },
    async getLimits() {
      return store.getLimits();
    },
    async setLimits(payload) {
      return store.setLimits(payload);
    },
    async listRecentEvaluations(payload = {}) {
      const evaluations = await store.listRecentEvaluations(payload && payload.limit);
      return { evaluations, count: evaluations.length };
    }
  };
}

const defaultHandlers = createHandlers();

// Resolvers for the Jira issue panel. They delegate to the same handlers
// as the Rovo actions, so the panel and the agent always agree. The panel
// passes the issue key in the payload (it reads it from extension context);
// the resolver forwards it as the Jira context the evaluator expects.
function createPanelResolver(storage) {
  const handlers = createHandlers(storage);
  const resolver = new Resolver();
  resolver.define("evaluate", async ({ payload }) => {
    const context = payload.issueKey
      ? { jira: { issueKey: payload.issueKey } }
      : {};
    return handlers.evaluateFinancePolicyAction(
      { amountUsd: payload.amountUsd, dailySpentUsd: payload.dailySpentUsd },
      context
    );
  });
  resolver.define("getLimits", async () => handlers.getLimits());
  resolver.define("listRecent", async ({ payload }) => {
    return handlers.listRecentEvaluations(payload || {});
  });
  return resolver.getDefinitions();
}

exports.evaluateFinancePolicy = evaluateFinancePolicy;
exports.evaluateFinancePolicyAction = defaultHandlers.evaluateFinancePolicyAction;
exports.getLimits = defaultHandlers.getLimits;
exports.setLimits = defaultHandlers.setLimits;
exports.listRecentEvaluations = defaultHandlers.listRecentEvaluations;
exports.createHandlers = createHandlers;
exports.createPanelResolver = createPanelResolver;
exports.handler = createPanelResolver();
