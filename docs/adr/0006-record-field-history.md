# ADR 0006 — Record field history and the Timeline event stream

- Status: Proposed
- Date: 2026-10-15
- Decider: CTO
- Issue: MEP-692
- Dependencies: ADR 0002 (MEP-40) for physical storage; ADR 0004 for transport;
  ADR 0005 for Notes and Attachments lifecycle

## Context and evidence

History currently receives empty module event arrays under the MEP-275 interim
rule. Record create and inline edit do not produce History rows. We need one
generic source for all modules, including Notes and Attachments, without making
the Timeline presentation component responsible for recording mutations.

This is an ADR draft only. It introduces no port, endpoint, migration or UI code,
does not authorize implementation, and does not change another accepted ADR.
No capture tool or reference CRM access was used for this draft.

| Evidence | What it establishes / limits |
| --- | --- |
| MEP-202, `research/specs/request-shapes.md`, “Record timeline: documented, not observed” | Public-document vocabulary, `field_history`, filters and cursor parameters. The documented `__timeline` resource differs from the observed browser resource; it is not proof of browser literals. |
| MEP-224, the same spec, “Record timeline” and “Rendered event sentences” | Fifteen captures across nine Leads records still had null `field_history`; the only observed title was `Lead Image uploaded`, with time and `by <user> <timestamp>`. No observed field-change sentence can be inferred from this sample. |
| `research/specs/record-detail.md`, Contacts D-36–D-51, Accounts AD-159–AD-162, Deals and Activities record-detail specs | Shared History toolbar and four filters; Contacts/Accounts show field and call events, Accounts has only History, Deals has an observed empty History. These screen observations do not establish populated field-history wire keys. |
| `research/specs/notes.md` State C; MEP-580 | `Note added`, body, time/actor and Show More; notes interleave with field/call events. The assigned interim behavior suppresses separate note edit/delete events and removes the added row when the note is deleted. |
| `research/specs/attachments.md` OQ-04; MEP-600 | Attachment-specific events were not observed. `Attachment added` / `Attachment deleted` with filename, actor and time are explicit interim behavior. A record-image upload is a different event. |
| `packages/core/src/records/contract.ts`, fixture lifecycle hooks and registry | Organization-bound service and generic CRUD/batch/merge paths exist; no history port or public transaction boundary exists. Fixture hooks are synchronous internal extension points. |

Evidence precedence remains observed browser shape, then documented behavior,
then explicitly Interim proposals. All decisions below are proposed; specific
unverified display/wire choices are also marked Interim for future parity work.

## Decision

### 1. A semantic event model, separate from rendered sentences

Store structured events rather than English prose. A single immutable event is
one successful logical operation on one subject record. A stream is the history
of a parent record and can include events whose subject is a related child.

| Event property | Proposed meaning |
| --- | --- |
| `id`, `schemaVersion` | Opaque server event ID and version of the event payload. |
| `organizationId` | Tenant boundary, supplied by authorized context; never trusted from input. |
| `stream` | Parent `{module, recordId}` whose History includes the event. Direct writes use the subject as the stream. |
| `subject` | `{module, recordId}` actually created/changed/deleted, with a minimal display-name snapshot if needed. Modules uses this module, not the parent module. |
| `kind` | Stable internal semantic kind from the table below; independent of wire `action` and presentation glyphs. |
| `actor` | Server-established user ID and display-name snapshot, or an explicitly typed system actor. No email/profile snapshot by default. Removed actors retain attribution without requiring active membership. |
| `occurredAt`, `sequence` | Server commit time in UTC and a monotonic tenant-local commit sequence. One operation can share its time across several events. |
| `operationId`, `ordinal` | Correlate a save, batch, conversion or merge and deterministically distinguish its events. Not a browser-supplied actor or timestamp. |
| `source`, `mechanism` | Initiating channel (`manual`, `api`, `import`, future automation channels); mechanism such as mass update, owner change or conversion is separate. |
| `changes[]` | Ordered items with field API name, data type and label snapshot, typed old/new values and old/new display values. Explicit null means empty; missing is not a substitute for empty. |
| `relation`, `payload` | Optional typed relation/child reference and bounded kind-specific payload; no arbitrary request dump, file bytes, private storage key or local path. |

