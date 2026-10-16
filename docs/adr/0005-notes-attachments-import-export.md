# ADR 0005 — Notes, attachment storage and CSV import/export

- Status: §1–§3 Accepted (§1: 2026-10-14, MEP-534; §2: 2026-10-15, MEP-594; §3: 2026-10-15, MEP-604)
- Date: 2026-10-14
- Decider: CTO
- Issue: MEP-523
- Scope: Module 6 logical boundaries; §3 authorizes bounded transfer, no physical schema approval

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

### Decision (2026-10-15)

Accepted by the CTO for §2 (MEP-594):

- Choose option A: a server-only blob-store port, initially private local disk
  under a configured root. Attachment metadata is a parent-bound logical child
  module (`Attachments`) in the fixture record engine, like Notes. Physical
  tables await ADR 0002. Bytes and filesystem paths never enter `RecordData` or
  JSON responses.
- Support `file` (blob) and `link` (HTTP/HTTPS URL only, no blob). The server never
  fetches a linked page; its title is the URL.
- Interim configurable selection budgets use decimal MB: records allow 10 files
  and 100 MB combined (P1, OQ-01); notes allow five files and 20 MB combined (P3).
  Count streamed bytes; do not trust headers.
- Allow PDF, UTF-8 text/CSV, PNG/JPEG/GIF and DOCX/XLSX/PPTX. Validate extension,
  declared media type and actual signature together. Reject HTML, SVG,
  executables and macro-enabled files.
- Downloads require a session, organization context and ultimate-parent view
  permission. Use `Content-Disposition: attachment` with a safely encoded name
  and `X-Content-Type-Options: nosniff`. No public blob URLs.
- Deletion is permanent, without a recycle bin, as in §1; explicitly disclose
  this difference at the module gate. Cascade parent deletion to attachments;
  merge transfers attachments to the master without changing IDs (§1 C5).
- Cloud and built-in drives remain disconnected (AT-04, AT-11–AT-21); dialogs
  display only the disconnected state.

Other §2 proposals, including reconciliation schedules and retention durations,
remain unaccepted. This decision does not accept §3 or select physical tables.

## 3. CSV transfer through the record service

### Options

| Option | Benefits | Costs / evidence |
| --- | --- | --- |
| A. Synchronous request with a small hard row cap | Least infrastructure; easy with the current fixture. | Timeouts, disconnections and retries can duplicate successful rows; inadequate for documented tier limits. |
| B. Durable background job with streamed input/output | Bounded memory, progress, recovery and row-level results; handles documented volumes. | Requires persistent jobs and a worker earlier than ADR 0001 planned; cross-process fixture records cannot support it. |
| C. Browser-driven batches | Can prototype against the fixture without a worker. | Closing the tab stops execution; retry state and authorization become fragile. Not a durable completion guarantee. |

### Decision (Accepted, CTO, 2026-10-15)

Choose A for the first delivery: bounded synchronous, process-local transfer
behind `TransferService`. No durable queue, managed runner, restart recovery or
background-completion promise is provided. A persistent runner and atomic
mutation/checkpoint idempotency contract are explicitly deferred until ADR 0002
(MEP-40), under a separately reviewed follow-up. Do not run a worker over fixture
maps or describe process memory as durable storage.

Configurable initial budgets are decimal 25 MB per input file, 500 columns and
5,000 import data rows excluding the header. Export permits 30,000 rows, decimal
25 MB and at most 500 selected IDs. Exact boundaries pass; one over fails with
an explicit code and no silent truncation. Input budgets and malformed CSV fail
preflight before any write; an oversized export has a failed job and no file.
These are accepted local resource limits, not inferred subscription limits.

Only comma-separated CSV is supported, using UTF-8 (optional BOM) or ISO-8859-1.
Quoted commas/newlines and doubled quotes are supported. More than ten consecutive
empty rows terminate parsing. XLS/XLSX/VCF, ZIP and password protection are outside
the first delivery and must be reported as differences at the board gate.

