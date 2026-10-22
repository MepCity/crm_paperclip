# ADR 0010 — PostgreSQL job queue and worker

- Status: Accepted (direction A; Q2–Q7 open)
- Date: 2026-10-22
- Issue: MEP-1038; umbrella: MEP-1036
- Decision owners: Platform Lead and CTO, after independent QA review
- Scope: design only; no code, migration, role grant or provider access
- Dependencies: ADR 0001, ADR 0009 Topic 9 / Q2 / Q10; ADR 0002 §5
  (Proposed, absent from this checkout; physical persistence remains deferred)

## Context and evidence boundary

[ADR 0001](0001-stack-and-repo-layout.md) selects Node.js, TypeScript,
PostgreSQL 18, Drizzle and `pg`, with a future `apps/worker` and PostgreSQL queue.
[ADR 0009](0009-real-email-and-calendar.md) Q10 advances the worker from Phase 4
to the start of Module 10; Q2 excludes hosted queue services. Initial consumers
are mailbox synchronization, outbox delivery, native calendar invitations and
CSV Notify Email. Q1 selects Google mail first; Q6 leaves a system sender
undecided. This ADR does not choose one or restore the earlier SMTP default.

The mail core in MEP-1037 was reviewed at `a043ee07`: tenant-scoped in-memory
storage, one personal mailbox per user, private-by-default messages and outbox
row types. It is a contract input, not proof of durable enqueue or sending.
Its outbox states are `queued`, `sending`, `sent`, `failed`, `cancelled`; leases,
atomic transitions and retries are intentionally deferred to later slices.
The dependency branch was read through git without incorporating its code.

[Metadata research](../../research/specs/email-calendar-metadata.md) establishes
mail model gaps; [inbox research](../../research/specs/email-inbox.md) records
an access gap. Neither establishes queue internals or failure UI. This is our
internal architecture proposal, not observed reference CRM behaviour. No
reference session was opened and no customer data was used.

## Options and criteria

| Criterion | A. Own PostgreSQL job table | B1. pg-boss | B2. Graphile Worker | C. In-process scheduler |
| --- | --- | --- | --- | --- |
| Durable work and transactional enqueue | Our table in the domain transaction; we implement claims, retry and recovery | PostgreSQL-backed scheduling/retry facilities; integration must prove same-transaction enqueue | PostgreSQL-backed queue with SQL enqueue; adapter must prove domain transaction integration | Timers disappear on restart; no atomic durable handoff |
| Dependency weight | Existing `pg`/Drizzle; most implementation and maintenance responsibility | Adds queue package, its migrations and dependencies such as cron/recurrence parsing and error serialization | Adds queue package, config/logger/CLI dependencies and library schema migrations | Small runtime footprint, but durability eventually requires another queue |
| Tenant keys and RLS | Explicit organization column, composite references and policies under our control | Library-managed schema; tenant policy compatibility needs a pinned-version spike, not an assumption about JSON payloads | Own namespace and private tables; docs discourage direct table use, restricted runtime role needs setup | No database row boundary; process context alone cannot isolate durable work |
| License | Our repository terms; no new queue license | MIT; retain notices | MIT community package; no Pro requirement proposed | No new queue license |
| Operations and cost | Self-hosted; we own metrics, cleanup and incident procedures | Self-hosted; fewer queue algorithms to build, added upgrade surface | Self-hosted; built-in queue mechanics, schema/API integration cost | Duplicates across web replicas, missed work on deploy, weak diagnosis |
| Assessment | Recommend, conditional on concurrency and isolation tests | Credible fallback if our correctness/maintenance cost proves too high | Credible fallback with a tenant-owned envelope/shadow table | Reject as the authority for mail or scheduled work |