Use API names and typed values for identity/comparison. Owner/lookup values
retain module/ID plus display snapshot; picklists retain stored and display
values. Rename of a user, field, lookup target or option must not rewrite an old
event. A display-only rename is not a field update. Labels and values are escaped
as text at render time; snapshots remain subject to current read permissions.

| Operation after successful commit | Internal kind and stream behavior |
| --- | --- |
| Create / clone | `record_created` on the new record. Clone is a new create with mechanism `clone`; no source-record event. Do not dump all initial values as field-change rows. |
| Update, inline edit, mass update, owner transfer | `fields_updated`, one event per affected record, with all actually changed business fields. Owner, lookup and picklist changes use the same diff. Empty-to-value and value-to-empty are changes. |
| Delete | `record_deleted`, with minimal identity; parent cascade is part of the same operation. Deleted parents have no readable stream through the ordinary endpoint. |
| Restore (future) | `record_restored` only if a separately approved restore path commits. No restore API is introduced here. |
| Conversion | `record_converted` on the source; new targets emit `record_created`, reused targets emit actual `fields_updated` only. Correlate target references under one operation; do not mislabel conversion as deletion. |
| Link/unlink of a related record | `related_record_added` / `related_record_removed` on each affected parent stream. Reparenting emits removal for the old parent and addition for the new parent. A child field update is not another addition. |
| Related activity create/update/delete | Parent stream carries the child's create/change/delete event with the activity as subject. Suppress a second generic relation-add row for the same child creation. Tasks, Calls and Events use their registered API names; Meetings is the display label for Events. |
| Note create | `note_added` on its parent, replacing generic child-create/link rows there; see §4. |
| Attachment becomes ready / is logically deleted | `attachment_added` / `attachment_deleted` on its parent, once per attachment; see §4. |
| Merge / deduplicate | `records_merged` on the surviving master plus actual master field changes in that event's `changes`. Transfer children and record relation moves under the same operation. Do not emit ordinary delete/cascade events for merged duplicates. |

This vocabulary does not add missing operations. Restore, conversion, merge and
relationship adapters must explicitly preserve these semantics when implemented.
Failed validation/authorization, locked records, rejected whole batches, no-op
saves, seed/reset, reads, export/download, metadata changes and cosmetic display
resolution emit no record history. Server audit fields such as Modified_Time and
Modified_By do not create extra field-change items. Other server business-rule
changes within a save are included in its final before/after diff.

Multi-field saves produce one event/card with ordered changes, not one event per
field or request key. Use metadata field order, then API-name order for fields
without a layout position. A batch has one shared operation ID and one event per
changed record. Preserve existing all-target validation/atomicity; imports retain
ADR 0005's row-level partial success, so only committed rows produce events.

Interim presentation templates: `<Record label> created`, `<field label> changed
from <old> to <new>`, `<Record label> deleted/restored/converted`,
`<Related module label> added/removed`, and `<Record label> merged`. A multi-field
card renders one change line per visible field, with one time/actor attribution.
Empty values use a localized empty marker. These are proposed sentence patterns,
not MEP-224 observations. Preserve the observed `Note added` template and the
MEP-600 interim attachment templates; profile-image events remain a separate
future kind rather than being synthesized as Attachments.

### 2. Record-engine port and commit boundary

Add a framework-independent history contract under `packages/core/src/records`:
an internal `RecordHistoryStore` with append-batch and scoped page-read operations,
and an organization-bound `RecordHistoryService.list(module, recordId, query)`
for authorized reads. Names here are proposed interfaces, not existing exports.
The composition root supplies the same history store to records, Notes and
Attachments; callers cannot append arbitrary events through the read service.

The generic write coordinator creates an operation context, validates the entire
operation, computes final diffs including lifecycle effects, stages records and
events, then publishes both together. All generic create/update/massUpdate/
changeOwner/delete/merge paths use it. Module bundles declare metadata/relations;
they must not each implement field-history logging. A hook that mutates a second
record must contribute that mutation to the operation, not silently bypass it.
Conversion and child services participate in the same commit boundary; a UI hook,
route handler, or a post-success best-effort callback is not a history writer.

