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

test("rejects a zero proposed amount", async () => {
  await assert.rejects(() => evaluateFinancePolicy({ amountUsd: 0, dailySpentUsd: 0 }));
});

test("allows the exact USD 25 single-expense boundary", async () => {
  const result = await evaluateFinancePolicy({ amountUsd: 25, dailySpentUsd: 0 });
  assert.equal(result.decision, "ALLOW_WITHIN_DEMO_LIMITS");
  assert.equal(result.needsHumanApproval, false);
});

test("requires human approval just above the single-expense limit", async () => {
  const result = await evaluateFinancePolicy({ amountUsd: 25.01, dailySpentUsd: 0 });
  assert.equal(result.decision, "HUMAN_APPROVAL_REQUIRED");
  assert.equal(result.needsHumanApproval, true);
});

test("blocks when daily spend is already above the daily limit", async () => {
  const result = await evaluateFinancePolicy({ amountUsd: 1, dailySpentUsd: 120 });
  assert.equal(result.decision, "BLOCK_DAILY_LIMIT");
  assert.equal(result.projectedDailySpendUsd, 121);
  assert.equal(result.remainingBeforeUsd, 0);
  assert.equal(result.remainingAfterUsd, 0);
  assert.equal(result.allowedToProceedToApproval, false);
});

test("allows an exact daily limit with cent values", async () => {
  const result = await evaluateFinancePolicy({ amountUsd: 19.99, dailySpentUsd: 80.01 });
  assert.equal(result.projectedDailySpendUsd, 100);
  assert.equal(result.decision, "ALLOW_WITHIN_DEMO_LIMITS");
});

test("truncates a long purpose and nulls a non-string purpose", async () => {
  const longPurpose = "x".repeat(500);
  const truncated = await evaluateFinancePolicy({ amountUsd: 10, dailySpentUsd: 0, purpose: longPurpose });
  assert.equal(truncated.purpose.length, 240);

  const nonString = await evaluateFinancePolicy({ amountUsd: 10, dailySpentUsd: 0, purpose: 42 });
  assert.equal(nonString.purpose, null);
});

test("passes through the Jira issue key from context", async () => {
  const withIssue = await evaluateFinancePolicy(
    { amountUsd: 10, dailySpentUsd: 0 },
    { jira: { issueKey: "DEMO-123" } }
  );
  assert.equal(withIssue.jiraIssueKey, "DEMO-123");

  const withoutIssue = await evaluateFinancePolicy({ amountUsd: 10, dailySpentUsd: 0 }, {});
  assert.equal(withoutIssue.jiraIssueKey, null);
});

test("rejects null and array payloads", async () => {
  await assert.rejects(() => evaluateFinancePolicy(null));
  await assert.rejects(() => evaluateFinancePolicy([]));
});
