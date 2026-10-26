# ADR 0013 — Automation rule engine and record event hooks

- Status: Proposed
- Date: 2026-10-23
- Issue: MEP-1201; umbrella: MEP-1198
- Decision owner: CTO, after Sonnet QA review
- Scope: architecture only; no runtime code, migrations or execution enabled

## Context and evidence boundary

[Automation R1](../../research/specs/automation-rules.md) is the behavioural
input. Its O evidence establishes only the Assignment introductory screen;
Workflow content failed to render. Its D1–D3 documentation summaries establish
candidate concepts, not observed editor layouts, active edition capabilities or
successful writes. Metadata exports contain no usable automation definitions.
All engine mechanics below are proposed internal contracts for approval. They
are not claims about reference CRM internals or permission to fill UI gaps.
No reference session was opened for this ADR.

Inputs and their limits:

- [ADR 0011](0011-customization-metadata.md) defines effective metadata,
  revision coordination, dependency checks and field lifecycle. Its checked-in
  text remains Proposed; consuming implementation requires its accepted contract.
- [ADR 0010](0010-job-queue-and-worker.md) accepts queue direction A, with
  Q2–Q7 still open. Automation must explicitly revisit its scope before handlers
  ship; acceptance of a mail queue does not approve an automation executor.
- [ADR 0006](0006-record-field-history.md) supplies the generic commit boundary,
  event attribution, atomic history append and logical-operation deduplication.
  History is a permission-filtered display projection, not the execution queue.
- ADR 0002 is Proposed in MEP-40, absent from main. Its branch draft, especially
  Outcome / “Rule for the deep-page measurement”, is binding on the pending
  decision: compare S1/S2/S3 and typed-table B under the prescribed run, and
  revise the ADR when B meets the reopening condition. This ADR neither changes
  those thresholds nor selects slots, JSONB, typed tables or a query plan.
- ADR 0012 (MEP-1186) has no draft file or issue document available at this
  writing. Its issue defines the proposed layout-independent foundation:
  tenant-leading keys, RLS/runtime context, migrations and non-record tables.
  These are dependencies to reconcile, not accepted schema details.

No throughput, latency or fairness claim is made. The measurement result may
change only the automation evaluator's physical **field read path**; logical
rule identity, definitions, occurrence keys and execution semantics stay stable.
The surrounding record adapter may change under ADR 0002 without exposing its
layout to automation. An incompatible foundation decision requires ADR revision.

## Decision proposed

Use one core rule interpreter over logical record snapshots, one record-write
coordinator, and ADR 0010's durable queue for effects. Keep read-only UI behind
`AutomationPort` with a synthetic memory adapter until the relevant gates pass.
Do not build per-module hooks, a browser scheduler or a second record store.

### 1. Logical definition and read port

The following TypeScript is a proposed domain contract, not a new HTTP codec or
executable implementation. Reuse `OrgContext` from core tenancy and `Criteria`,
`FieldValue`, `ModuleApiName`, `RecordId` from the existing record contract.
Criteria is the existing recursive AND/OR tree with typed leaves; reuse its
validation rather than introduce a string expression language. Field references
use immutable local field IDs resolved to current API names by effective metadata.
The contract slice must explicitly translate those IDs to `Criteria.field` and
back; labels and physical storage keys never become rule references.