Fixture implementation: maintain tenant-scoped event maps, operation dedup keys
and sequence counters alongside record maps. Stage a copy or rollback-capable
mutation set covering hooks/cascades before publishing; an append/hook failure
leaves both records and events unchanged. Reset/seed clears both stores and does
not fabricate historical activity. This is process memory, lost on restart and
not shared across server processes. The current `afterWrite`/`afterDelete` hooks
alone do not provide the proposed atomicity guarantee.

Persistent implementation: append history in the same database transaction as
record/child metadata mutations. Blob publication follows ADR 0005: pending or
failed uploads emit nothing; ready publication commits its event with ready
metadata, logical deletion commits its event before later blob cleanup. No queue,
external bus or second database is required for this decision.

**SQL table sketch, dependent on ADR 0002, not final DDL:**

- A logical event table holds tenant/event IDs, schema version, stream and subject
  module/record references, kind, actor, UTC time, commit sequence, operation ID,
  ordinal, source/mechanism and bounded payload.
- Changes may be an ordered JSON payload or a child table keyed by tenant/event/
  ordinal with field API name, type/label and old/new typed/display values.
- Index sketch: tenant + stream + descending sequence/ordinal; optional tenant +
  stream + subject module/actor/source/time access paths after query measurement.
  Unique tenant + operation + stream + ordinal prevents repeated appends.
- Every query and uniqueness boundary includes tenant identity; CRM RLS follows
  ADR 0001. Record key type, polymorphic-reference validation, foreign keys,
  partitioning and physical indexes wait for ADR 0002. No cascading foreign key
  may silently delete retained history with its subject record.

### 3. Read API and History filters

Use `GET /crm/v9/{module}/{recordId}/timelines`: ADR 0004 requires the observed
resource/version when available. Existing record writes and child endpoints
remain under `/crm/v2.2/...`; inventing a v2.2 timeline path would discard known
evidence. Thin generic handlers call the history service; the HTTP codec owns
wire naming. Session, `X-CRM-ORG`, no-store, tenant checks and four-key error
envelopes follow ADR 0004. No mutation endpoint for history is exposed.

Request: `per_page` (default 25, Interim allowed 1–200), optional `page_token`,
`include=extension,type`, and URL-encoded JSON `filters`. A first request omits
the token. Codec-supported `include_inner_details` tokens follow the documented
field-label/data-type tokens in `request-shapes.md`; do not fabricate the captured
redacted values or send `include_timeline_types` before a supported type exists.
Return known optional unpopulated automation/extension/type details as null
(Interim); never invent actor profile/module identifiers to fill a sample shape.

| History selector | Proposed filter translation and semantics |
| --- | --- |
| Modules | `record.module.api_name` + `in` + selected API-name array. Notes, Attachments, Tasks, Calls, Events, Emails; direct parent field events match the parent module. Empty array omits the condition. Meetings maps to Events. |
| Users | `done_by.id` + `equal` + selected actor ID; All Users omits it. The current component supports one user; the service may support documented `in` for future callers. Never resolve a display name as identity. |
| Time | `audited_time` + `between` + two ISO timestamps. Any Time omits it. Interim intervals are UTC calendar days: Today `[today,tomorrow)`, Yesterday `[yesterday,today)`, Last 7/30 days include today and the preceding 6/29 days. Resolve once when Apply is pressed. Custom Range/Specific date remain disabled until scoped UI work. |
| Sources | `source` + `in` + selected channel tokens. Empty array omits it. Interim Manual maps to `crm_ui`, API to `crm_api`, Import to `import`; the latter is a local wire proposal. Mass update/owner/conversion keep initiating channel, with mechanism retained internally. Unimplemented automation source labels produce no synthetic events. |

Combine nonempty selectors with `{group_operator:"AND",group:[...]}`; leaves
are `{field:{api_name},comparator,value}`. Within a multiselect, `in` is OR.
Documented filter grammar is reused on the observed browser path as an Interim
choice, since applied browser filters were not captured. Validate recognized
filter fields, comparator/value types, module/source tokens and time bounds;
reject malformed filters/tokens with 400 `INVALID_DATA`. Unknown query keys are
ignored under ADR 0004, but unknown filters are not silently ignored. No filters
or dropdown choices are persisted in the reference CRM or in record history.

