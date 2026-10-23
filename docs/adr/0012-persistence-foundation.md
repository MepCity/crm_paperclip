# ADR 0012 — Persistence foundation independent of record storage

- Status: Proposed
- Date: 2026-10-23
- Issue: MEP-1186; split authorized by CTO in MEP-1184
- Deciders: Platform Lead and CTO, after independent review
- Scope: document only; no implementation, DDL, grants or benchmark run

## 1. Decision boundary and source register

Propose accepting the tenant and migration foundation independently of the
record-field storage choice. Acceptance of this ADR would replace the
**foundation dependency only** in ADRs 0005, 0008, 0009, 0010 and 0011 J.
It would not accept ADR 0002 or authorize a migration by itself. Each persistent
adapter still needs its own reviewed implementation and domain decisions.

ADR 0002 is absent from main. Its source for this extraction is the immutable
[ADR 0002 snapshot at 3abf77ae](https://github.com/MepCity/crm_paperclip/blob/3abf77ae/docs/adr/0002-record-storage-and-tenant-isolation.md).
Section references to ADR 0002 below refer to that snapshot, not an assumed
local file. It can also be read with
`git show origin/mep/MEP-40:docs/adr/0002-record-storage-and-tenant-isolation.md`
while that branch exists. This proposal leaves that file untouched.

| Source | Sections used / authority |
| --- | --- |
| [ADR 0001](0001-stack-and-repo-layout.md) | §1 stack; §2 database package; §3 tenancy and UUIDv7; §6 test database; §7 forward-only SQL migrations |
| ADR 0002 snapshot above | Decision §1 Keys; §5 Tenant isolation; §6 Write path; §7 Events; §8 Slot lifecycle; Measurement / Outcome / Alternatives / Consequences |
| [MEP-50 report](../../scripts/bench/results/record-storage.md) | Environment, model comparison and RLS observations; synthetic record workloads |
| [MEP-96 report](../../scripts/bench/results/record-storage-slots.md) | Intermediate slot measurements; not a replacement for the MEP-103 protocol |
| [MEP-103 report](../../scripts/bench/results/record-storage-slots-2.md) | Measurement disposition; §2 sorting; §5 lock/backfill; §7 paired RLS; Acceptance expectations |
| [MEP-344 review](/MEP/issues/MEP-344) | Finding preserved in ADR 0002 Outcome: typed table not measured on the sort matrix; failed rules cannot be waived by argument |
| [CTO split decision](/MEP/issues/MEP-1184) | Separate this foundation; record layout waits for MEP-358 and board gate MEP-376 |

This is our internal architecture proposal, not observed reference CRM behaviour.
No reference session, customer data or new performance measurement is needed.

## 2. Tenant-leading keys and authorization

Carry forward ADR 0002 Decision §1 **Keys** and §5 **Constraint checks**, with
ADR 0001 §3 as the earlier tenancy rule:

- Organization-owned CRM tables have non-null `organization_id`. For rows with
  an `id`, the primary key is `(organization_id, id)`; relation and natural keys
  also start with `organization_id`. Uniqueness is scoped to the organization.
- References between organization-owned rows use composite foreign keys with
  `organization_id` first. A UUID alone must not select a parent across tenants.
  Global identity/tenancy roots retain ADR 0001's model; this does not rewrite
  authentication tables into CRM tables.
- New entity IDs follow ADR 0001 §3 UUIDv7; timestamps are UTC `timestamptz`.
  SQL names use lower snake case, following ADR 0002's table/key sketches. This
  names domain entities without prescribing record-field storage.
- Resolve `OrgContext` from authenticated membership, never from a request's
  asserted organization. Explicit tenant predicates remain in repository SQL;
  RLS adds a second guard. Domain permissions are still required within a tenant.
- Map foreign-key and uniqueness failures to safe domain errors. Never expose
  database messages or key values. Cross-tenant probes must be indistinguishable
  from missing resources; test them as the actual runtime role.

RLS separates organizations, not actors within one organization. Documents
capabilities, mailbox ownership/sharing and customization permissions remain
owned by ADR 0008 §2/Addendum A, ADR 0009 Q8 and ADR 0011 §3 respectively.

## 3. RLS, runtime roles and connection context

Carry forward ADR 0002 Decision §5, including its limitations. For every new
organization-owned CRM table, enable RLS and install a policy for its permitted
runtime roles with both `USING` and `WITH CHECK` equivalent to:

```sql
organization_id = (select current_org_id())
```

`current_org_id()` is the stable SQL helper returning
`nullif(current_setting('app.org_id', true), '')::uuid`. This is a policy sketch,
not executed DDL. Missing/empty context returns null: reads match no rows and
inserts fail the check. Invalid UUID context fails rather than selecting a tenant.

### Context lifecycle

`withOrg(ctx, fn)` opens a transaction on one checked-out connection, sets
`select set_config('app.org_id', $1, true)` with the authorized organization,
then passes only its distinct transaction-handle type to repositories. No CRM
SQL may precede that setting or run through a raw pool handle. The setting is
transaction-local, never a process-global or session-default tenant selector.

Carry forward §5's setting-hygiene tests: centralize setting access in tenancy;
reuse a connection poisoned with another tenant's session setting; prove the
current transaction uses its own tenant and its local setting disappears after
commit and rollback. An older session setting can reappear afterwards, so every
subsequent CRM transaction must set its own context before querying.

### Role and catalog contract

| Role | Proposed boundary (ADR 0002 §5 unless stated) |
| --- | --- |
| `crm_owner` | Migration/maintenance owner; DDL authority; never the browser-serving runtime connection |
| `crm_app` | `DATABASE_URL`; no superuser, BYPASSRLS, ownership or runtime DDL; explicit per-table/column grants in each migration; only insert/select on record events |
| `crm_auth` | Separate authentication URL; identity/tenancy operations before CRM context exists; no CRM-table access |
| Worker role | ADR 0010 Worker placement, role and isolation: separate non-owner role, no superuser/BYPASSRLS/DDL; queue claim policy only may span organizations; domain work returns to tenant-local transactions |

The owner uses `DATABASE_MIGRATION_URL`. Local dev and test harnesses provision
roles; cluster superuser use is limited to provisioning. `crm_app` may read only
approved user display columns and memberships under tenant policies; no sessions,
credentials or verification/invitation tokens. Mail secrets need the separate
connector boundary and explicit grants of ADR 0009 Topic 2 / ADR 0010; they are
not automatically granted to any general domain worker.

On first use, reject an unsafe runtime role. ADR 0002's guard checks superuser,
BYPASSRLS and ownership of `records`; **extend the ownership check to every CRM
table the adapter accesses**, including tables created before `records` exists.
This is an explicit extraction adaptation, not an already implemented guard.
Retain the proposal not to FORCE RLS: owner-run migrations must remain possible,
and FORCE does not constrain superusers (ADR 0002 §5 / Alternatives).

Catalog integration tests must verify RLS/policies on CRM tables with
`organization_id`, grants and lack of credential access. Identity/tenancy tables
retain their separate service boundary; explicitly classify them rather than
silently exempting new CRM tables. ADR 0010's queue-only cross-tenant policy
needs an explicit test exception; it grants no cross-tenant mail/domain access.
No SECURITY DEFINER function or owner-rights CRM view is introduced here; either
requires a separate ADR review (ADR 0002 §5).

### Threat boundary

`app.org_id` is a setting, not a credential. Arbitrary SQL as `crm_app` can select
another organization. This policy protects against omitted/wrong predicates,
not SQL injection or a compromised runtime. Bind values; resolve identifiers
only from trusted metadata with one quoting path; never execute request SQL.
Carry forward ADR 0002 §5's stronger-context trigger: before user-authored SQL
expressions or mutually untrusted tenants share a deployment, decide a context
the runtime cannot forge. Per-tenant roles and a signed context are alternatives,
not features accepted by this extraction.

## 4. Measured RLS evidence and its limits

The MEP-50 and MEP-103 reports in §1 measure synthetic record queries on embedded
PostgreSQL 18.4, including 200,000 records in the measured module. They do not
measure a production deployment or any of the non-record adapters in §6.

- MEP-50's typed model largely retained plans and timings under RLS; the older
  ADR 0002 §5 statement about no measurable cost is **not a universal guarantee**.
  Its own Measurement / Results with row-level security notes the single-read
  outlier. Document-expression filters and search lost index access in that run.
- MEP-103 expectation 6 **failed**: identical plans did not establish equal cost.
  ADR 0002 Measurement / Results for the index slots reports 18 of
  165 off/on pairs differing by one buffer, and nine of 55 scenarios more than
  10% slower in all three rounds. Two emitted index-order offset-5,000 forms
  were about 3 to 4 ms, ratios 1.3–1.7; the cause was not isolated.
- MEP-103 §7's five paired ratios are below 1.10, but three bypass-role access
  plans differ from the RLS-disabled runtime plans. Those three ratios do not
  isolate policy overhead. The two comparable ratios are 0.76 and 1.00.
- ADR 0002 Outcome narrows its **10% finding** to the measured emitted first-page
  list forms, keyset page, related list, count, single read and report where
  all three rounds support it. It leaves no ratio target for offset pages.
  This is a retrospective, workload-specific finding; it does not turn failed
  expectation 6 into a pass or promise 10% for new tables and statements.
- Catalog leakproof flags and observed index conditions explain why policy
  compatibility must be checked on actual emitted queries (ADR 0002 §5/§8;
  MEP-50 RLS results and MEP-103 sanitized value conditions). They do not prove
  every typed predicate is fast or every document query is slow. Do not alter
  built-in leakproof flags or bypass RLS to obtain an index (0002 Alternatives).

Accepting the isolation design requires no new benchmark in this issue. Future
adapters must prove isolation, atomicity and appropriate query plans; any latency,
throughput or size claim requires its own measurement. Storage selection remains
subject to ADR 0002 Outcome's unchanged deep-page rule and MEP-358/MEP-376.

## 5. Migrations, transactions and lock order

### Migration and test database rules

ADR 0001 §1/§2/§7 selects Drizzle ORM, drizzle-kit and `pg`, with generated SQL
committed under `packages/db/migrations`. Migrations are forward-only; never edit
an applied migration and never use `drizzle-kit push`. Preserve the ordered
numeric prefix and journal convention; propose descriptive lower snake case
suffixes for new migrations. Do not rename existing generated migrations.

“Reversible” means a reviewed compensating **forward** migration where possible,
not automatic down scripts. Destructive changes require an explicit data recovery
or restore plan; no claim that dropped data can be recreated. Naming and this
recovery clarification are proposals extending ADR 0001 §7, not rules found in
ADR 0002. Schema, policies and least-privilege grants ship together (0002 §5).

Follow ADR 0001 §6: disposable PostgreSQL cluster per test run; migrate its template
and clone per Vitest worker. Never use the dev database; isolate worktrees and
run role/catalog tests through real restricted roles, not the migration owner.
ADR 0010 Test strategy adds competing clients, rollback, crash and lease tests
for durable work; a fake adapter proves none of those database properties.
This document does not run migrations or start a database.

### Atomicity and ordering

Carry forward the storage-independent portion of ADR 0002 §6: one authorized
transaction commits a logical mutation and its required audit/outbox intent, or
rolls all of them back. ADR 0010 Lifecycle adds same-transaction enqueue and domain
intent; CSV checkpoint/mutation idempotency is still a contract to design, not a
property of existing process-memory services (ADR 0005 §3).

For transactions involving record modules, preserve ADR 0002 §6 ordering: module
rows in ID order, then record rows in ID order. Read metadata after the module
lock and hold its shared `FOR KEY SHARE` lock through the transaction; a metadata
publication needing an exclusive barrier uses `FOR UPDATE` on the same row.
This carries the coordination principle from §6/§8, not the slot assignment,
backfill or clearing algorithm. Persistent overlay publication must reconcile
this barrier with ADR 0011 §2 revision/CAS rules before it ships.

Non-record adapters must specify their own deterministic resource-lock order
and cross-domain order before implementation; this ADR does not invent one global
queue/folder/mailbox order. ADR 0010 Lifecycle requires short claim transactions,
SKIP LOCKED competition and fenced completion; never hold row locks or a domain
transaction across provider I/O. MEP-103 §5 measured only the record module lock
and backfill workload, not contention in Documents, CSV or mail; no overhead
claim transfers to them.

## 6. Non-record persistence that can be separated now

“Can proceed” below means a separately approved implementation after the listed
sections are accepted. It does not mean any table is created or any open domain
decision is settled by this Proposed document. Table families are conceptual
except where the owner ADR already gives names.

| Family and owner | Work independent of record-field layout | Boundary still deferred |
| --- | --- | --- |
| Queue, [ADR 0010](0010-job-queue-and-worker.md) Draft row shape / Lifecycle / Worker isolation | Jobs, leases, attempts, idempotency keys and delivery checkpoints; tenant envelope outside payload; queue-only claim policy | Exact grants, mailbox gates, retention and Q2–Q7 require their owner decisions; no record-field values in job payloads |
| Documents, [ADR 0008](0008-documents-storage.md) §1–§3 / CTO decision | `document_spaces`, `document_folders`, `content_blobs`, `document_files`, `document_versions`, memberships and item grants; private bytes use ADR 0005 store | My is a managed-attachment projection, not a new writable tree; record-backed attachment references await ADR 0002; pinned reference §4/U12 and unresolved write/retention rules stay gated |
| CSV, [ADR 0005](0005-notes-attachments-import-export.md) §3 / MEP-612 | Durable transfer-run identity, safe counters/error codes, upload/output references and execution/checkpoint envelope | Raw cells, snapshots or payloads containing record-field values cannot become a side-channel record store; atomic record mutation/checkpoint contract still needs ADR 0002 and a reviewed design |
| Mail, [ADR 0009](0009-real-email-and-calendar.md) Trust boundary / Topics 2–6 / Board decisions | Mailboxes, messages, threads, drafts, outbox, sync cursors and connector-secret boundary under owner/privacy rules | Record link FKs and native calendar `Events` field storage await ADR 0002; no generalized secret grant, live-provider approval or shared mailbox is implied |
| Customization overlay, [ADR 0011](0011-customization-metadata.md) §2 / implementation slice J | Organization/module overlay revisions, baseline versions and safe audit metadata; CAS transactions | Physical standard-field metadata/record-value tables, required-value checks/backfills, type conversion and record-write coordination still await ADR 0002; J cannot ship its complete adapter on this ADR alone |

The precise unblock table is intentionally narrower than “accept 0012 and ship”:

| Follow-up | Sections of this ADR whose acceptance releases foundation work | What can start; remaining gate |
| --- | --- | --- |
| MEP-612 | §2 keys, §3 roles/context, §5 migrations/atomicity, §6 CSV boundary (with §4 evidence limits acknowledged) | Design/implement durable transfer-run metadata and runner envelope against an agreed contract. Queue-backed execution also needs ADR 0010's remaining role decisions. Durable record import/export snapshots and atomic mutation/checkpoint recovery still wait for ADR 0002; existing synchronous budgets remain ADR 0005's accepted contract. |
| MEP-1181 | §2 keys, §3 roles/context, §5 migrations/locks, §6 Documents boundary (with §4 evidence limits acknowledged) | Design/implement ordinary Documents table persistence. Enable individual writes only after the corresponding ADR 0008 U1–U13/name, capability, move and retention decisions; keep My projection and record-attachment integration behind their own gates. Acceptance of this foundation alone does not enable all Documents writes. |

## 7. Explicit exclusions and extraction map

Anything storing **CRM record-field values**, including copies in snapshots,
search/index projections, history/audit payloads, import staging or automation
payloads, waits for ADR 0002. Renaming it a job or document does not evade that
boundary. Opaque record references still need the eventual record-key contract
before physical FKs are shipped. Documents' own names/versions and mail content
remain their dedicated domain data under ADRs 0008/0009, not generic CRM fields.

| Rule extracted or adapted here | ADR 0002 source | What stays there |
| --- | --- | --- |
| Tenant-leading keys and composite FKs (§2) | Decision §1 Keys; §5 Constraint checks | Physical record table, field formats and slot columns |
| Context, policies, three base roles and hygiene (§3) | Decision §5 | Stronger unforgeable-context mechanism remains a future decision |
| Generalized ownership guard; worker reconciliation (§3) | §5 Startup guard / worker paragraph; Alternatives FORCE RLS; Consequences | Extension to non-record tables is proposed here; queue policy/grants remain ADR 0010's responsibility |
| RLS measured limits (§4) | Measurement RLS results / exact slot results; Outcome expectation 6 and Decided now item 3 | All model/deep-page acceptance rules, including typed-table reopening |
| Migration-owner grants and test roles (§5) | Decision §5 roles/catalog tests; Alternatives typed-table executor | Tool, naming and forward-only policy come from ADR 0001, not an invented 0002 migration section |
| Atomicity and ordered record/module locks (§5) | Decision §6; §8 Slot lifecycle barrier | Record write algorithm, storage projections, slot lifecycle and layout-dependent validation |
| Audit/outbox intent coupling (§5) | Decision §6 step 6; §7 Events | Record event schema, payload values, version/history and purge redaction |

ADR 0002 §2 physical metadata tables, §3 field representations, §4 relations,
§8 compiler/index/storage decisions and §9 record delete lifecycle are not
accepted by this split. The preferences example in §10 is also not implemented
here. No change to request shapes, fixture durability claims or reference CRM
behaviour is authorized.

## 8. Open questions and CTO options

| Question | Options / recommendation | Required before |
| --- | --- | --- |
| Accept foundation separately? | Recommend accept §§2–5 for the bounded families in §6, retaining the §7 exclusions; alternatively wait for all of ADR 0002. Neither option waives its deep-page rule. | Releasing foundation migrations |
| Ownership guard before records exist? | Recommend inspect every accessed CRM table; a records-only guard leaves early non-record adapters unchecked. Confirm the explicit adaptation in §3. | First non-record runtime adapter |
| Worker policy and connector grants? | Keep cross-tenant access queue-only; decide minimal claim/column grants and connector role separately under ADR 0010 Q2, without BYPASSRLS. | Queue/mail persistence, not merely port/fake work |
| Lock coordination across domains? | Recommend adapter-specific ordered locks and explicit cross-domain composition; defer a universal lock hierarchy until concrete transactions are specified. | Each adapter's migration/concurrency review |
| How much CSV work is releasable? | Recommend metadata/envelope only now; complete durable record mutation and checkpoint atomicity after ADR 0002. Reject durable jobs over fixture maps. | MEP-612 scope split and recovery implementation |
| Documents write scope? | Recommend separate ordinary Team persistence from My/record attachment projection, then open only writes whose U decisions are accepted. | MEP-1181 implementation slicing |
| Can slice J ship independently? | Overlay-only storage can be designed now; recommend defer complete persistent publication until record coordination and field-value checks are settled. | ADR 0011 J delivery |
| Migration recovery convention? | Recommend compensating forward migrations with explicit restore plans for destructive data changes, and descriptive suffixes without renaming history. | First foundation migration review |
| Stronger tenant context? | Retain §3 trigger; choose per-tenant roles or signed context before untrusted deployments/SQL expressions, not as an implicit capability of the setting. | Either trigger is reached |

Review must verify these source boundaries and options. Acceptance requires no
claim that the non-record workloads have been benchmarked. Implementation reviews
must add real-role isolation/catalog, restart, rollback and concurrency evidence
appropriate to the adapter before claiming persistence is complete.
