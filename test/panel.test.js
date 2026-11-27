const test = require("node:test");
const assert = require("node:assert/strict");
const { createPanelResolver, createHandlers } = require("../src/index");
const { createFlitzrStorage } = require("../src/storage");
const { createFakeStore } = require("../test-helpers/fake-store");

// Invokes a resolver the way the Forge runtime does: one handler function
// that dispatches on call.functionKey.
async function invoke(handler, functionKey, payload) {
  return handler({ call: { functionKey, payload }, context: {} });
}

function panelWithFreshStorage() {
  const storage = createFlitzrStorage(createFakeStore());
  return {
    storage,
    panel: createPanelResolver(storage),
    handlers: createHandlers(storage)
  };
}

test("panel evaluate returns the same decision as the Rovo action", async () => {
  const { panel, handlers } = panelWithFreshStorage();
  for (const payload of [
    { amountUsd: 20, dailySpentUsd: 30 },
    { amountUsd: 30, dailySpentUsd: 20 },
    { amountUsd: 21, dailySpentUsd: 80 }
  ]) {
    const viaPanel = await invoke(panel, "evaluate", payload);
    const viaAction = await handlers.evaluateFinancePolicyAction(payload);
    assert.equal(viaPanel.decision, viaAction.decision);
    assert.equal(viaPanel.projectedDailySpendUsd, viaAction.projectedDailySpendUsd);
  }
});

test("panel evaluate uses the installation limits", async () => {
  const { panel, handlers } = panelWithFreshStorage();
  await handlers.setLimits({ maxSingleUsd: 50, maxDailyUsd: 200 });
  const result = await invoke(panel, "evaluate", { amountUsd: 30, dailySpentUsd: 20 });
  assert.equal(result.decision, "ALLOW_WITHIN_DEMO_LIMITS");
});

test("panel evaluate records the issue key and the history matches list-recent", async () => {
  const { panel, handlers } = panelWithFreshStorage();
  await invoke(panel, "evaluate", { amountUsd: 20, dailySpentUsd: 30, issueKey: "DEMO-123" });
  const viaPanel = await invoke(panel, "listRecent", {});
  const viaAction = await handlers.listRecentEvaluations();
  assert.deepEqual(viaPanel, viaAction);
  assert.equal(viaPanel.count, 1);
  assert.equal(viaPanel.evaluations[0].issueKey, "DEMO-123");
});

test("panel getLimits returns the current limits", async () => {
  const { panel, handlers } = panelWithFreshStorage();
  const before = await invoke(panel, "getLimits", {});
  assert.equal(before.maxSingleUsd, 25);
  assert.equal(before.usingDemoDefaults, true);
  await handlers.setLimits({ maxSingleUsd: 60, maxDailyUsd: 300 });
  const after = await invoke(panel, "getLimits", {});
  assert.equal(after.maxSingleUsd, 60);
  assert.equal(after.maxDailyUsd, 300);
});

test("panel evaluate rejects invalid input", async () => {
  const { panel } = panelWithFreshStorage();
  await assert.rejects(() => invoke(panel, "evaluate", { amountUsd: -1, dailySpentUsd: 0 }));
  await assert.rejects(() => invoke(panel, "evaluate", { amountUsd: "20", dailySpentUsd: 0 }));
  const { count } = await invoke(panel, "listRecent", {});
  assert.equal(count, 0);
});