Response: `200 {timelines:[...],info:{count,more_records,page,per_page,
next_page_token,previous_page_token}}`; `count` is this page's visible event count.
An empty authorized result uses ADR 0004's 204 with no body (Interim for History).
The codec maps `occurredAt` to `audited_time`, actor to `done_by`, subject to
`record`, parent stream to `related_record` for child events, and changes to
`field_history[]{api_name,field_label,data_type,_value:{old,new}}`. Null clearing
values remain null (Interim extension beyond the documented new-string sample).
Direct events have null `related_record`. The wire `record` meaning follows the
documented module filter; it is not always the stream parent.

Interim action mapping: create/note/attachment additions → `added`, field changes
→ `updated`, a dedicated owner-only transfer → `owner_assigned`, relation add →
`relatedrecords_added`; delete/remove → `deleted`, restore → `restored`, convert
→ `converted`, merge → `merged`. The last four are local literals, not documented
ones. Mixed owner/other-field saves stay `updated`. Stable internal kinds must
survive codec round trips using an explicitly documented local `event_kind`
extension; do not overload the documented signals `type`. The minimum wire
payload for note body/attachment name also needs a documented local extension
(`event_details`) rather than an invented observed key.

Authorization precedes paging: require current read access to the stream record
and, for child events, current child/relation visibility. Unknown, foreign or
inaccessible parents return the same 404. Do not expose deleted-parent history
without a future recycle-bin read permission. Re-evaluate current field read
permissions on every page; remove hidden field names, labels, IDs, values and
derived text, and drop a field-update event with no remaining visible changes.
Lookup snapshots additionally require visibility of the target or are redacted
without disclosing its ID/name. Deleted attachment events use parent access plus
current attachment-view permission and a minimal tombstone; no download link.
Deleted notes have no visible added row under §4. Filter options must not reveal
foreign actors/records; never use field projection as permission enforcement.

### 4. Notes and Attachments share the stream

MEP-580's temporary client projection must eventually be replaced by server
`note_added` events. Use note ID to reconcile transitional rows; never concatenate
two copies of the same event. Keep the original creation actor/time, but resolve
the note's current authorized, sanitized body at read time. Editing a note updates
that displayed body, emits no separate History row, and does not move its time.
Deleting a note suppresses its added row; it does not retain a readable body
snapshot. This deliberately preserves MEP-580's interim behavior, rather than
claiming an immutable audit-log UI. History is not a compliance audit service.

MEP-600 additions/deletions use the same event envelope, source, actor, filtering
and paging. Added events appear only after readiness; failed/pending uploads,
download and retried cleanup create no events. Keep the original minimal filename
snapshot for the deletion row, without bytes, private keys or link URL snapshots.
Do not turn a profile-image upload into an attachment event. Direct attachment
deletion preserves its added/deleted rows; parent deletion makes the whole stream
inaccessible. Note-bound attachments resolve authorization through the ultimate
parent; hiding/deleting the note hides its nested attachment events too.

Reparent/merge must update a note's stream association atomically with its parent
reference and transfer its existing visible creation event once to the surviving
stream, without fabricating a fresh addition. Preserve the original actor/time
and correlate the transfer event. Never copy the note body into a relation event.

### 5. Retention, ordering and retries

- Propose no automatic age expiry initially: retain minimal record/field and
  attachment events for the lifetime of the tenant, including inaccessible
  deleted-record tombstones. Fixture restart/reset still loses everything.
  Tenant deletion and an explicitly authorized privacy purge remove event data
  too. No retention scheduler or legal audit guarantee is introduced.
- Note bodies are live authorized projections, not immutable history snapshots.
  Store no note body in append payloads. Redaction/erasure may override immutable
  snapshots; only an authorized maintenance path can purge, never a public API.
- Order newest commit sequence first, then descending operation ordinal and ID.
  All events in a commit share UTC time; time/ID alone is not the ordering key.
  Render day headers using the screen's display timezone without changing order.
- Page by opaque cursor, pinning a first-page sequence high-water mark and last
  scanned ordering key, bound to tenant, caller, stream, filters and page size.
  New commits do not shift later pages. Reapply permissions and note visibility
  on every read; scan until a visible page is full or exhausted. Tokens must not
  expose redacted payloads; changed scope or invalid token is 400. Revocations,
  deletions and purges can remove rows between pages; this is no content snapshot.