```ts
type RuleId = string;
type Revision = string;
type FieldId = string;
type ActionId = string;
type Instant = string; // Validated UTC ISO instant, never a local date.
type RecordRef = Readonly<{ module: ModuleApiName; id: RecordId }>;
type Condition =
  | Readonly<{ kind: "all_records" }>
  | Readonly<{ kind: "criteria"; criteria: Criteria }>;
type Trigger =
  | Readonly<{ kind: "record"; on: "create" | "edit" | "create_or_edit" | "delete" }>
  | Readonly<{ kind: "field_change"; fields: readonly FieldId[] }>
  | Readonly<{ kind: "date"; field: FieldId; timezone: string }>;
type ActionKind =
  | "notification" | "activity" | "field_update" | "webhook"
  | "function" | "record_create" | "conversion";
type Action = Readonly<{
  id: ActionId;
  kind: ActionKind;
  definitionRef: string; // Typed, versioned action repository; no executable text.
}>;
type Timing =
  | Readonly<{ kind: "event_relative"; offsetSeconds: number }>
  | Readonly<{ kind: "field_relative"; field: FieldId; offsetSeconds: number;
      timezone: string }>;
type Branch = Readonly<{
  id: string;
  position: number;
  condition: Condition;
  immediate: readonly Action[];
  scheduled: readonly Readonly<{ id: string; timing: Timing; actions: readonly Action[] }>[];
}>;
type RuleBase = Readonly<{
  id: RuleId;
  revision: Revision;
  module: ModuleApiName;
  name: string;
  description: string;
  enabled: boolean;
  position: number;
}>;
type WorkflowRule = RuleBase & Readonly<{
  kind: "workflow";
  trigger: Trigger;
  branches: readonly Branch[];
}>;
type RecipientSet =
  | Readonly<{ kind: "users" | "roles" | "groups"; refs: readonly string[] }>
  | Readonly<{ kind: "user_conditions"; definitionRef: string }>;
type AssignmentEntry = Readonly<{
  id: string;
  position: number;
  condition: Condition;
  recipients: RecipientSet;
  distribution: "single" | "round_robin";
  availability: "unresolved" | "ignore" | "require_available";
}>;
type AssignmentRule = RuleBase & Readonly<{
  kind: "assignment";
  entries: readonly AssignmentEntry[];
  fallback: RecipientSet | null;
}>;
type AutomationRule = WorkflowRule | AssignmentRule;
type ReadFailure = Readonly<{
  code: "forbidden" | "not_found" | "unavailable" | "invalid_query";
}>;
type ReadResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: ReadFailure }>;
type RuleSummary = Pick<AutomationRule,
  "id" | "revision" | "module" | "name" | "description" | "enabled" | "position" | "kind">;
type RulePage = Readonly<{
  items: readonly RuleSummary[];
  nextCursor: string | null;
}>;
interface AutomationPort {
  list(ctx: OrgContext, query: Readonly<{
    kind: AutomationRule["kind"];
    module?: ModuleApiName;
    cursor?: string;
    limit: number;
  }>): Promise<ReadResult<RulePage>>;
  get(ctx: OrgContext, query: Readonly<{
    kind: AutomationRule["kind"];
    id: RuleId;
  }>): Promise<ReadResult<AutomationRule>>;
}
interface AutomationFieldReader {
  read(ctx: OrgContext, record: RecordRef, fields: readonly FieldId[],
    expectedRecordVersion: string, schemaRevision: Revision
  ): Promise<ReadonlyMap<FieldId, FieldValue>>;
}
```

The port intentionally has no save, reorder, toggle, simulate, enqueue or execute
method. Caller identity and organization come from authenticated context, never
rule/query data. Start with admin-only automation reads, pending permission policy
Q6. Return indistinguishable not-found for foreign or missing identities; never
return unauthorized field names/criteria or recipient identities in summaries,
details, counts or errors. A rule whose detail cannot be safely projected is
withheld, rather than exposing hidden criteria. Cursors are scoped to tenant,
caller, kind, filter and snapshot revision; invalid or stale cursors fail safely.
Bound and validate limits, and sort by position then opaque ID.

The fixture adapter owns organization-scoped synthetic immutable snapshots and
returns defensive copies. Reads create no state. Empty is a successful empty
page, not an error; loading belongs to the calling UI's pending promise. Inject
unavailable/forbidden outcomes in tests without treating W1 as a product error
spec. Adapter instances do not share mutable maps; restart loses fixtures and
there is no persistence claim. No HTTP route or wire shape is selected here.
UI slices can consume this port without guessing a populated screen or wizard.

The types reserve documented concepts, not enabled capabilities. Delete comes
from R1 D1; field-change is required by this issue but its exact trigger semantics
are Q1. Unsupported action kinds, unavailable types, unresolved availability and
date policies must fail validation before activation, never be silently ignored.
At least one associated action is required per R1 D1; exact branch/editor
validation and limits stay Q1/Q2. `definitionRef` must resolve to an allowlisted,
typed action configuration in a later contract; it cannot contain scripts,
credentials or arbitrary URLs. Role/group membership resolves to current local
users; the port contains no copied account identifiers.

### 2. Record write and event boundary

Proposed transaction order for every supported write channel:

