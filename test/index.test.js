const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateFinancePolicy } = require("../src/index");

test("allows an expense within both demo limits", async () => {
  const result = await evaluateFinancePolicy({ amountUsd: 20, dailySpentUsd: 30 });
  assert.equal(result.decision, "ALLOW_WITHIN_DEMO_LIMITS");
  assert.equal(result.projectedDailySpendUsd, 50);
  assert.equal(result.remainingAfterUsd, 50);
  assert.equal(result.executionPerformed, false);
});

test("requires human approval above the single-expense limit", async () => {
  const result = await evaluateFinancePolicy({ amountUsd: 30, dailySpentUsd: 20 });
  assert.equal(result.decision, "HUMAN_APPROVAL_REQUIRED");
  assert.equal(result.needsHumanApproval, true);
});

test("blocks projected daily spend above the daily limit", async () => {
  const result = await evaluateFinancePolicy({ amountUsd: 21, dailySpentUsd: 80 });
  assert.equal(result.decision, "BLOCK_DAILY_LIMIT");
  assert.equal(result.projectedDailySpendUsd, 101);
  assert.equal(result.allowedToProceedToApproval, false);
});

test("allows an exact daily-limit boundary", async () => {
  const result = await evaluateFinancePolicy({ amountUsd: 20, dailySpentUsd: 80 });
  assert.equal(result.projectedDailySpendUsd, 100);
  assert.equal(result.decision, "ALLOW_WITHIN_DEMO_LIMITS");
});

test("rejects missing, blank, string, negative, and non-finite values", async () => {
  for (const payload of [
    {},
    { amountUsd: "", dailySpentUsd: 0 },
    { amountUsd: "20", dailySpentUsd: 0 },
    { amountUsd: 20, dailySpentUsd: "" },
    { amountUsd: 20, dailySpentUsd: "0" },
    { amountUsd: -1, dailySpentUsd: 0 },
    { amountUsd: 1, dailySpentUsd: -1 },
    { amountUsd: Infinity, dailySpentUsd: 0 },
    { amountUsd: 1, dailySpentUsd: NaN }
  ]) {
    await assert.rejects(() => evaluateFinancePolicy(payload));
  }
});

test("rejects overflow in projected daily spend", async () => {
  await assert.rejects(() => evaluateFinancePolicy({
    amountUsd: Number.MAX_VALUE,
    dailySpentUsd: Number.MAX_VALUE
  }));
});
