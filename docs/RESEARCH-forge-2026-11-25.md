# Forge research for strengthening Flitzr — 25 November 2026

Research for the planned Flitzr upgrade: configurable limits + evaluation history,
a Jira issue panel, and more Rovo actions. All findings below are checked against
primary sources (Atlassian Forge documentation on `developer.atlassian.com`,
the Atlassian developer changelog, and the Atlassian Developer Community) on
25 Nov 2026. The Forge CLI is not installed on this machine, so CLI help text
was not consulted; nothing in this file depends on it. No other file in this
repo was modified for this research.

## TL;DR — recommendations

| Question | Answer |
| --- | --- |
| Storage | Use **`@forge/kvs`** (Key-Value Store). The old `storage` module from `@forge/api` stopped receiving feature updates on 17 Mar 2025 and is now unsupported. The npm package named `@forge/storage` is an internal shared library, not the app-facing API. |
| Issue panel UI | Use **UI Kit** (`@forge/react`). It needs no bundler or build step: the manifest resource points at the source file. Custom UI needs a Vite build to a `build/` folder. |
| Rovo actions | Yes — one app can declare **multiple `action` modules** for one `rovo:agent`, with **no documented limit** on the number of actions per agent. The same actions can also be listed in `rovo:mcp` `tools` (max 50 actions there). |

---

## 1. Storage: `@forge/kvs` vs the legacy Storage API

### 1.1 Which one is current