1. Authenticate and authorize; resolve effective schema and one active rule-set
   revision. Enter the shared record coordinator, obtain the current record
   version/before image, and validate the candidate mutation. No-op edits emit
   no field-change trigger. Seeds and ordinary reads emit no automation events.
2. For explicitly selected assignment rules on supported ingress (import,
   webform or API, per R1 D2/D3), evaluate entries against the validated candidate.
   Reserve the chosen owner and round-robin cursor in this same transaction.
   Manual creation does not run assignment implicitly. The explicit API selection
   mechanism and interaction with supplied owner are Q3.
3. Validate the resulting owner and candidate again. Evaluate workflow conditions
   synchronously against the before/final-after snapshot and schema revision.
   Persist matched branch/action intents and event identity; do not execute any
   action or provider call here. A field reader for a staged candidate overlays
   candidate changes over the version-checked persisted before image; it must
   never read an uncommitted “after” through another connection.
4. Commit record/version, ADR 0006 history, automation event/intents, assignment
   cursor changes and queue enqueue atomically. Any validation, history, cursor
   or enqueue failure rolls everything back. Failed writes leave no executable
   work. Serialize metadata/rule publication with evaluation or abort and retry
   before commit; never combine revisions in one decision.
5. After commit, allowlisted worker handlers claim action jobs under ADR 0010.
   “Immediate” means due after commit, not a synchronous success guarantee in the
   record HTTP response. Each record-changing action calls the same authorized
   record service, validates current metadata, and emits its own attributed event.
   A later action failure does not undo the original record commit.

Do not subscribe to the displayed History endpoint: it redacts, suppresses and
pages data for users. Share its logical operation/correlation identity with the
internal event envelope, but keep execution intents separately durable. No full
record snapshots in jobs/logs; evaluation inputs are transaction-local. Deletion
uses the authorized before image and only actions explicitly approved for deleted
records; otherwise reject activation of that combination. Restore, merge, clone,
conversion and mass-action trigger semantics remain Q1 until specified.

Field updates are queued like other workflow effects. Same-transaction assignment
is the only owner derivation proposed here. If parity needs synchronous workflow
field updates or workflow ordering to see assignment differently, Q1 must be
resolved and this boundary revised before enabling execution.

### 3. Execution identity, loops and scheduling

- Retain immutable rule/action revisions for matched intents. Unique intent key:
  tenant + event ID + rule revision + branch ID + action ID + occurrence key.
  Queue retry reuses that key and the same fingerprint. A fresh intentional write
  is a fresh operation; do not deduplicate by values. As ADR 0006 states, event
  deduplication does not create cross-request write idempotency.
- Carry trusted root operation, parent event, depth and visited rule/record pairs
  through all action-induced writes, including jobs. Proposed conservative guard:
  suppress a repeated rule/record pair within one causal chain, cap depth at 8
  and total generated intents at 100 per root. Persist counters/unique visits and
  serialize updates so parallel workers cannot exceed the budget. Record a safe
  terminal reason; do not silently loop. These are local safety proposals (Q4),
  not observed reference limits or a permit for intentionally recursive rules.
- Each database action applies its domain mutation and completion marker in one
  transaction under a valid queue lease fence. Retry sees the completion marker
  and does not repeat it. Recheck tenant, current execution principal, module,
  field/record permissions, rule enabled state and supported configuration before
  each effect. Historical schema or job possession grants no authority.
- External actions remain at least once with ADR 0010's uncertain-delivery hold;
  no blind retry after possible remote acceptance and no exactly-once promise.
  Notifications use the approved mail outbox, not an automation-specific sender.
  Webhooks/functions need separately approved connectors, egress and secret
  contracts before capability enablement; no arbitrary code evaluator is proposed.
- Scheduled occurrence rows hold a UTC due instant, pinned rule/action revision,
  target version, schedule generation and deterministic occurrence key. Queue
  payloads contain opaque intent references only. A durable scheduler scans
  eligible date-trigger candidates through the logical field/query adapter and
  materializes occurrences idempotently; web timers are never authoritative.
- Candidate edits affecting criteria/date, rule edits/disable and target deletion
  invalidate pending generations atomically with their mutation. Workers compare
  generation and re-evaluate current eligibility before applying an effect.
  Cancellation and execution serialize on the occurrence row: cancellation
  committed first prevents execution; an already committed effect is not undone.
  External in-flight acceptance cannot be recalled by a later edit.
