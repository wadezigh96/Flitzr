# Key-Value Store (@forge/kvs) for limits and history

Three different things share the name "storage": the legacy `storage` module from `@forge/api` (feature-frozen 17 Mar 2025, now unsupported), the npm package `@forge/storage` (an internal shared library, not an app-facing API), and the current `@forge/kvs` package. We use `@forge/kvs`, with one key for the limits and one key holding the capped history array.

KVS needs the `storage:app` scope, and values cannot be `null`. The single-array history has a known read-modify-write race (two near-simultaneous evaluations can drop one record); acceptable for a demo app, avoidable later with transactions.