Sources: [pg-boss overview](https://github.com/timgit/pg-boss),
[dependency manifest](https://github.com/timgit/pg-boss/blob/master/package.json),
[MIT license](https://github.com/timgit/pg-boss/blob/master/LICENSE);
[Graphile introduction](https://worker.graphile.org/docs),
[schema and restricted-role guidance](https://worker.graphile.org/docs/schema),
[dependency manifest](https://github.com/graphile/worker/blob/main/package.json),
[MIT license](https://github.com/graphile/worker/blob/main/LICENSE.md).
Reviewed 2026-10-22; manifests are moving upstream snapshots, not pinned adoption
versions or bundle benchmarks. RLS assessments are our integration judgement:
neither library is declared unsafe or incompatible. A library would still need
a trusted tenant column outside payloads, role/catalog tests and an upgrade
policy. PostgreSQL already being present does not make any option cost-free.

## Proposed decision

Choose A: a small, bounded queue behind a core port, using short transactions
and `FOR UPDATE SKIP LOCKED` for competing consumers. PostgreSQL documents
[SKIP LOCKED](https://www.postgresql.org/docs/18/sql-select.html#SQL-FOR-UPDATE-SHARE)
as useful for queue-like consumers; it does not promise fair ordering. Delivery
is **at least once**. A unique enqueue key and fenced acknowledgement do not
make external effects exactly once. Revisit B before adding workflow/automation
features if scope or measured contention exceeds this design.

Use `LISTEN/NOTIFY` only to reduce idle latency. Durable rows and a periodic
poll are authoritative. Send an empty wake signal in the enqueue transaction;
never include identifiers, mail content or secrets. Notifications are visible
to database users and delivered at commit, per
[PostgreSQL NOTIFY](https://www.postgresql.org/docs/18/sql-notify.html).
Commit `LISTEN` before the initial scan, rescan after reconnect, and poll every
five seconds (provisional) even without notifications. Future `run_at` jobs
and recovery must not depend on receiving a wake signal.

### Draft row shape, not DDL

All names, physical types, constraints, indexes and grants below are proposals
for a later high-tier persistence issue after ADR 0002 is accepted.

| Column(s) | Draft shape and purpose |
| --- | --- |
| `organization_id`, `id` | Non-null tenant-leading composite primary key; organization immutable after enqueue |
| `kind`, `payload_version` | Allowlisted handler name and supported integer version; unknown versions fail visibly |
| `payload` | Size-limited, strictly validated JSON of opaque resource references only; no organization field, credentials, recipients, bodies or attachment bytes |
| `idempotency_key` | Non-null opaque logical operation key; unique with `(organization_id, kind)` across all retained states |
| `status` | `queued`, `running`, `succeeded`, `failed`, `cancelled` |
| `run_at` | UTC instant (`timestamptz`); earliest eligible claim, used for scheduling and retries |
| `attempts`, `max_attempts` | Nonnegative claims made and positive bounded attempt limit; default five total attempts |
| `locked_by`, `lease_token`, `lease_expires_at` | Worker instance, fresh per-claim fencing token and database-clock deadline; all present only while running |
| `created_at`, `updated_at`, `finished_at` | Database timestamps; terminal rows retain completion time |
| `last_error_code`, `last_error_at` | Safe allowlisted classification and time; no arbitrary exception or provider response |

Propose a partial due index on `(run_at, organization_id, id)` for queued rows,
a running-lease expiry index, and tenant-leading resource foreign keys. A
payload reference must resolve through the row's organization; JSON alone cannot
supply foreign-key integrity. If the physical schema needs enforceable target
keys, add typed envelope columns at persistence review rather than trusting JSON.
No tenantless jobs initially; global maintenance needs a separate future decision.

Enqueue takes a trusted server context, not an organization from request JSON or
provider webhook data. On duplicate key, return the original job without resetting
its payload, schedule or terminal state; reject a conflicting operation fingerprint.
The key identifies an outbox item or a sync generation/page, not merely a mailbox:
a later legitimate sync must receive a new key. Retrying retains the same logical
operation key. Keep keys through the retry/reconciliation horizon; deletion must
not silently permit a duplicate external send. Retention is an approval question.

### Lifecycle, leases and recovery

1. Enqueue the domain intent and job in one database transaction. If either
   write fails, both roll back. Until persistence is approved, an in-memory port
   can model semantics but must not advertise restart durability or real delivery.
2. Claim a small bounded batch of due queued rows, ordered by `run_at` then key,
   with `FOR UPDATE SKIP LOCKED`; atomically mark running, increment attempts and
   assign a fresh lease token before committing. Do not hold a row lock or database
   transaction while awaiting provider I/O. Start with two handlers per process;
   use bounded batches and per-tenant backpressure to avoid a busy tenant starving
   others. Strict FIFO is not guaranteed.
3. Provisional lease: 60 seconds; renew every 20 seconds using database time and
   a conditional update matching tenant, job, running state and token with an
   unexpired lease. Loss of renewal aborts work through an `AbortSignal` and forbids
   further writes. Completion, failure and domain-state updates use the same fence;
   zero updated rows means ownership lost. Timeouts bound provider calls below the
   lease, and long syncs checkpoint between pages.
4. On success, commit domain result and `succeeded` together, conditioned on the
   valid lease. A domain checkpoint is idempotent: messages use the tenant/mailbox/
   provider-message identity; cursors advance only with committed page results.
5. A periodic bounded recovery scan locks expired running rows with SKIP LOCKED
   and invalidates their old token. Retry-safe work returns to queued with backoff;
   exhausted work becomes failed. An old worker cannot acknowledge a reclaimed job.
   Fencing prevents stale database writes, not an external send already in flight.

For ordinary transient failures, use full jitter in
`[0, min(15 minutes, 5 seconds * 2^(attempts - 1))]`; persist the selected next
`run_at`. A provider Retry-After is a lower bound, never shortened by jitter;
store a mailbox pause when rate-limited so other jobs do not bypass it. Invalid
payloads, missing/deleted resources, revoked authorization and permanent recipient
errors stop automatic retries. Disconnected mailboxes cancel pending work and
running handlers recheck connection generation and authorization before each
external effect. Treat revoked credentials as requiring reconnection, not a hot loop.

Scheduled jobs use persisted UTC `run_at` and cannot run early; after downtime,
due work resumes. Materialize recurring occurrences with a deterministic occurrence
key and an explicit missed-occurrence policy (sync coalesces into one catch-up;
user scheduled sends remain one intent). Do not use a web-process timer as the
source of scheduled work. Limit competing sync/send operations per mailbox with
a leased mailbox gate, not process-local concurrency alone; its exact schema
and provider quota policy need the sender/sync implementation review.

### Outbox and external side effects

The job is an execution envelope; the outbox is the mail intent and delivery
state. It owns the stable message identifier and immutable send content. Queue
attempts must not overwrite delivered mail. The existing core outbox vocabulary
stays unchanged by this document; its counters/statuses must be updated atomically
with queue transitions in the future sender adapter, not run a second retry loop.

If the provider supports a documented idempotency mechanism, use the stable intent
key. A stable Message-ID by itself does not guarantee provider deduplication. A
crash or timeout after possible provider acceptance is an **uncertain delivery**:
mark the queue job failed with `delivery_unknown`, hold the outbox for reconciliation
and show a safe error. Expired running sends whose provider outcome cannot be
proved follow that same path, rather than automatically resending. The current
outbox `failed` plus safe `lastError` can represent this hold; any extra reconciliation
state requires a separate contract change. Reconcile against provider evidence before
recording sent or explicitly retrying; a user retry must warn of duplicate risk.

Replayed inbound sync is safe through upsert/checkpoints. Native ICS invitations
and Notify Email use the same outbox safeguards. Execution rechecks mailbox owner,
connection generation and recipient guard; job possession is not user permission.
This ADR authorizes no live messages, provider setup or reference CRM writes.

## Worker placement, role and isolation

Proposed layout: `apps/worker/src/` contains bootstrap, polling, signal handling
and an allowlisted handler registry. `packages/core` owns queue ports, payload
validation, handlers/domain rules, outbox coordination and safe failure mapping;
`packages/db` owns the eventual PostgreSQL adapter and migrations. Dependency
direction is `apps/worker → packages/core → packages/db`, parallel to `apps/web`;
no Next.js imports or SQL in worker bootstrap. Do not add a queue package now.

Propose a dedicated `crm_worker` login, distinct from `crm_app` and a non-login
migration owner: no superuser, BYPASSRLS, table ownership or runtime DDL. Only the
worker gets an explicit cross-organization queue claim policy; browser-serving
paths cannot claim, lease or administer jobs. App enqueue access is tenant-scoped
and restricted to validated intent creation; no arbitrary handler selection from
HTTP. Runtime role tests must prove these restrictions, including column writes.

After claiming, derive organization context **only from the returned row**, never
from payload, webhook data or a process-global variable. Open domain transactions
with transaction-local tenant context, validate every resource against that tenant,
and use the same core write/authorization services as foreground actions. Connection
pool reuse must not leak context. A queue-wide policy must not imply cross-tenant
read access to mail/domain tables. Secret storage is accessible only through the
connector/SecretBox boundary; queue payloads and `crm_app` reads never select secrets.

The claim policy, tenant-context mechanism, FORCE RLS/ownership model, secret-column
grants, tenant-leading foreign keys and mailbox gates all **depend on acceptance
and reconciliation of ADR 0002 §5**. Its worker direction is an input, not approved
SQL available here. PostgreSQL [RLS rules](https://www.postgresql.org/docs/18/ddl-rowsecurity.html)
require both appropriate privileges and policies; table owners and BYPASSRLS are
special cases. Do not solve claim visibility by disabling RLS or granting broad
worker bypass. Migrations, role creation and persistent mail/queue adapters wait
for ADR 0002 and their own high-tier approval. Port contracts, fakes and a worker
skeleton may proceed as separately authorized slices; no implied migration approval.

## Operations, local development and CI

- Expose safe structured lifecycle events: kind, attempt, duration, correlation
  token and allowlisted error code. Never log payloads, message text, addresses,
  credentials or raw provider errors. Keep tenant identifiers in access-controlled
  operational storage; metric labels use kind/result, not tenant/job ids.
- Track due queue depth/oldest age, running/expired leases, retries, terminal
  failures and worker heartbeat. Failed jobs remain inspectable; fail readiness
  on unavailable queue storage, alert on growing backlog or missing heartbeat.
  Operator inspection is restricted; mailbox owners see safe last-sync/outbox
  failure status under the existing mail read boundary, not a raw queue browser.
  Exact UI wording/layout awaits screen research. No failure is silently discarded.
- On SIGTERM/SIGINT stop claims and readiness, cancel the listener and drain for
  at most 30 seconds while renewing owned leases. Abort remaining handlers, close
  database/listener connections and exit. Release retry-safe work only after it
  stops; unresolved sends retain their lease for uncertain-delivery recovery.
  A forced kill is handled by the same expiry path. No runtime schema repair.
- Later dev orchestration should run web and worker as sibling processes using
  one worktree-specific database and one owned cleanup lifecycle, following ADR
  0001's disposable PostgreSQL harness. Default connector is fake and external
  egress is denied. Production requires explicit connector/secret configuration;
  never silently fall back to in-memory work. No hosted dependency or Docker
  requirement is introduced. Before ADR 0002, fake mode is explicitly ephemeral.
- CI uses synthetic fixtures and fake time/transport; PostgreSQL integrations
  use a disposable database with real runtime roles. Block non-loopback provider
  traffic, require no real accounts/secrets and inject fakes rather than live
  credentials. Local SMTP sinks are optional future connector tooling, not a
  prerequisite for queue tests. Do not start a worker on CI import or page loads.

## Test strategy for implementation slices

| Layer | Required evidence |
| --- | --- |
| Unit/contract | Strict payload/version rejection, tenant from row despite hostile payload, enqueue conflict/dedup, backoff/jitter bounds, Retry-After, scheduling, cancelled connection generation, safe errors, idempotent handler replay |
| PostgreSQL integration | Two competing clients claim distinct jobs; enqueue and domain intent roll back together; due-only claims; expired lease reclaim; stale completion and stale domain writes rejected; max attempts reached after crashes; notification loss/reconnect recovers by poll |
| Isolation/catalog | Actual app/worker roles, cross-tenant payload references denied, absent context denied, pool reuse safe, no browser claim/secret access, no runtime DDL/BYPASSRLS, explicit queue-only cross-tenant policy |
| Worker lifecycle | SIGTERM drain and forced kill, listener/connection cleanup, crash before/after checkpoint, bounded concurrency and mailbox gate, no real network or leaked error data |
| Sender/sync contract | Duplicate enqueue and replay; provider success followed by crash/timeout held as delivery_unknown without resend; safe checkpoint/cursor replay; disconnect cancels work; owner failure projection respects Q8 |

A fake queue cannot prove row locks, atomicity, persistence or RLS. Those checks
become required before durable worker delivery ships. This docs-only issue runs
only `git diff --check` and terminology/privacy review; no application tests,
Biome, typecheck or migrations are part of this change.

## Consequences and open questions

A keeps the tenant envelope explicit and avoids another schema owner, while
making concurrency correctness, vacuum/index maintenance, retention and monitoring
our responsibility. There is no throughput benchmark or exactly-once guarantee.
A future library swap must preserve enqueue identities, visible outcomes and
tenant isolation; it is a new decision if it changes the contract.

| ID | Question / proposed default | Owner and required gate |
| --- | --- | --- |
| Q1 | Accept A, or require a pinned pg-boss/Graphile spike before implementation? | Platform Lead recommends; CTO decides this ADR |
| Q2 | Final runtime roles, claim policy, domain tenant context and tenant-leading keys? | Platform Lead / CTO with ADR 0002 acceptance; before any persistence migration |
| Q3 | Accept provisional 60s lease, 20s renewal, 30s drain, 5s poll, five attempts and retry bounds? | Platform Lead; validate with crash/latency tests in worker slice |
| Q4 | Retain terminal rows/key tombstones how long, and who can reconcile/replay failed work? | Platform Lead / CTO before cleanup or operator API; no automatic purge initially |
| Q5 | Provider evidence for uncertain send reconciliation and safe manual retry? | Sender implementer and Platform Lead before real sending; no blind retry default |
| Q6 | Per-mailbox gate, quota configuration, fairness/backpressure limits and recurrence catch-up? | Platform Lead in sync/sender contract review; no cross-process safety claim until tested |
| Q7 | Alert transport and exact failure presentation without an approved system sender? | Platform Lead / UI Lead; safe stored status first, no implicit SMTP service |

Acceptance of the direction does not answer Q2 or approve DDL. Independent QA,
Platform Lead and CTO review apply to this high-tier ADR; implementation remains
separate and the ADR stays Proposed until an explicit architectural decision.
