# ADR 0005 — Notes, attachment storage and CSV import/export

- Status: §1 Accepted (2026-10-14, MEP-534); §2–§3 Proposed
- Date: 2026-10-14
- Decider: CTO
- Issue: MEP-523
- Scope: Module 6 preparation; no implementation or schema approval

## Context and boundaries

Module 6 needs durable notes, file attachments and CSV transfer without a second
record-write path. ADR 0001 requires explicit organization context, tenant
isolation and metadata-driven validation. ADR 0003 governs shared UI foundations;
ADR 0004 keeps route handlers thin and the browser contract separate from domain
services. The board's lighter parity rule applies from Module 2 onward; any
unverified limit or behavior below is a proposal, not observed reference parity.

ADR 0002 (MEP-40) remains pending. This ADR proposes logical responsibilities,
relationships and lifecycle rules, not the physical record schema, indexes, RLS
implementation or database job-queue library. A dedicated logical child record
can later use either shared record storage or a dedicated table. Neither choice
is committed here. No reference CRM mutation, import, export or upload was run.

## Evidence register

Metadata references below are relative to the local research metadata root.
Only field structure was inspected; no customer values or identifiers are copied.
Public documents were checked on 2026-10-14. To comply with the repository's
naming ban, public source addresses retain their exact path but omit the
branding-bearing hostname. `Help` means the reference CRM public help origin;
`Developer` means its public developer-documentation origin. These are source
locators, not application URLs; no replacement hostname is invented.

| Key | Source | Evidence and limit of inference |
| --- | --- | --- |
| M1 | `modules/Notes/fields.json` | `Note_Title`: text, 120; `Note_Content`: textarea, 65,535; mandatory `Parent_Id`: lookup, 120, with target `se_module`; `Associated_Id__s`: bigint, 30. Owner, creator/modifier and times also exist. Metadata does not resolve the associated-ID semantics. |
| M2 | `modules/Attachments/fields.json` | Mandatory `File_Name`: text, 100; `Size`: bigint, 100; mandatory `Parent_Id`: lookup, 120. Owner, creator/modifier and times also exist. No exported MIME allowlist or storage key. |
| M3 | `modules/{Leads,Contacts,Accounts,Deals,Tasks}/related_lists.json`; `modules/Tasks/fields.json` | Notes and Attachments are related lists on these parents. Tasks has `Who_Id` and polymorphic `What_Id` targeting `se_module`; notes have one parent, not both activity relationships. |
| C1 | `packages/core/src/records/contract.ts`, `README.md` | Factory binds authorized `OrgContext`; CRUD, metadata, pagination/projection and duplicate discovery/merge already exist. No attachment streaming, import-job API, permission capability API or cross-call transaction contract exists. |
| C2 | `packages/core/src/records/fixture/hooks.ts`, `registry.ts`, `index.ts` (MEP-497) | Module bundles expose synchronous `applyRules`, `afterWrite`, `afterDelete`, `afterSeed`, `readRecord`, `orderRows` and `mergeRelatedRecords`. These are internal fixture hooks, not public service or database transaction hooks. |
| C3 | `packages/core/src/records/fixture/activity-hooks.ts`; `activity-delete-contract.test.ts` (MEP-518) | Successful parent deletion removes linked activities after all target checks. Locked/completed children also disappear. Merge deliberately does not dispatch parent delete hooks. Recycle-bin restoration is absent. |
| C5 | `research/specs/duplicates.md` | Documented merge transfers notes and attachments to the master. Current fixture merge-related deletion is not that transfer contract. |
| C4 | `packages/db/src/schema/index.ts`; ADR 0001/0003/0004 | DB currently exports auth and tenancy schemas, not a persistent CRM record adapter or durable jobs. ADR 0001 defers the worker/queue to a later phase. |
| P1 | reference CRM documents — Help: `/portal/en/kb/crm/manage-crm-data/attachments-and-notes/articles/manage-notes-and-attachments` | Record attachment selection: at most 10 files and 100 MB combined per upload, without a per-record file-count limit. Profile permissions restrict notes/attachments; deleted attachments enter a recycle bin. |
| P2 | reference CRM documents — Help: `/portal/en/kb/crm/manage-crm-data/attachments-and-notes/articles/attachment-from-desktop` | Another desktop-upload guide specifies five files and 20 MB combined. It conflicts with P1; neither establishes the active instance's rollout. |
| P3 | reference CRM documents — Help: `/portal/en/kb/crm/manage-crm-data/attachments-and-notes/articles/organizing-notes` | Note title is optional; content limit is 65,535 including rich-text HTML. Notes may contain five attachments totaling 20 MB. Note-import file limit is separately 50 MB. |
| P4 | reference CRM documents — Help: `/portal/en/kb/crm/data-administration/import-data/articles/import-data-into-a-crm-module` | Import guide: 25 MB/file, 500 columns; row limits by tier: Free 1,000, Standard 20,000, Professional 50,000, Enterprise 100,000, Ultimate 200,000. Create, update and combined modes use matching fields. |
| P5 | reference CRM documents — Help: `/portal/en/kb/crm/data-administration/import-data/articles/import-data` | Other guide: CSV 5/10/25 MB by tier and Standard/Professional/Enterprise/Ultimate row limits 10,000/20,000/30,000/50,000. The two guides disagree. |
| P6 | reference CRM documents — Developer: `/crm/developer/docs/api/v8/upload-attachment.html` | Public API accepts multipart file or link, one per call, under a parent-scoped Attachments resource; Notes is also supported. Public API documentation does not prove browser requests. |