- Recurrence, timezone ownership, daylight-saving gaps/folds, date-only time of
  day, offsets, missing dates, past-due activation and missed-occurrence policy
  are Q5. Date execution stays disabled until resolved. Proposed one-shot overdue
  occurrences resume after downtime only if still valid; no inferred recurrence.

### 4. Ordered assignment and concurrent round robin

Sort entries by explicit position then stable ID. First matching entry wins
(R1 D2/D3); no later entry assigns again. Resolve and authorize its recipient
pool from current membership. Proposed stable user-ID order plus a membership
revision makes the selection deterministic; this order is not observed parity.
If no entry matches, use the configured fallback. No fallback means an explicit
unassigned outcome, subject to the record's owner constraint, pending Q3; never
silently choose the acting user.

For multiple eligible recipients, persist a cursor per tenant/rule revision/entry
and pool generation. Lock/CAS it in the record transaction, select the next member,
advance once and commit with owner/history/event. Concurrent imports/API writes
serialize on that cursor; a rolled-back row consumes no turn. A logical retry
returns its committed assignment receipt rather than advancing again. Process
memory or a queue's claim order cannot establish cross-process round robin.

Lock acquisition follows one reviewed order across record, rule-set revision,
cursor, occurrence and queue resources; batch paths sort same-kind identities
and retry bounded deadlock/serialization failures with the same operation key.
The exact order must reconcile with ADR 0012 and the record engine before SQL.
Do not introduce an opposing order in the scheduler. Membership changes publish
a new pool generation; retain receipts of previous decisions. Empty/unavailable
pools, group/role expansion, membership resets, supplied owner, cross-rule priority
and fallback permissions are Q3; availability is not inferred from a browser tab.

### 5. Persistence foundation and storage independence

Logical tables below are proposals, not DDL or accepted names. Every table is
tenant-scoped with tenant-leading uniqueness/references, bounded payloads and
runtime role policies. No organization authority comes from JSON. ADR 0012 must
settle migration/role/context/lock rules; ADR 0002 settles record references and
field reading. Do not invent a generic values table for automation.

| Logical table family | Responsibility | Required gates |
| --- | --- | --- |
| Rule sets, immutable rule revisions, branches/actions and dependency index | Ordered active configuration, typed definitions, schema/field references | ADR 0013 acceptance + ADR 0011 contract + ADR 0012 foundation; editing additionally requires approved behaviour |
| Assignment cursors, pool generations and assignment receipts | Atomic owner choice and retry evidence | ADR 0012 + ADR 0002 write transaction; Q3 |
| Event envelopes, matched intents and action completions | Commit-to-worker handoff and dedup | ADR 0012 + ADR 0002 + ADR 0006 coordinator |
| Schedule occurrences/generations and causal-chain counters/visits | Cancellation races, due work and loop bounds | ADR 0012 + ADR 0002; Q4/Q5 |
| Queue jobs and mail outbox | Claims, retry, fencing and external delivery | ADR 0010 reconciliation + ADR 0012; connector gates |

Definition-only non-record tables can be designed independently of the measured
record layout, but this issue authorizes no migration. Runtime automation and
all automation write flows remain **closed until both ADR 0002 and ADR 0012 are
accepted**, plus the relevant contracts/questions here. ADR 0012 acceptance alone
does not enable record snapshots, assignments or scheduled effects. Values held
in predicates/action configuration are typed literals, not a shadow record store;
access control and erasure cover them too. Queue retention cannot expire dedup
keys before the retry/reconciliation horizon. Final retention and privacy purge
of revisions/intents/receipts are Q6, aligned with ADR 0010 Q4 and ADR 0006.

Register field dependencies with ADR 0011 for triggers, predicates, schedules and
field-update actions. Retiring/changing a referenced field must be rejected or
explicitly disable affected rules and cancel pending intents atomically under
an approved policy; never drop a predicate and broaden matching. Only the
`AutomationFieldReader` and its scheduler query implementation know how to read
physical field values. Persist no slot numbers, document paths or typed-column
names in rules. Both eventual record adapters must pass the same condition suite.

## Alternatives and consequences