Map metadata-defined writable fields by explicit API names. Reject duplicate
field mappings, system fields and missing mandatory create mappings/defaults.
Resolve owners and lookups by ID or unambiguous name within the current
organization only; never create fields or picklist options automatically. Reuse
`RecordService.create`/`update` validation, hooks, locks and unique checks for each
row. Invalid rows do not roll back earlier successful rows. Apply explicit
defaults and blank replacements; ignore empty cells on updates when requested.

Support Add, Update and Both. Match on `id`, metadata-unique fields or the module
default: Leads/Contacts `Email`, Accounts `Account_Name`, Deals `Deal_Name`.
Missing update targets and multiple targets are row errors. The first valid
input row for a matching key wins; later duplicates are skipped with
`duplicate_in_file`. Stored-record duplicate discovery, `deduplicate` and `merge`
are never implicit import operations. Leads Email remains non-unique; ambiguous
matches fail rather than choosing one target.

Uploads are scoped to organization and initiating user for 30 minutes, with five
pending uploads per organization (oldest evicted). Consumed uploads are removed.
History and export bodies live in organization-scoped process memory for seven
days, newest first, and are lost on restart. Cleanup occurs on access. Persist
only safe row numbers, field names/codes and aggregate counters in job results;
public result rows contain only skipped/error outcomes, never raw cell values.
Undo deletes only IDs created by that import through `RecordService`, rechecks
delete permission, skips already absent records and never reverses updates.
A completed undo cannot run twice. UI confirmation belongs to the HTTP/UI slice.

Import requires create permission for Add, update permission for Update and both
for Both. Undo requires delete permission; export requires read permission at
execution and download. History is available only to current organization
members. Separate profile export permission remains an explicit local difference.
The composition root supplies live action authorization and organization members;
projection is not an authorization boundary. Requested hidden fields fail with
`field_not_allowed`, including explicit exclusions. Download also rechecks field
visibility before releasing a retained file.

Export uses the requested saved view (the default All view when omitted) or
selected IDs, and paged service reads. Intersect fields with metadata visibility;
put `Record Id` first and use field labels as headers. Keep IDs as strings and
serialize CSV quoting correctly. Neutralize non-numeric formula-leading text
(`=`, `+`, `-`, `@`, tab or CR) with an apostrophe, including error reports when
provided. Filenames are `<Module>_<YYYY_MM_DD>.csv`. Concurrent writes under
offset pagination are explicitly accepted as best effort; no snapshot promise
is made. A stable snapshot/cursor remains future persistent-adapter work.

Notify Email (CSV-09, Module 10), Layout selection (CSV-11, Module 11) and Create
New Fields (CSV-20, Module 11) remain disabled with `laterModule`. Export criteria
construction is deferred; scope is selected through saved views. The CSV wizard
and histories were not observed in the reference session: these rules are
provisional product behavior approved by the CTO, not a claim of observed parity.

### Resolved and deferred questions

- Conflicting edition row limits: use the accepted local budgets above; exact
  instance tier/rollout and Notes CSV remain research follow-ups.
- Matching fields and empty semantics: resolved above. Dates/times use existing
  record-service representations; do not infer locale-specific formats.
- Runner and durable idempotency: deferred until ADR 0002; no automatic recovery.
- Snapshot: best effort accepted. Export permission: current read permission;
  separate export profiles await the permissions module.
- Retention: seven days in process memory accepted, including undo eligibility;
  durable audit retention is deferred with persistent storage.

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
must cover mapping and unique-field differences, malformed files versus row
errors, partial success, changed permissions, hidden fields, quoting/formulas
and explicit export limits. Crash/retry/cancel and metadata recovery checks await
the durable adapter. Tests run for an implementation are recorded on its issue.

CTO review must resolve or explicitly defer the numbered subject areas' open
questions and identify accepted local deviations. The accepted §3 authorizes only
the bounded first delivery described above; it does not change ADR 0002 or bypass
the module board gate. Proposed §2 remains
subject to its own acceptance.