## 1. Notes as parent-bound logical child records

### Options

| Option | Benefits | Costs / evidence |
| --- | --- | --- |
| A. Register Notes as a record-service module, with one typed parent reference | Reuses validation, audit fields, organization context and module bundles; matches M1/M3. Adapter can change under ADR 0002. | Needs parent authorization and a related-list contract; existing port alone does not enforce every parent-dependent rule. |
| B. Separate note repository/service and dedicated note table | Straightforward specialized indexes and rich-text handling. | Parallel CRUD/validation path unless it delegates to the record service; prematurely chooses physical storage if the table is approved now. |
| C. Embed a notes array in each parent record | Convenient single-parent fetch. | Independent note IDs, owners, updates, pagination and concurrent edits become difficult; weak fit for M1 and P3. |

### Recommendation (Proposed)

Choose A at the logical boundary. Notes have their own ID and fields, plus one
`{ module, id }` parent reference. Wire codecs map `Parent_Id` and `$se_module`
to that reference; `$se_module` is a proposed transport discriminator, not an
exported Notes field. Validate targets against registered, supported parent
metadata, not an arbitrary module string. Do not duplicate the activity What/Who
pair or overload `Associated_Id__s` before its meaning is researched.

Create/update/delete require the appropriate child action and access to the
parent in the same organization; reading a note requires parent visibility.
Never trust a parent lookup that only succeeds globally. A Notes owner cannot
make an inaccessible parent visible. Title is optional; enforce M1 lengths and
server-managed audit fields. Store validated rich-text content in a representation
chosen by the Notes screen spec; sanitize HTML on entry and safe rendering, and
include markup in the content-length budget (P3). Sanitizer policy remains open.

Use the MEP-497 module bundle's `applyRules` for synchronous fixture parent
validation and `afterDelete` composition for child removal. Compose with existing
activity hooks; do not replace them. Keep asynchronous file I/O outside these
hooks. A future persistent adapter must preserve the public behavior with its
own transaction and durable cleanup implementation, not depend on fixture maps.
No new transaction method is assumed on `RecordService`.

Follow MEP-518: validate the entire parent batch before any removal; on success
remove directly bound notes and their attachment metadata, including locked
children. No detach-to-null behavior: M1 makes the parent mandatory. Logical
parent/child removal must be atomic in the persistent adapter; blob deletion can
follow asynchronously after commit. Fixtures model the logical cascade only.
This permanent-removal proposal differs from the documented recycle bin and
requires explicit acceptance or a separately scoped restore design.