Forge's storage overview lists the Key-Value Store as ideal for
"[u]ser preferences, app configuration, simple data storage" — exactly the
Flitzr use case (two limit numbers plus a short history list).
[Storage overview](https://developer.atlassian.com/platform/forge/storage/)

The legacy KVS and Custom Entity Store were originally provided through the
`storage` module of the `@forge/api` package. Atlassian's migration guide
states: "As of March 17, 2025, we stopped applying feature updates to this
module. Instead, all new KVS and Custom Entity Store feature updates are
applied to the `@forge/kvs` package", and the guide's current heading calls
it the "unsupported storage module".
[Migration guide](https://developer.atlassian.com/platform/forge/storage-reference/kvs-migration-from-legacy/)

Per Forge changelog entry CHANGE-3252 (announced 22 Jun 2026), the legacy
`storage` module was subsequently removed from `@forge/api`, so apps still
importing `storage` from `@forge/api` fail to build or run.
[Forge changelog, CHANGE-3252](https://developer.atlassian.com/changelog/#CHANGE-3252)
(See the verification note in §5: the changelog page only renders recent
entries to a text fetch, so this entry's wording was read via a changelog
mirror that quotes the entry; the primary entry URL is the one cited.)

**Name warning.** The task's "`@forge/storage` (Storage API)" needs
untangling, because there are three different things:

- `@forge/kvs` — the current, documented app-facing package. Use this.
- `storage` from `@forge/api` — the legacy module. Frozen, then removed.
  Never import it in new code.
- The npm package `@forge/storage` — it exists, but its own description is
  "Common library for both Forge environment and Harmonised Connect app
  environment", i.e. an internal shared library, not the documented
  app-facing API. No Forge doc tells app developers to import it.
  [npm: @forge/storage](https://www.npmjs.com/package/@forge/storage)

### 1.2 Install, import, manifest scope

```bash
npm install --save @forge/kvs@latest
```

```js
import { kvs, WhereConditions } from '@forge/kvs';
```

Using `@forge/kvs` requires the `storage:app` scope in the manifest:

```yaml
permissions:
  scopes:
    - storage:app
```

[Key-value store API](https://developer.atlassian.com/platform/forge/storage-reference/kvs-api/)

### 1.3 API semantics

| Operation | Behaviour |
| --- | --- |
| `kvs.set(key, value, options?)` | Stores a JSON value. Last-write-wins by default; `keyPolicy: 'FAIL_IF_EXISTS'` refuses to overwrite an existing key. Optional TTL (max 1 year); expired data may still be readable for up to 48 hours while deletion runs asynchronously. Can return the previous or latest value and created/updated/expiry metadata. |
| `kvs.get(key, options?)` | Returns the value, or `undefined` if the key does not exist. Optional `metadataFields` (`CREATED_AT`, `UPDATED_AT`, `EXPIRE_TIME`). |
| `kvs.delete(key)` | Deletes by key; "succeeds whether the key exists or not". |
| `kvs.query()` | Builder: `.where('key', WhereConditions.beginsWith(prefix))`, `.limit(n)`, `.cursor(c)`, then `.getMany()` (returns `{ results: [{key, value}], nextCursor? }`) or `.getOne()` (first match, or `undefined`). Query returns up to 10 values by default; `.limit(n)` raises it to a maximum of 100. Only one `where` condition per query, only on the `key` field, and `beginsWith` is the only supported KVS condition. `kvs.query` does not return secrets set by `kvs.setSecret`. |

[Key-value store API](https://developer.atlassian.com/platform/forge/storage-reference/kvs-api/)
[Query](https://developer.atlassian.com/platform/forge/storage-reference/kvs-api-query)

Notes:

- Values can be any JSON type **except `null`**; they are serialised with
  `JSON.stringify`.
  [Key-value store](https://developer.atlassian.com/platform/forge/storage-reference/kvs/)
- Keys are lexicographically ordered, so query results come back ordered by
  key — a timestamp-prefixed key scheme sorts chronologically for free.
  [Key-value store](https://developer.atlassian.com/platform/forge/storage-reference/kvs/)
- Cursors are not stable and must not be persisted.
  [Key-value store](https://developer.atlassian.com/platform/forge/storage-reference/kvs/)
- `kvs.get` is strictly consistent; `kvs.query` is eventually consistent.
  [Key-value store](https://developer.atlassian.com/platform/forge/storage-reference/kvs/)
- Batch operations (multiple SET/GET/DELETE in one request) "use rate
  limits more efficiently and can be 5 times faster than making the
  individual requests in parallel".
  [Key-value store API](https://developer.atlassian.com/platform/forge/storage-reference/kvs-api/)
- Transactions exist for KVS: max 25 operations, 4 MB payload, each key
  used at most once per transaction.
  [KVS and Custom Entity Store limits](https://developer.atlassian.com/platform/forge/limits-kvs-ce/)

### 1.4 Key scoping: per-installation, not per-user

Data is automatically scoped per app installation (and environment):
"You don't need to include any identifiers for apps or installations in your
key. Internally, Forge automatically prepends an identifier to every key,
mapping it to the right app and installation."
[Key-value store API](https://developer.atlassian.com/platform/forge/storage-reference/kvs-api/)

There is no per-user scoping. The docs' own example encodes the user in the
key (`user:${userId}:preferences`), which is the pattern to follow if
per-user data is ever needed.
[Storage overview](https://developer.atlassian.com/platform/forge/storage/)

For Flitzr this means: one installation = one site's limits and history,
with no tenant-leak risk from key collisions. Do not store tenant data in
module-level variables or in-memory caches, which can leak across tenants.
[Storage overview](https://developer.atlassian.com/platform/forge/storage/)

Data is retained for 28 days after uninstallation, but is not automatically
restored on reinstall.
[Storage](https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/)

### 1.5 Limits (per installation)

| Resource | Limit |
| --- | --- |
| Request rate | 1000 RPS |
| Reads / writes | 4000 per min each, counted in 10 KB units (sizes rounded up to the nearest 10 KB) |
| Key length / format | Max 500 chars; must match `/^(?!\s+$)[a-zA-Z0-9:._\s-#]+$/` |
| Value size | Max **240 KiB** (raw) per value |
| Object depth | Max 31 |
| Reads / writes per key | 12 MB/s / 1 MB/s |

[KVS and Custom Entity Store limits](https://developer.atlassian.com/platform/forge/limits-kvs-ce/)

Flitzr's data is tiny against these limits: two numbers plus ~20 history
records of a few hundred bytes each is a few KB total, and a handful of
operations per evaluation. Note also that "KVS reads and writes are billable
above the free monthly allowance, and writes are significantly more expensive
than reads".
[Key-value store](https://developer.atlassian.com/platform/forge/storage-reference/kvs/)

### 1.6 Suggested data model for Flitzr (recommendation, not a doc claim)

```js
// Config: one key, two numbers. Absent key => fall back to the
// current defaults (25 / 100) — kvs.get returns undefined for a missing key.
await kvs.set('config:limits', { maxSingleUsd: 25, maxDailyUsd: 100 });

// History: one key holding a capped array (simplest correct option).
// Each evaluation reads the array, prepends the new record, trims to 20,
// and writes it back — one read + one write per evaluation, ~4 KB total,
// far under the 240 KiB value limit.
await kvs.set('history:recent', [ { at, amountUsd, dailySpentUsd, decision }, /* ...max 20 */ ]);
```

Alternative considered and not recommended: one key per record
(`eval:<timestamp>:<id>`) listed via `kvs.query().where('key',
beginsWith('eval:'))`. It works, but capping to 20 then needs a query plus
deletes of the oldest keys, i.e. more (expensive) writes per evaluation, for
no benefit at this scale. Known limitation of the single-array approach:
last-write-wins means two near-simultaneous evaluations can drop one
history record (read-modify-write race); acceptable for a demo app, and
avoidable later with transactions if it ever matters.

### 1.7 Unit testing code that uses KVS

There is no official Forge storage emulator or mock in the Forge docs as of
this research. Atlassian published
[RFC-128: Local development mocks for Forge Storage](https://community.developer.atlassian.com/t/rfc-128-local-development-mocks-for-forge-storage/99256)
(24 Feb 2026) proposing local mocks for KVS and SQL, and resolved it in
March 2026 ("We're closing this RFC and moving ahead with implementation",
first release scoped to local KVS/SQL mocks usable in tunnel mode with
seeding/reset); a follow-up prototype RFC (RFC-148) was listed in October
2026. No generally-available mock is documented in the Forge docs yet, so do
not wait for one.

Recommended approach (engineering recommendation, not a doc claim), fitting
Flitzr's existing `node --test` setup with zero dependencies:

1. Put all `kvs` calls behind one thin module (e.g. `src/storage.js`)
   exporting `getLimits`, `setLimits`, `recordEvaluation`,
   `listRecentEvaluations`.
2. Give that module a dependency-injection seam: it takes a `store` object
   defaulting to the real `kvs`, and tests pass a `Map`-backed fake
   implementing `get`/`set`/`delete`/`query` with the same shapes
   (`get` returns `undefined` for missing keys; `query().getMany()`
   returns `{ results }`).
3. Keep the policy logic (`evaluateFinancePolicy`) pure — it takes limits
   as arguments and never touches storage — so the existing 14 tests keep
   passing unchanged and only the thin storage module needs the fake.


---

## 2. Jira issue panel: UI Kit vs Custom UI

### 2.1 Verdict: UI Kit

The `jira:issuePanel` module "adds an issue panel to a Jira issue when a
configured button is clicked", shown above the Activity panel, in Jira and
Jira Service Management, new issue view only. Only users with permission to
edit the issue can see the button.
[Jira issue panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/)

Forge offers two ways to build the panel UI. UI Kit "is a React-based
framework" that natively renders components inside Atlassian apps; Custom UI
"allows you full control in building the app's user interface" and "runs
within an iframe, providing an isolated environment".
[UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/)

| | UI Kit (modern, `@forge/react`) | Custom UI |
| --- | --- | --- |
| Build step | **None.** The manifest resource points at the **source** file (`src/frontend/index.jsx`); Forge renders it. | **Required.** The frontend is a Vite + React app that must be built; the manifest resource points at the **build output** (`static/<key>/build` with an `index.html` entry point). |
| Styling / components | Atlassian's native components (`Form`, `Textfield`, `DynamicTable`, `Button`, `Lozenge`, `Text`, `Stack`, …), matching Jira's look automatically. | Full control (any HTML/CSS/JS), but you build and maintain the look yourself. |
| Runtime | Native render, no iframe. | Runs in an iframe. |
| Limits | No direct DOM access: "functionalities dependent on standard browser DOM elements, like custom HTML, portals, and forwarding refs, may not work as expected." | None of the above limits. |

[UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/)
[UI Kit components](https://developer.atlassian.com/platform/forge/ui-kit/components/)
[How to use Custom UI with the Forge module command](https://developer.atlassian.com/platform/forge/how-to-use-custom-ui-with-the-forge-module-command/)

For Flitzr's panel (two number inputs, a decision result, a short history
list), UI Kit covers every component needed, so Custom UI's build step and
extra maintenance buy nothing. **Use UI Kit.**

### 2.2 Dependencies

```bash
npm i react@18
npm i @forge/react@latest
npm i @forge/resolver@latest
```

[UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/)

Note: `@forge/react` v10+ is the current major line; component names changed
in v10 (`TextField` → `Textfield`, `Table` → `DynamicTable`), so follow the
current component reference, not older tutorials.
[UI Kit components](https://developer.atlassian.com/platform/forge/ui-kit/components/)

### 2.3 Manifest snippet

Adapted from the official module example
([Jira issue panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/))
and the UI Kit overview's resource/resolver examples
([UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/)):

```yaml
modules:
  jira:issuePanel:
    - key: flitzr-finance-panel
      resource: main
      resolver:
        function: panel-resolver
      render: native            # indicates UI Kit
      title: Flitzr Finance Guardian
      icon: <icon path relative to a declared resource, or absolute URL>
  function:
    - key: panel-resolver
      handler: index.handler    # resolver definitions exported from src/index.js

resources:
  - key: main
    path: src/frontend/index.jsx

permissions:
  scopes:
    - storage:app               # for KVS access from the resolver (see §2.5)
```

`resource` is required when using Custom UI or modern UI Kit, and `render:
'native'` indicates the module uses UI Kit; `title` and `icon` are required
properties of the module.
[Jira issue panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/)

### 2.4 Minimal file layout

```
src/
  index.js            # existing action handlers + resolver definitions
                      # (export const handler = resolver.getDefinitions())
  storage.js          # thin KVS wrapper (see §1.7)
  frontend/
    index.jsx         # UI Kit React app, rendered via ForgeReconciler
```

The UI Kit entry point imports React and renders with
`ForgeReconciler.render(<App />)` in `src/frontend/index.jsx`; the resolver
is defined with `new Resolver()`, `resolver.define(name, handler)`, and
exported as `resolver.getDefinitions()`.
[UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/)

### 2.5 How the frontend calls a resolver

The frontend calls backend resolver functions with `invoke` from
`@forge/bridge`:

```jsx
import { invoke } from '@forge/bridge';

const result = await invoke('evaluate', { amountUsd: 20, dailySpentUsd: 30 });
```

[invoke bridge API](https://developer.atlassian.com/platform/forge/apis-reference/ui-api-bridge/invoke/)

The backend defines the matching resolver (KVS and `@forge/api` cannot be
used in frontend code — storage access must go through a resolver):

```js
import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('evaluate', async ({ payload }) => {
  // payload: { amountUsd, dailySpentUsd }
  // read limits from KVS, run policy, record history, return the decision
  return { decision: 'ALLOWED', projectedDailySpendUsd: 50 };
});

export const handler = resolver.getDefinitions();
```

[UI Kit overview](https://developer.atlassian.com/platform/forge/ui-kit/overview/)

The panel gets the issue key from extension context, not from an API call:
use the `useProductContext` hook (UI Kit) to read `issue.key` (also
`issue.id`, `issue.type`, `project.key`, `isNewToIssue`).
[Jira issue panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/)

### 2.6 Scopes: none needed for a context-only panel (inference, see below)

**Conclusion: the panel needs no Jira product scopes.** Only `storage:app`
is needed, and only because the resolver uses KVS. Reasoning, from the docs:

- The `jira:issuePanel` module reference lists no scope requirement for the
  module itself.
  [Jira issue panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/)
- Scopes are required when an app calls Atlassian REST APIs; `forge lint`
  flags missing scopes at build time.
  [Add scopes to call an Atlassian REST API](https://developer.atlassian.com/platform/forge/add-scopes-to-call-an-atlassian-rest-api/)
- The issue key arrives via extension context (`useProductContext`), which
  is not a REST API call, and the panel's backend calls go to the app's own
  resolvers.
  [Jira issue panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/)
- The Custom UI issue-panel tutorial adds `read:jira-work` only because
  that example reads the issue's labels via the Jira API — scopes follow
  API usage.
  [How to use Custom UI with the Forge module command](https://developer.atlassian.com/platform/forge/how-to-use-custom-ui-with-the-forge-module-command/)

This is an inference from the four points above, not a sentence Atlassian
writes verbatim; verify with `forge lint` when the panel is built. If the
panel later reads issue fields (labels, summary, custom fields) via the Jira
API, add the matching `read:jira-work` scope at that point.

---

## 3. Rovo actions: multiple actions per agent, and MCP exposure

### 3.1 Yes — one agent can expose multiple actions

The `rovo:agent` module's `actions` property is "a list of the actions that
the Agent can invoke", and the official reference example lists four actions
for one agent.
[Rovo agent](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/)

Atlassian's own Q&A agent tutorial shows one agent wired to three actions
(`fetch-content`, `register-q-and-a`, `insert-q-and-a`) and states in its
FAQ: "How many actions can an app define for a prompt? Any number. App
prompts do not need any actions to be defined, but there is no limit to the
number of actions allowed."
[Build a Q&A Agent for Confluence](https://developer.atlassian.com/platform/forge/build-a-q-and-a-rovo-agent-for-confluence/)

Practical note (not a hard limit): Atlassian's Rovo guidance for the no-code
agent builder recommends no more than five actions per agent to maintain
performance. Four actions is comfortably inside that guidance.

### 3.2 How actions are declared

Each `action` module is implemented by a Forge `function` module. The action
declares an `actionVerb` — one of `GET`, `CREATE`, `UPDATE`, `DELETE`,
`TRIGGER` — plus typed inputs (`string`, `integer`, `number`, `boolean`,
each with `title`, `required`, `description`). Action data is limited to
5 MB. **Caveat: agents triggered by automation rules will NOT invoke
non-GET actions** — so the `set-limits` action (UPDATE) works in chat but
not from an automation rule.
[Action](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-action/)

Multiple actions can share one source file: each `function` module points at
a different exported handler (Flitzr already does this pattern with
`index.evaluateFinancePolicy`).

Proposed actions for Flitzr:

| Action key | `actionVerb` | Inputs | Purpose |
| --- | --- | --- | --- |
| `evaluate-finance-policy-action` (existing) | `GET` | `amountUsd`, `dailySpentUsd` (required numbers), `purpose?` | Evaluate against the stored limits (not hardcoded ones) and record the evaluation |
| `get-limits` | `GET` | — | Return the current limits |
| `set-limits` | `UPDATE` | `maxSingleUsd?`, `maxDailyUsd?` | Change the limits |
| `list-recent-evaluations` | `GET` | `limit?` | Return the last N evaluations (default 20) |

```yaml
modules:
  rovo:agent:
    - key: flitzr-finance-guardian
      name: Flitzr Finance Guardian
      description: <...>
      prompt: <... updated to mention limits are configurable ...>
      actions:
        - evaluate-finance-policy-action
        - get-limits
        - set-limits
        - list-recent-evaluations
  action:
    - key: evaluate-finance-policy-action
      # ... existing definition ...
    - key: get-limits
      name: Get finance limits
      description: Returns the current max single expense and max daily spend.
      actionVerb: GET
      function: get-limits
    - key: set-limits
      name: Set finance limits
      description: Changes the max single expense and/or max daily spend.
      actionVerb: UPDATE
      function: set-limits
      inputs:
        maxSingleUsd:
          title: Max single expense (USD)
          type: number
          required: false
        maxDailyUsd:
          title: Max daily spend (USD)
          type: number
          required: false
    - key: list-recent-evaluations
      name: List recent evaluations
      description: Returns the most recent finance policy evaluations.
      actionVerb: GET
      function: list-recent-evaluations
  function:
    - key: get-limits
      handler: index.getLimits
    - key: set-limits
      handler: index.setLimits
    - key: list-recent-evaluations
      handler: index.listRecentEvaluations
```

### 3.3 The same actions can be exposed via `rovo:mcp`

Yes. The `rovo:mcp` module "exposes actions as tools for custom agents in
Rovo Studio and third-party MCP clients", and its `tools` list references
the same `action` module keys used by `rovo:agent`. Limits: at most **one**
`rovo:mcp` module per app; each tool key must be unique and under 64
characters; at most **50** actions in the `tools` list. The MCP endpoint is
`https://mcp.atlassian.com/forge/<appId>`, and external MCP exposure is
disabled by default — an admin enables it per installation.
[Rovo MCP](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-mcp/)

```yaml
  rovo:mcp:
    - key: flitzr-finance-mcp
      name: Flitzr Finance Controls
      description: <...>
      tools:
        - evaluate-finance-policy-action
        - get-limits
        - set-limits
        - list-recent-evaluations
```

**Deadline to note:** starting **5 Jan 2027**, apps defining `rovo:mcp`
must also define `app.rovo` metadata, or future deployments will be
blocked.
[Rovo MCP](https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-mcp/)

---

## 4. Build plan implied by this research

1. `npm install --save @forge/kvs@latest react@18 @forge/react@latest @forge/resolver@latest`; add `storage:app` to manifest scopes.
2. Add `src/storage.js` (KVS wrapper + DI seam) and unit tests with a
   `Map`-backed fake; rewire `evaluateFinancePolicy` to read limits from
   KVS (defaults 25/100 when unset) and record each evaluation.
3. Add the three new actions + functions, wire all four into `rovo:agent`
   and `rovo:mcp`, and update the agent prompt to describe configurable
   limits.
4. Add `src/frontend/index.jsx` (UI Kit form + decision + history) and the
   `jira:issuePanel` module with a resolver in `src/index.js`.
5. Verify with `forge lint` (scopes), `forge deploy`, and an end-to-end
   check on the demo site; before 5 Jan 2027, add the `app.rovo` metadata
   required for `rovo:mcp` apps.

---

## 5. Verification notes and caveats

- **CHANGE-3252 (legacy storage removal).** The Atlassian changelog pages
  only render recent entries to a text fetch, so the June 2026 entry's
  wording was read via a changelog mirror
  (`reef-staging.pkslabs.com/f/@pkslabs/atlassian/CHANGE-3252`) that quotes
  the entry and links the primary URL cited in §1.1. Independently
  verified from primary sources: feature updates stopped 17 Mar 2025, the
  migration guide now calls the module "unsupported", and the legacy docs
  pages have moved under `-legacy` URLs. The recommendation (use
  `@forge/kvs`) does not depend on the removal claim.
- **Query limit discrepancy.** The KVS query reference's `query.limit`
  section says the API returns up to 10 values by default, increasable to
  a maximum of 100; one example comment on the same page says "up to a
  maximum of 20". The reference section is authoritative; either way,
  Flitzr's `.limit(20)` is valid.
  [Query](https://developer.atlassian.com/platform/forge/storage-reference/kvs-api-query)
- **Scopes (§2.6)** is an inference from four documented facts, labelled
  as such; confirm with `forge lint` at build time.
- **Data model (§1.6) and test approach (§1.7)** are engineering
  recommendations built on the documented API, not doc claims.
- **Forge CLI** was not installed on this machine, so no CLI help output
  was consulted; all claims above come from the docs.

## Sources

- Storage overview — https://developer.atlassian.com/platform/forge/storage/
- Key-value store — https://developer.atlassian.com/platform/forge/storage-reference/kvs/
- Key-value store API — https://developer.atlassian.com/platform/forge/storage-reference/kvs-api/
- Query — https://developer.atlassian.com/platform/forge/storage-reference/kvs-api-query
- KVS and Custom Entity Store limits — https://developer.atlassian.com/platform/forge/limits-kvs-ce/
- Migrating storage functions to @forge/kvs from @forge/api — https://developer.atlassian.com/platform/forge/storage-reference/kvs-migration-from-legacy/
- Storage (retention) — https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/
- Forge changelog, CHANGE-3252 — https://developer.atlassian.com/changelog/#CHANGE-3252
- npm: @forge/storage — https://www.npmjs.com/package/@forge/storage
- RFC-128: Local development mocks for Forge Storage — https://community.developer.atlassian.com/t/rfc-128-local-development-mocks-for-forge-storage/99256
- Jira issue panel — https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/
- UI Kit overview — https://developer.atlassian.com/platform/forge/ui-kit/overview/
- UI Kit components — https://developer.atlassian.com/platform/forge/ui-kit/components/
- How to use Custom UI with the Forge module command — https://developer.atlassian.com/platform/forge/how-to-use-custom-ui-with-the-forge-module-command/
- invoke bridge API — https://developer.atlassian.com/platform/forge/apis-reference/ui-api-bridge/invoke/
- Add scopes to call an Atlassian REST API — https://developer.atlassian.com/platform/forge/add-scopes-to-call-an-atlassian-rest-api/
- Rovo agent — https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-agent/
- Action — https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-action/
- Rovo MCP — https://developer.atlassian.com/platform/forge/manifest-reference/modules/rovo-mcp/
- Build a Q&A Agent for Confluence — https://developer.atlassian.com/platform/forge/build-a-q-and-a-rovo-agent-for-confluence/
