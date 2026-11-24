// Thin wrapper around the Forge Key-Value Store (@forge/kvs). All storage
// access goes through here so tests can pass a Map-backed fake with the
// same get/set shapes instead of the real KVS. See ADR 0003.

const LIMITS_KEY = "config:limits";
const HISTORY_KEY = "history:recent";
const HISTORY_CAP = 20;

// The demo defaults: used until an installation sets its own limits.
const DEMO_DEFAULTS = Object.freeze({ maxSingleUsd: 25, maxDailyUsd: 100 });

function requirePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(fieldName + " must be a finite number greater than zero.");
  }
  return value;
}

function createFlitzrStorage(store) {
  // Lazy require: the real KVS is only loaded when no store is injected,
  // so importing this module never touches the Forge runtime.
  const backend = store || require("@forge/kvs").kvs;

  async function getLimits() {
    const stored = await backend.get(LIMITS_KEY);
    if (stored === undefined) {
      return { ...DEMO_DEFAULTS, usingDemoDefaults: true };
    }
    return {
      maxSingleUsd: stored.maxSingleUsd,
      maxDailyUsd: stored.maxDailyUsd,
      usingDemoDefaults: false
    };
  }

  async function setLimits(input = {}) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("A valid limits object is required.");
    }
    const hasSingle = input.maxSingleUsd !== undefined;
    const hasDaily = input.maxDailyUsd !== undefined;
    if (!hasSingle && !hasDaily) {
      throw new Error("Provide at least one limit to change: maxSingleUsd and/or maxDailyUsd.");
    }
    const current = await getLimits();
    const merged = {
      maxSingleUsd: hasSingle
        ? requirePositiveNumber(input.maxSingleUsd, "maxSingleUsd")
        : current.maxSingleUsd,
      maxDailyUsd: hasDaily
        ? requirePositiveNumber(input.maxDailyUsd, "maxDailyUsd")
        : current.maxDailyUsd
    };
    if (merged.maxDailyUsd < merged.maxSingleUsd) {
      throw new Error("The daily limit must not be below the single limit.");
    }
    await backend.set(LIMITS_KEY, merged);
    return merged;
  }

  // Records one evaluation, newest first, keeping only the most recent 20.
  // The issue key is stored only when one was in context. Known limitation:
  // last-write-wins means two near-simultaneous evaluations can drop one
  // record (read-modify-write race); acceptable for a demo app (ADR 0003).
  async function recordEvaluation(entry) {
    const record = {
      at: new Date().toISOString(),
      amountUsd: entry.amountUsd,
      dailySpentUsd: entry.dailySpentUsd,
      projectedDailySpendUsd: entry.projectedDailySpendUsd,
      decision: entry.decision
    };
    if (typeof entry.issueKey === "string" && entry.issueKey.length > 0) {
      record.issueKey = entry.issueKey;
    }
    const recent = (await backend.get(HISTORY_KEY)) || [];
    recent.unshift(record);
    await backend.set(HISTORY_KEY, recent.slice(0, HISTORY_CAP));
    return record;
  }

  async function listRecentEvaluations(limit = HISTORY_CAP) {
    const recent = (await backend.get(HISTORY_KEY)) || [];
    // A usable limit is a positive integer, capped at 20; anything else
    // (missing, zero, negative, non-numeric) means the default.
    const requested = Math.floor(limit);
    const count = Number.isFinite(requested) && requested > 0
      ? Math.min(requested, HISTORY_CAP)
      : HISTORY_CAP;
    return recent.slice(0, count);
  }

  return { getLimits, setLimits, recordEvaluation, listRecentEvaluations };
}

module.exports = { createFlitzrStorage, DEMO_DEFAULTS };