For merge, propose moving notes and attachments from duplicate parents to the
master without changing child IDs or deleting blobs, following C5. Keep this
separate from parent deletion. The current `mergeRelatedRecords` deletion list
is not suitable for transfer; a future module-local transfer contract is needed.

### Open questions

- Which additional parents, including Events/Calls, are confirmed by Module 6 research?
- Does `Associated_Id__s` represent a secondary relationship or an internal identifier?
- How should merge resolve transfer authorization, locked children and duplicate
  links? Existing merge skips `afterDelete`; test transfer without deletion hooks.
- What happens on conversion and reparenting? Do not infer either from deletion.
- Which formatting/sanitizer rules and child permissions apply? Current role
  placeholders cannot claim full profile parity.

## 2. Attachment metadata separate from file content

### Options

| Option | Benefits | Costs / evidence |
| --- | --- | --- |
| A. Private local disk behind a blob-store port | No paid service; works with local start (ADR 0001). Supports streaming and a later adapter change. | DB/filesystem cannot commit atomically; backup and cleanup need explicit handling. |
| B. Object storage from day one behind the same port | Durable shared storage across processes/hosts; supports deployment growth. | Adds infrastructure and credentials; hosted spend requires board approval. |
| C. Binary contents inside PostgreSQL | Single database backup and transaction boundary. | Large rows, database growth and expensive bulk transfer; mixes record queries with blob workload. |

### Recommendation (Proposed)

Choose A initially, with a small server-only blob-store abstraction supporting
streamed write/read, delete and reconciliation. B remains an alternative adapter,
without a paid dependency or object-storage deployment decision now. Never put
bytes or a filesystem path into ordinary `RecordData` or JSON responses.

Maintain an organization-scoped logical metadata entry: attachment ID, parent
module/ID, original display filename, actual byte size, detected media type,
opaque storage key, checksum, creator/modifier/times and lifecycle state. Preserve
M2 API field names at the wire boundary. Storage key and lifecycle fields are
internal proposals, not exported reference fields; their physical table awaits
ADR 0002. Parent may be a note; resolve the ultimate parent for access and cascade.

Propose separate configurable budgets: record upload selection 10 files/100 MB
combined (P1), note upload selection five files/20 MB combined (P3). A single
record file cannot exceed that record selection budget. P2 remains a conflict,
not grounds to call 20 MB a universal per-file limit. Byte units are unresolved;
propose decimal MB and test exact byte boundaries once accepted. Count bytes while
streaming, including aggregate budget across one selection; do not trust headers.
Multipart transport may send one file per call (P6); enforce aggregate selection
limits through a server-owned upload batch, not client-only counters.

Proposed initial allowlist: PDF, UTF-8 text/CSV, PNG/JPEG/GIF and DOCX/XLSX/PPTX.
Validate extension, claimed media type and actual format together, with bounded
inspection of ZIP-based office containers; reject malformed formats, macros,
executables and active HTML/SVG. This is a local security/product proposal,
not reference evidence. Broader office/archive types need a research-backed
policy before implementation. Downloads use attachment disposition, a safely
encoded filename and `nosniff`; no inline execution or public blob URLs.

At download time, authenticate and bind organization context, load scoped
metadata, then check current ultimate-parent visibility (and attachment View
permission when available). Parent viewers may download; the filename/key alone
never grants access. Upload/delete require their corresponding action, parent
access and the agreed parent lock rule. Keep future granular authorization behind
services; do not assign every member unrestricted rights or assume `get` is a
complete future permission API.

Derive keys solely from server-generated opaque tenant and attachment components.
User filenames are display data only: never concatenate them into a path. Reject
invalid key components, separators and traversal encodings; confine resolved paths
to a private configured storage root and prevent symlink escape. Disk contents
stay outside static/public directories. Object-store keys use the same tenant
namespace. Every operation and reconciliation is tenant-scoped; no cross-tenant
content deduplication is proposed.

