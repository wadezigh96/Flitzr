import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Button,
  DynamicTable,
  Form,
  Heading,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Text,
  Textfield,
  useProductContext
} from "@forge/react";
import { invoke } from "@forge/bridge";

const DECISIONS = {
  ALLOW_WITHIN_DEMO_LIMITS: { label: "Allowed", appearance: "success" },
  HUMAN_APPROVAL_REQUIRED: { label: "Needs approval", appearance: "warning" },
  BLOCK_DAILY_LIMIT: { label: "Blocked", appearance: "danger" }
};

function usd(value) {
  return "$" + Number(value).toFixed(2);
}

function shortDate(isoString) {
  return new Date(isoString).toLocaleString();
}

function App() {
  const context = useProductContext();
  const issueKey = context && context.issue ? context.issue.key : undefined;

  const [limits, setLimits] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("20");
  const [spentToday, setSpentToday] = useState("30");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  async function refresh() {
    const [currentLimits, recent] = await Promise.all([
      invoke("getLimits"),
      invoke("listRecent", {})
    ]);
    setLimits(currentLimits);
    setHistory(recent.evaluations);
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message || "Could not load the Flitzr panel."))
      .finally(() => setLoading(false));
  }, []);

  async function onCheck() {
    setError(null);
    setResult(null);
    if (amount.trim() === "" || spentToday.trim() === "") {
      setError("Enter both amounts to run the check.");
      return;
    }
    const amountUsd = Number(amount);
    const dailySpentUsd = Number(spentToday);
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      setError("The proposed amount must be a number greater than zero.");
      return;
    }
    if (!Number.isFinite(dailySpentUsd) || dailySpentUsd < 0) {
      setError("Already spent today must be a number of zero or more.");
      return;
    }
    setChecking(true);
    try {
      const decision = await invoke("evaluate", { amountUsd, dailySpentUsd, issueKey });
      setResult(decision);
      await refresh();
    } catch (err) {
      setError(err.message || "The check failed. Try again.");
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return <Spinner size="medium" label="Loading Flitzr" />;
  }

  const decisionInfo = result ? DECISIONS[result.decision] : null;

  return (
    <Stack space="space.200">
      <Heading size="medium">Flitzr Finance Guardian</Heading>
      <Text>
        Evaluation only: Flitzr checks proposed spend against the demo policy.
        It never moves money.
      </Text>

      {limits && (
        <Text>
          Current limits: max single {usd(limits.maxSingleUsd)}, max daily{" "}
          {usd(limits.maxDailyUsd)}
          {limits.usingDemoDefaults ? " (demo defaults)" : ""}. Ask the Rovo
          agent to change them.
        </Text>
      )}

      {error && (
        <SectionMessage appearance="error" title="Something went wrong">
          <Text>{error}</Text>
        </SectionMessage>
      )}

      <Form onSubmit={onCheck}>
        <Textfield
          name="amountUsd"
          label="Proposed amount (USD)"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          isRequired
        />
        <Textfield
          name="dailySpentUsd"
          label="Already spent today (USD)"
          type="number"
          value={spentToday}
          onChange={(event) => setSpentToday(event.target.value)}
          isRequired
        />
        <Button type="submit" appearance="primary" isDisabled={checking}>
          {checking ? "Checking…" : "Check spend"}
        </Button>
      </Form>

      {result && decisionInfo && (
        <Stack space="space.100">
          <Lozenge appearance={decisionInfo.appearance}>{decisionInfo.label}</Lozenge>
          <Text>{result.explanation}</Text>
          <Text>
            Projected daily spend {usd(result.projectedDailySpendUsd)}, remaining
            after {usd(result.remainingAfterUsd)}.
          </Text>
        </Stack>
      )}

      <Heading size="small">Recent evaluations</Heading>
      <DynamicTable
        head={{
          cells: [
            { key: "at", content: "When" },
            { key: "amount", content: "Amount" },
            { key: "spent", content: "Spent today" },
            { key: "projected", content: "Projected" },
            { key: "decision", content: "Decision" },
            { key: "issue", content: "Issue" }
          ]
        }}
        rows={history.map((record, index) => ({
          key: record.at + "-" + index,
          cells: [
            { key: "at", content: shortDate(record.at) },
            { key: "amount", content: usd(record.amountUsd) },
            { key: "spent", content: usd(record.dailySpentUsd) },
            { key: "projected", content: usd(record.projectedDailySpendUsd) },
            {
              key: "decision",
              content: DECISIONS[record.decision]
                ? DECISIONS[record.decision].label
                : record.decision
            },
            { key: "issue", content: record.issueKey || "—" }
          ]
        }))}
        rowsPerPage={5}
        emptyView={<Text>No evaluations yet. Run a check above.</Text>}
      />
    </Stack>
  );
}

ForgeReconciler.render(<App />);
