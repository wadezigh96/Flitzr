const test = require("node:test");
const assert = require("node:assert/strict");
const { createFlitzrStorage, DEMO_DEFAULTS } = require("../src/storage");
const { createFakeStore } = require("../test-helpers/fake-store");

test("getLimits returns the demo defaults when nothing was set", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  const limits = await storage.getLimits();
  assert.equal(limits.maxSingleUsd, 25);
  assert.equal(limits.maxDailyUsd, 100);
  assert.equal(limits.usingDemoDefaults, true);
});

test("setLimits then getLimits round-trips the new limits", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  const stored = await storage.setLimits({ maxSingleUsd: 50, maxDailyUsd: 200 });
  assert.equal(stored.maxSingleUsd, 50);
  assert.equal(stored.maxDailyUsd, 200);

  const limits = await storage.getLimits();
  assert.equal(limits.maxSingleUsd, 50);
  assert.equal(limits.maxDailyUsd, 200);
  assert.equal(limits.usingDemoDefaults, false);
});

test("setLimits with one value keeps the other current value", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  await storage.setLimits({ maxSingleUsd: 40 });
  const limits = await storage.getLimits();
  assert.equal(limits.maxSingleUsd, 40);
  assert.equal(limits.maxDailyUsd, 100);
});

test("setLimits rejects missing, negative, zero, and non-numeric limits", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  for (const input of [
    {},
    { maxSingleUsd: undefined, maxDailyUsd: undefined },
    { maxSingleUsd: -1 },
    { maxSingleUsd: 0 },
    { maxSingleUsd: "50" },
    { maxSingleUsd: NaN },
    { maxSingleUsd: Infinity },
    { maxDailyUsd: -100 },
    { maxDailyUsd: 0 },
    { maxDailyUsd: "200" }
  ]) {
    await assert.rejects(() => storage.setLimits(input));
  }
  // Nothing was stored: the defaults still apply.
  const limits = await storage.getLimits();
  assert.deepEqual(
    { maxSingleUsd: limits.maxSingleUsd, maxDailyUsd: limits.maxDailyUsd },
    { maxSingleUsd: DEMO_DEFAULTS.maxSingleUsd, maxDailyUsd: DEMO_DEFAULTS.maxDailyUsd }
  );
});

test("setLimits rejects a daily limit below the single limit", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  await assert.rejects(() => storage.setLimits({ maxSingleUsd: 150, maxDailyUsd: 100 }));
  await assert.rejects(() => storage.setLimits({ maxSingleUsd: 101 }));
  await storage.setLimits({ maxSingleUsd: 50, maxDailyUsd: 200 });
  await assert.rejects(() => storage.setLimits({ maxDailyUsd: 40 }));
  // The last good limits are unchanged.
  const limits = await storage.getLimits();
  assert.equal(limits.maxSingleUsd, 50);
  assert.equal(limits.maxDailyUsd, 200);
});

test("setLimits allows a daily limit equal to the single limit", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  const stored = await storage.setLimits({ maxSingleUsd: 100, maxDailyUsd: 100 });
  assert.equal(stored.maxSingleUsd, 100);
  assert.equal(stored.maxDailyUsd, 100);
});

test("listRecentEvaluations returns an empty list when nothing was recorded", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  assert.deepEqual(await storage.listRecentEvaluations(), []);
});

test("recordEvaluation stores a record newest first with a timestamp", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  await storage.recordEvaluation({
    amountUsd: 20, dailySpentUsd: 30, projectedDailySpendUsd: 50,
    decision: "ALLOW_WITHIN_DEMO_LIMITS"
  });
  await storage.recordEvaluation({
    amountUsd: 30, dailySpentUsd: 20, projectedDailySpendUsd: 50,
    decision: "HUMAN_APPROVAL_REQUIRED", issueKey: "DEMO-123"
  });

  const recent = await storage.listRecentEvaluations();
  assert.equal(recent.length, 2);
  assert.equal(recent[0].amountUsd, 30);
  assert.equal(recent[0].decision, "HUMAN_APPROVAL_REQUIRED");
  assert.equal(recent[0].issueKey, "DEMO-123");
  assert.match(recent[0].at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.equal(recent[1].amountUsd, 20);
  assert.equal(recent[1].issueKey, undefined);
});

test("history keeps only the most recent 20 records", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  for (let i = 1; i <= 21; i++) {
    await storage.recordEvaluation({
      amountUsd: i, dailySpentUsd: 0, projectedDailySpendUsd: i,
      decision: "ALLOW_WITHIN_DEMO_LIMITS"
    });
  }
  const recent = await storage.listRecentEvaluations();
  assert.equal(recent.length, 20);
  assert.equal(recent[0].amountUsd, 21);
  assert.equal(recent[19].amountUsd, 2);
});

test("listRecentEvaluations respects the limit and clamps above 20", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  for (let i = 1; i <= 5; i++) {
    await storage.recordEvaluation({
      amountUsd: i, dailySpentUsd: 0, projectedDailySpendUsd: i,
      decision: "ALLOW_WITHIN_DEMO_LIMITS"
    });
  }
  assert.equal((await storage.listRecentEvaluations(2)).length, 2);
  assert.equal((await storage.listRecentEvaluations(100)).length, 5);
});

test("listRecentEvaluations treats a missing or unusable limit as the default", async () => {
  const storage = createFlitzrStorage(createFakeStore());
  for (let i = 1; i <= 3; i++) {
    await storage.recordEvaluation({
      amountUsd: i, dailySpentUsd: 0, projectedDailySpendUsd: i,
      decision: "ALLOW_WITHIN_DEMO_LIMITS"
    });
  }
  assert.equal((await storage.listRecentEvaluations(0)).length, 3);
  assert.equal((await storage.listRecentEvaluations(-5)).length, 3);
  assert.equal((await storage.listRecentEvaluations("many")).length, 3);
});