- A server operation ID is reused inside one logical retry, with event uniqueness
  on operation/stream/ordinal. Same retry appends nothing twice; a failed commit
  consumes no visible events. Import uses its job/row operation key; attachment
  readiness/deletion uses its lifecycle operation key. Body equality is not an
  idempotency key: two intentional identical creates are separate operations.
- Existing record HTTP writes have no durable idempotency guarantee. This ADR
  does not make independent browser retries exactly once. Cross-request keys,
  request fingerprints and mutation/result persistence require a separately
  approved write-contract extension; event dedup alone cannot prevent two records.

## Alternatives and consequences

| Alternative | Reason to reject |
| --- | --- |
| Build History by diffing records in the browser | Misses imports/API/batches, loses old values and attributes reads as writes. |
| Per-module post-write logging hooks | Duplicates policy and can commit records without events or emit twice on nested writes. |
| Infer all history from current Notes/Attachments lists | Cannot retain attachment deletions or record field diffs. Notes' live-body exception is explicit, not a universal event strategy. |
| Require a physical SQL schema before defining the port | Blocks generic behavior on ADR 0002 and prematurely chooses record identity/storage. |

The generic commit boundary becomes more demanding, especially for fixture hooks,
cascades and merge. The event schema contains sensitive field snapshots, so read
redaction and purge are part of the contract. Existing empty-array and client-only
child projections remain until separately approved implementation slices replace
them. Module 1 differences still require its board gate; this draft approves none.

## Verification required of future implementation

Extend the shared record contract suite and run it against the fixture and HTTP
adapters, then the SQL adapter when ADR 0002 lands. Cover:

1. Create; multi-field inline/form updates; owner/lookup/picklist/null diffs;
   no-op saves; final rule-derived changes; clone and all registered modules.
2. Atomic failed writes, locked/rejected batches, event-append/hook failure
   rollback, cascades, merge transfers and conversion target reuse; no seed events.
3. Tenant/record/child/field/lookup visibility, permission changes between pages,
   removed actors, deleted parents, safe text rendering and no hidden-value leaks
   in counts, cursor payloads, event details or filter options.
4. Combined four-filter semantics, Meetings-to-Events mapping, UTC midnight and
   exact interval bounds, invalid filters, empty 204, page sizes, same-time order,
   insertions while paging, permission-driven page refill and token scope checks.
5. Idempotent append retry versus intentionally repeated operations, import row
   partial success, upload ready/failure/delete races and no cleanup/download rows.
6. One unified note/attachment/field/activity stream; original note attribution,
   edit body refresh, delete suppression, Show More, attachment tombstones and
   no doubled transitional client events. Replace the Accounts history fixme
   only when real writes and a reload prove the persisted adapter behavior.
7. HTTP codec round trips, documented versus local wire keys/actions, ADR 0004
   auth/header/error handling, and request assertions on changed record screens.

This documentation-only issue runs no Biome, typecheck, unit or end-to-end tests;
review checks scope, links, whitespace and consistency with the cited contracts.

## Open questions for CTO disposition

1. Accept or revise the Interim field-change/create/delete/conversion sentences,
   action literals, local event extensions and source mapping? MEP-224 did not
   establish these; attachment labels remain attachments OQ-04.
2. Accept preserving MEP-580's live edited note body and deletion suppression,
   including relocation on merge, rather than an immutable note audit trail?
   Exact note edit/delete and nested attachment History parity remain unobserved.
3. Accept no automatic age expiry, snapshot erasure policy and deleted-record
   retention, or set a time budget before a persistent adapter ships? This is
   independent from ADR 0005's seven-day CSV job-history retention.
4. Under ADR 0002, which record key/reference shape and transaction coordinator
   support atomic record/event writes? Physical schema, RLS and indexes wait there.
5. Approve the Interim v9 browser filter codec, UTC windows, null clearing values,
   cursor rules and source-channel grouping? Custom Range/Specific date and most
   automation channels remain later scoped work, not fabricated supported flows.
6. Which future restore/conversion/merge permissions and event details should be
   enabled with those flows? Existing delete behavior is permanent; this ADR
   neither creates a recycle bin nor changes ADR 0005 lifecycle acceptance.
7. A later cross-request idempotency contract is needed for durable retry safety;
   event uniqueness alone is insufficient. Scope it with persistent write work.

CTO acceptance must resolve or explicitly defer these questions and identify the
accepted local deviations before implementation tasks use this ADR as a contract.
