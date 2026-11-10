const MAX_SINGLE_SPEND_USD = 25;
const MAX_DAILY_SPEND_USD = 100;

function finiteNonNegative(value, fieldName) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(fieldName + " must be a finite, non-negative number.");
  }
  return parsed;
}

exports.evaluateFinancePolicy = async (payload = {}, context = {}) => {
  const amountUsd = finiteNonNegative(payload.amountUsd, "amountUsd");
  const dailySpentUsd = finiteNonNegative(payload.dailySpentUsd, "dailySpentUsd");
  if (amountUsd <= 0) throw new Error("amountUsd must be greater than zero.");

  const projectedDailySpendUsd = dailySpentUsd + amountUsd;
  const remainingBeforeUsd = Math.max(0, MAX_DAILY_SPEND_USD - dailySpentUsd);
  const remainingAfterUsd = Math.max(0, MAX_DAILY_SPEND_USD - projectedDailySpendUsd);
  const blocked = projectedDailySpendUsd > MAX_DAILY_SPEND_USD;
  const needsApproval = !blocked && amountUsd > MAX_SINGLE_SPEND_USD;
  const decision = blocked ? "BLOCK_DAILY_LIMIT" :
    needsApproval ? "HUMAN_APPROVAL_REQUIRED" : "ALLOW_WITHIN_DEMO_LIMITS";

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
    limits: { maxSingleSpendUsd: MAX_SINGLE_SPEND_USD, maxDailySpendUsd: MAX_DAILY_SPEND_USD },
    purpose: typeof payload.purpose === "string" ? payload.purpose.slice(0, 240) : null,
    jiraIssueKey: context && context.jira ? context.jira.issueKey || null : null,
    explanation: blocked
      ? "Blocked: this action would exceed the USD 100 demo daily budget."
      : needsApproval
        ? "Within the demo daily budget, but above USD 25; human approval is required."
        : "Within both demo spending limits. This is policy evaluation only, not transaction authorization."
  };
};
