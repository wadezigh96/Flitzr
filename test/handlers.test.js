const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateFinancePolicy, createHandlers } = require("../src/index");
const { createFlitzrStorage } = require("../src/storage");
const { createFakeStore } = require("../test-helpers/fake-store");

function handlersWithFreshStorage() {
  return createHandlers(createFlitzrStorage(createFakeStore()));
}

test("the pure evaluator accepts limits as a parameter", async () => {
  const result = await evaluateFinancePolicy(
    { amountUsd: 30, dailySpentUsd: 20 },
    {},
    { maxSingleUsd: 50, maxDailyUsd: 200 }
  );
  assert.equal(result.decision, "ALLOW_WITHIN_DEMO_LIMITS");
  assert.equal(result.limits.maxSingleSpendUsd, 50);
  assert.equal(result.limits.maxDailySpendUsd, 200);
});

test("the storage-aware evaluation uses the installation limits", async () => {
  const handlers = handlersWithFreshStorage();
  await handlers.setLimits({ maxSingleUsd: 50, maxDailyUsd: 200 });
  // With the defaults this would need human approval (30 > 25).
  const result = await handlers.evaluateFinancePolicyAction({ amountUsd: 30, dailySpentUsd: 20 });
  assert.equal(result.decision, "ALLOW_WITHIN_DEMO_LIMITS");
  assert.equal(result.limits.maxSingleSpendUsd, 50);
  assert.equal(result.limits.maxDailySpendUsd, 200);
});

test("the storage-aware evaluation falls back to the demo defaults when unset", async () => {
  const handlers = handlersWithFreshStorage();
  const allowed = await handlers.evaluateFinancePolicyAction({ amountUsd: 20, dailySpentUsd: 30 });
  assert.equal(allowed.decision, "ALLOW_WITHIN_DEMO_LIMITS");
  const approval = await handlers.evaluateFinancePolicyAction({ amountUsd: 30, dailySpentUsd: 20 });
  assert.equal(approval.decision, "HUMAN_APPROVAL_REQUIRED");
  const blocked = await handlers.evaluateFinancePolicyAction({ amountUsd: 21, dailySpentUsd: 80 });
  assert.equal(blocked.decision, "BLOCK_DAILY_LIMIT");
});

test("getLimits handler returns the stored limits or the demo defaults", async () => {
  const handlers = handlersWithFreshStorage();
  const before = await handlers.getLimits();
  assert.equal(before.maxSingleUsd, 25);
  assert.equal(before.maxDailyUsd, 100);
  assert.equal(before.usingDemoDefaults, true);

  await handlers.setLimits({ maxSingleUsd: 60, maxDailyUsd: 300 });
  const after = await handlers.getLimits();
  assert.equal(after.maxSingleUsd, 60);
  assert.equal(after.maxDailyUsd, 300);
  assert.equal(after.usingDemoDefaults, false);
});

test("setLimits handler rejects invalid limits with a clear error", async () => {
  const handlers = handlersWithFreshStorage();
  await assert.rejects(
    () => handlers.setLimits({ maxSingleUsd: -5 }),
    /must be a finite number greater than zero/
  );
  await assert.rejects(
    () => handlers.setLimits({ maxSingleUsd: 150, maxDailyUsd: 100 }),
    /daily limit must not be below the single limit/
  );
  await assert.rejects(
    () => handlers.setLimits({}),
    /at least one limit/
  );
});

test("a successful evaluation is recorded with its amounts, decision, and issue key", async () => {
  const handlers = handlersWithFreshStorage();
  await handlers.evaluateFinancePolicyAction(
    { amountUsd: 20, dailySpentUsd: 30 },
    { jira: { issueKey: "DEMO-123" } }
  );
  const { evaluations, count } = await handlers.listRecentEvaluations();
  assert.equal(count, 1);
  assert.equal(evaluations[0].amountUsd, 20);
  assert.equal(evaluations[0].dailySpentUsd, 30);
  assert.equal(evaluations[0].projectedDailySpendUsd, 50);
  assert.equal(evaluations[0].decision, "ALLOW_WITHIN_DEMO_LIMITS");
  assert.equal(evaluations[0].issueKey, "DEMO-123");
});

test("rejected evaluations are not recorded", async () => {
  const handlers = handlersWithFreshStorage();
  await assert.rejects(() => handlers.evaluateFinancePolicyAction({ amountUsd: -1, dailySpentUsd: 0 }));
  await assert.rejects(() => handlers.evaluateFinancePolicyAction({ amountUsd: "20", dailySpentUsd: 0 }));
  await assert.rejects(() => handlers.evaluateFinancePolicyAction({}));
  const { evaluations, count } = await handlers.listRecentEvaluations();
  assert.equal(count, 0);
  assert.deepEqual(evaluations, []);
});

test("listRecentEvaluations handler returns the newest evaluations first", async () => {
  const handlers = handlersWithFreshStorage();
  await handlers.evaluateFinancePolicyAction({ amountUsd: 10, dailySpentUsd: 0 });
  await handlers.evaluateFinancePolicyAction({ amountUsd: 15, dailySpentUsd: 10 });
  const { evaluations } = await handlers.listRecentEvaluations({ limit: 1 });
  assert.equal(evaluations.length, 1);
  assert.equal(evaluations[0].amountUsd, 15);
});
