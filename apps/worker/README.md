# Ephemeral worker skeleton

This slice implements ADR 0010 direction A behind `@crm/core/jobs`. It adds no
PostgreSQL driver, schema, migrations, role grants, provider connection or real
mail handler. ADR 0002 acceptance and separate persistence review remain required.

Run `pnpm --filter @crm/worker dev:fake` explicitly to start an **empty, ephemeral**
worker. Jobs disappear on restart; this is not a delivery service. Importing
`src/main.ts` starts nothing. Running it without `--ephemeral` fails closed.
The workspace glob already discovers the package; the shared typecheck includes it.

## Contract and composition

- Register allowlisted `(kind, version)` definitions in `JobCatalog`. Payloads are
  strict JSON objects containing only declared opaque reference strings (up to
  16 keys, 128 characters per value, 4 KiB serialized). Field names end in `Id`,
  `Ref` or `Generation`. Tenant fields, credential fields, nested objects and
  arbitrary body/recipient data are rejected. No production kinds are invented.
- `enqueue({ organizationId }, input)` requires trusted server context. The
  idempotency scope is organization + kind + key across all retained states.
  Canonical payload, version, explicit schedule and max attempts form the
  conflict fingerprint. Omitted scheduling means immediate on first enqueue;
  repeating that request returns its original schedule, counters and state.
- All timestamps are UTC epoch milliseconds. Adapter-owned time determines due
  claims and lease validity. Default five total attempts; limit 100. Claim batches
  and recovery scans are bounded to 100; default per-organization running cap two.
  Claim ordering is due time then job ID, without a FIFO guarantee.
- `claim`, `renew`, `succeed`, `fail` and `cancel` are worker operations. Each write
  requires the returned row's organization, job ID, owner, fresh token and an
  unexpired lease. `recoverExpired` invalidates old ownership, applies persisted
  jitter/backoff, and fails exhausted jobs. `retrySafe: false` crash recovery
  fails with `delivery_unknown`, including when attempts remain.
- Full jitter ranges from zero to `min(900000, 5000 * 2^(attempts - 1))` ms.
  Absolute `retryAfter` is a lower bound. Only transient, rate-limit and expired
  lease classifications permit retries. Error storage never takes raw exceptions.
- Compose `Worker` with a queue, catalog, `HandlerRegistry`, and cleanup callback.
  Default concurrency two, poll five seconds, lease 60 seconds, renew 20 seconds.
  A handler's mandatory `isCurrent` validates tenant-scoped resources, generation
  and authorization. `checkpoint()` repeats that check and verifies lease ownership;
  handlers must call it before **each** effect and domain checkpoint. Future
  domain writes must atomically enforce the same fence in their own transactions.
- `JobGate` is injectable. The default mailbox gate provides process-local
  exclusion by row organization and `payload.mailboxId`; it is not a distributed
  lease. Contending claims return to scheduled retry without executing the handler.
  Durable mailbox gating/pause and provider quota policy belong to the sender/sync
  adapter and persistence slices. Queue possession never grants domain access.

## Lifecycle and evidence limits

SIGTERM/SIGINT immediately stop readiness and new claims. Active handlers keep
renewing while draining. The combined drain/cleanup budget is at most 30 seconds.
On expiry, signals abort, renewal timers stop, cleanup is initiated once and the
CLI exits with failure. Unresolved jobs remain leased; recovery decides whether
replay is safe. No retry-safe work is released before its handler stops. A stuck
claim is bounded by the same deadline. Cleanup callbacks should close future
listeners and connections, not wait for handler completion.

Tests use synthetic references, fake time and handlers, with no transport or real
accounts. They prove in-process queue semantics, checkpoint replay, local mailbox
exclusion, polling recovery, fencing and signal/drain behavior. They cannot prove
PostgreSQL locks/atomicity, cross-process fencing of domain writes, RLS, durable
mailbox gates, restart durability, a real SIGKILL or provider effect idempotency.
A crashed worker is modeled by an expired unacknowledged claim. Actual role/catalog,
crash/transaction and multi-process tests must land with the PostgreSQL adapter.

Targeted checks:

```sh
pnpm exec biome check packages/core/src/jobs apps/worker packages/core/package.json scripts/typecheck.mjs
node scripts/typecheck.mjs
pnpm exec vitest run packages/core/src/jobs/jobs.test.ts apps/worker/src/worker.test.ts
```