| Alternative | Assessment |
| --- | --- |
| Execute all effects in the record transaction | Provider I/O extends locks; retries can repeat effects; incompatible with durable delayed work |
| Evaluate only from a queued current-record read | Loses transient changes and the committed before/after decision unless a separate snapshot contract is added |
| Per-module hooks and process-local round robin/timers | Divergent validation, missed ingress channels and restart/concurrency failures |
| Full workflow language/library immediately | R1 does not establish its semantics; revisit ADR 0010 scope with measured load and bounded requirements first |

The chosen boundary adds transaction work and durable state, with no benchmarked
cost claim. Eventual immediate effects require a visible failure/status design
before release; R1 supplies no such screen. Fixtures unblock bounded reads, not
full Workflow parity, a fabricated editor or production automation.

## Proposed implementation slices

These are dependency descriptions, not created tasks or authorization to enable
writes. Sequence shared files under one engineer; CTO accepts contracts first.

| Slice | Owner area | Dependencies and required verification |
| --- | --- | --- |
| A. AutomationPort + memory fixture adapter | Platform/core | Accept §1; unit/contract tests for tenant/permission isolation, immutable copies, ordering, paging, empty/failure states and zero writes |
| B. Assignment introductory screen | UI | A + R1/UI approval; only observed A1–A6 and approved local destinations; component + targeted e2e, no invented wizard |
| C. Workflow and detail research/read projections | CRM Analyst then UI | R1 U1–U5 resolved or explicit approved functional interpretation; A; do not render W1 as normal empty |
| D. Typed definitions, validator and dependency registry | Platform/core | Accepted ADR 0011; Q1/Q2/Q6; invalid field/type/action and stale-revision contract tests; no activation |
| E. Persistent definitions/engine coordinator | Platform/db | D + accepted ADR 0002/0012; actual runtime-role RLS, rollback, schema/rule publication races and record/history/enqueue atomicity |
| F. Assignment execution | Platform/core | E + Q3; competing clients, ingress gating, first match, pool change, rollback and retry cursor tests |
| G. Immediate action worker | Platform/worker | E + ADR 0010 scope reconciliation + Q4/Q6 + per-action approval; fenced replay, causal loops, permission revocation and uncertain external effects |
| H. Scheduler and cancellation | Platform/worker | G + Q5; fake-time/DST, downtime, two schedulers, edit/disable/delete versus claim and cancellation races |
| I. Rule editors/activation and execution status UI | UI + Platform contract | C/D + E–H for enabled capabilities + explicit validation/error/status design; targeted e2e across affected record screens |

No code or tests are introduced by this ADR-only change. Verification is current
`origin/main` merged, relative links resolved, `git diff --check`, scope review
and terminology/privacy hook. Biome, typecheck, unit and e2e runs are unnecessary
for Markdown only; future slices require the targeted checks and CI for their
actual head commit. A fake cannot prove durable transactions, row locks or RLS.

## Open questions for CTO disposition

| ID | Decision needed before enablement | Input/owner |
| --- | --- | --- |
| Q1 | Exact edit/field-change/repeat trigger semantics, delete and special operations, cross-rule order, branch fallthrough, assignment/workflow ordering and synchronous versus queued field effects? | R1 D1/U2/U4; CRM Analyst evidence then CTO boundary decision |
| Q2 | Supported action configuration schemas, edition/module capabilities, criteria operators, limits and validation? | R1 U4/U7; Platform contract + UI Lead screen approval |
| Q3 | Rule selection by ingress, supplied owner policy, membership/availability ordering and reset, empty pools and fallback? | R1 D2/D3/U3/U7; Platform Lead recommends, CTO decides |
| Q4 | Accept proposed depth 8 / 100-intent cap and repeated-pair suppression; how should skipped/failed work be surfaced? | Internal safety proposal; CTO; UI Lead owns later status design |
| Q5 | Date/DST/recurrence/missed-occurrence policies and cancellation semantics? | R1 D1 lacks exact policy; CTO after research |
| Q6 | Admin read/configuration and execution principal permissions, revocation, retention/erasure, external-action safeguards? | Platform Lead; align ADR 0006/0010/0012 and board policy where required |
| Q7 | Reconcile absent ADR 0012 and measured ADR 0002, approve actual transaction/lock/record-reference design and revisit ADR 0010 scope? | CTO; persistence and engine release remain gated |

Acceptance must explicitly resolve or defer each question and name the permitted
slices. Accepting this Proposed draft must not imply accepted record storage,
reference write permission or approval for unseen UI behaviour.
