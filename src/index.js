const MAX_SINGLE_SPEND_USD = 25;
const MAX_DAILY_SPEND_USD = 100;

function requireNumber(value, fieldName, { allowZero = true } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(fieldName + " must be a finite number.");
  }
  if (value < 0 || (!allowZero && value === 0)) {
    throw new Error(fieldName + (allowZero ? " must be non-negative." : " must be greater than zero."));
  }
  return value;
}

exports.evaluateFinancePolicy = async (payload = {}, context = {}) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("A valid action payload is required.");
  }

  const amountUsd = requireNumber(payload.amountUsd, "amountUsd", { allowZero: false });
  const dailySpentUsd = requireNumber(payload.dailySpentUsd, "dailySpentUsd");

  const projectedDailySpendUsd = dailySpentUsd + amountUsd;
  if (!Number.isFinite(projectedDailySpendUsd)) {
    throw new Error("Projected daily spend is outside the supported numeric range.");
  }

  const remainingBeforeUsd = Math.max(0, MAX_DAILY_SPEND_USD - dailySpentUsd);
  const remainingAfterUsd = Math.max(0, MAX_DAILY_SPEND_USD - projectedDailySpendUsd);
  const blocked = projectedDailySpendUsd > MAX_DAILY_SPEND_USD;
  const needsApproval = !blocked && amountUsd > MAX_SINGLE_SPEND_USD;
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
      maxSingleSpendUsd: MAX_SINGLE_SPEND_USD,
      maxDailySpendUsd: MAX_DAILY_SPEND_USD
    },
    purpose: typeof payload.purpose === "string" ? payload.purpose.slice(0, 240) : null,
    jiraIssueKey: context && context.jira && typeof context.jira.issueKey === "string"
      ? context.jira.issueKey
      : null,
    explanation: blocked
      ? "Blocked: this action would exceed the USD 100 demo daily budget."
      : needsApproval
        ? "Within the demo daily budget, but above USD 25; human approval is required."
        : "Within both demo spending limits. This is policy evaluation only, not transaction authorization."
  };
};