Use a recoverable lifecycle: reserve scoped pending metadata, stream into private
staging, verify limits/type/hash and recheck parent access/existence, atomically
publish the blob, then mark metadata ready. Only ready entries are readable. On
failure, retain enough pending state to clean up; a deleted parent cannot acquire
a late ready attachment. Persistent publication/cascade needs serialization or
conditional commit in the future adapter; it is not solved by two port calls.

Delete metadata visibility and persist a cleanup intent in the same database
transaction as logical deletion. Physical removal is idempotent and retried;
missing blobs count as success. Proposed reconciliation every day: purge abandoned
pending uploads older than 24 hours, retry deletion intents, and quarantine
unreferenced blobs for 24 hours before removal. Never remove a ready referenced
blob, an active upload or a different tenant's objects. Back up metadata and
blobs as a coordinated set. Retention durations and the managed scheduler are
proposals, not an existing fixture guarantee.

### Open questions

- Does the active reference instance use P1 or P2? Confirm via read-only evidence.
- Which file types are needed, and is malware scanning required before real use?
- Accept permanent deletion aligned with MEP-518, or add recycle-bin retention?
- Which parent-lock checks apply to adding/deleting children? Child lock bypass
  during parent cascade follows MEP-518 but direct child mutations need a contract.
- Who owns backup, storage quotas and the managed reconciliation runtime?

## 3. CSV transfer through the record service

### Options

| Option | Benefits | Costs / evidence |
| --- | --- | --- |
| A. Synchronous request with a small hard row cap | Least infrastructure; easy with the current fixture. | Timeouts, disconnections and retries can duplicate successful rows; inadequate for documented tier limits. |
| B. Durable background job with streamed input/output | Bounded memory, progress, recovery and row-level results; handles documented volumes. | Requires persistent jobs and a worker earlier than ADR 0001 planned; cross-process fixture records cannot support it. |
| C. Browser-driven batches | Can prototype against the fixture without a worker. | Closing the tab stops execution; retry state and authorization become fragile. Not a durable completion guarantee. |

### Recommendation (Proposed)

Choose B for usable Module 6 imports/large exports, with a bounded synchronous
parse/mapping preview. Bring forward only a managed transfer runner; amend ADR
0001's worker timing if accepted. Queue persistence/library, locking and record
storage remain ADR 0002/implementation decisions. Do not launch a separate worker
against process-local fixture data or report fixture state as durable jobs.

Propose a configurable initial CSV budget of 25 MB, 30,000 data rows excluding
header, and 500 columns; reject exceeded budgets before writes. The row cap is a
conservative Enterprise value from P5, not a statement about the instance's
subscription. P4 allows larger limits and P3 allows 50 MB for note imports;
confirm the instance's behavior before selecting final module-specific limits.
Use streaming UTF-8 parsing (optional BOM), quoted separators/newlines and explicit
format settings; cap cell lengths from metadata and bound preview/error memory.
Other spreadsheet/vCard formats and binary attachment import remain out of scope.
Malformed CSV fails preflight; a valid file with invalid record values can have
partial success. UI must distinguish these cases.

Persist the initiating user, organization, module, immutable source checksum,
explicit mapping, import mode, match fields, format/blank-value settings and
metadata revision/fingerprint. Statuses are proposed as queued, running,
completed, completed-with-errors, failed and cancelled. A runner obtains current
membership/authorization, never a stored browser cookie; recheck rights before
writes and on report download. If metadata changes incompatibly, pause/fail for
remapping instead of silently applying new validation. Cancellation stops future
rows; it does not undo successful writes.

Map headers explicitly to writable API field names from `getModule`; reject
ambiguous/duplicate mappings and missing required create fields. Do not map
system-managed fields. Resolve owners and lookups only within the organization;
ambiguous names fail that row rather than choosing an arbitrary match. Reuse the
service's field types, picklists, lengths and empty-value semantics. Preview makes
the difference between an unmapped field, an empty cell and “skip empty updates”
explicit; do not auto-create fields or picklist options during import.

Support add-only, update-only and combined modes only after their matching
contract is agreed. Invoke `create`/`update` for each eligible row, preserving
validation, hooks, locks and unique-field checks; no direct record-table writes.
Reuse Module 1 duplicate comparison rules from `research/specs/duplicates.md`
and the adapter's matching implementation. Existing `findDuplicateGroups` operates
on stored records; it is not an import upsert or incoming-row matcher. Factor or
extend matching behind the service if needed, without requiring a new physical
schema here. Leads Email is not automatically unique; Contacts Email is unique
case-insensitively in the current fixture. Never use `deduplicate`/`merge` as an
implicit import step. Missing update targets and multiple matches produce row
errors; repeated input matches follow a documented deterministic policy, proposed
as first valid row wins and later duplicate rows are skipped with a reason.

Commit each successful row independently; invalid rows do not roll back earlier
successes. Keep source row number, outcome (created/updated/skipped/error), safe
field/error codes and authorized resulting record ID. Reports include counts and
failed-row CSV for correction, with values available only to authorized users;
logs contain counters/codes, not raw input. Proposed temporary source/report
retention is seven days, then idempotent cleanup, with minimal audit counters
retained under an agreed policy.

Job admission has an idempotency key; each row needs a durable execution key.
The current `RecordService` has neither idempotency nor an atomic mutation-plus-
checkpoint contract. A persistent implementation must atomically record success
with the write, or provide an equivalent idempotent service operation. Without
that, a crash after create and before checkpoint can duplicate records: do not
promise exactly-once retries. The contract extension needs CTO review and does
not select ADR 0002 storage. The fixture may support explicit demos only.

For export, check the export action, row visibility and field visibility at
execution and download, not just job creation. `ListQuery.fields` is projection,
not an authorization boundary. Intersect the explicit requested fields with
allowed fields and fail disallowed requests without revealing hidden data.
Stream paged service reads for the agreed view/filter/selection; retain IDs as
text and escape CSV quotes/separators/newlines. Proposed spreadsheet-safe output
neutralizes formula-leading `=`, `+`, `-`, `@` and control characters in text cells;
record this encoding so reimport is deliberate, rather than silently changing
stored values. Apply it to error reports too. Keep blobs/reports private.

The current list port provides no snapshot or cursor guarantee. A long export
can drift under writes with offset pagination. Require a stable snapshot/cursor
contract or an explicitly accepted best-effort policy before claiming complete,
consistent exports. Proposed initial export cap is 30,000 rows/25 MB, with an
explicit limit error instead of silent truncation; this is a local resource
budget, not a researched reference export limit.

### Open questions

- Which tier/rollout resolves P4 versus P5, and are Notes CSV imports a distinct flow?
- Which matching fields and blank-cell/date/time encodings does each module expose?
- Approve the earlier managed runner and durable idempotency contract, or explicitly
  limit the first delivery to synchronous demonstrators with no recovery promise?
- What is the export snapshot policy, reference export limit and permission model?
- Accept spreadsheet-safe encoding and seven-day report retention, and define audit retention?

## Consequences and acceptance work after approval

The recommendation keeps record behavior behind the existing port while separating
blob transport and transfer orchestration. It adds lifecycle state, reconciliation
and durable job responsibilities; none exists merely because a fixture hook does.
Implementation cannot promise durable background work until a compatible persistent
adapter exists. Physical storage and RLS remain open under ADR 0002.

Future implementation acceptance must cover tenant isolation, inaccessible/deleted
parents, composed activity/note/attachment cascade, rejected parent batches,
merge/conversion distinctions, rich-text safety, malicious paths/symlinks, type and
exact-size boundaries, publication/delete races and failed cleanup. CSV checks
must cover mapping and unique-field differences, malformed files versus row errors,
partial success, crash/retry/cancel, changed permissions/metadata, hidden fields,
CSV quoting/formulas and export drift. These are required future tests, not tests
claimed as run for this documentation-only issue.

CTO review must resolve or explicitly defer the numbered subject areas' open
questions and identify accepted local deviations. This Proposed ADR does not
approve Module 6 implementation, change ADR 0002, or bypass the module board gate.
