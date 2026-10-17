# ADR 0007 — Module-scoped tags and recoverable record deletion

- Status: Partially accepted (MEP-771): §1–§2 logical boundary; §3–§5 remain Proposed
- Date: 2026-10-15
- Decider: CTO
- Issue: MEP-693
- Dependencies: ADR 0002 (MEP-40), ADR 0004, ADR 0005, ADR 0006 (MEP-692)
- Scope: Logical architecture draft only; no implementation or final DDL

## Context and evidence boundary

Tags and Recycle Bin research in MEP-629 is incomplete. This draft separates
architectural recommendations from evidenced behavior and open questions.
Unconfirmed behavior is not decided by choosing a convenient local default.
CTO review can accept the architectural boundary while leaving behavioral and
transport questions pending; acceptance must identify which sections it covers.
No reference CRM or capture tool was opened for this work.

Source paths beginning with `modules/` refer to the local research metadata
root. Only structure is recorded here, without record values or identifiers.
Research branch citations are pinned to the inspected revision, not assumed to
be approved or implementation-ready.

| Key | Source | Established evidence and limits |
| --- | --- | --- |
| M1 | `modules/{Leads,Contacts,Accounts,Deals}/fields.json` | Each has standard optional `Tag`: `data_type: text`, `json_type: jsonarray`, `length: 2000`, `unique: {}`, writable field flags, `filterable: true`, `searchable: true`, `sortable: false`, `mass_update: false`. Array element shape, tag-name length and tag-count limits are not established. |
| M2 | Same fields and `modules.json` | Tag field colour flags are false and picklist values empty. No tag-specific module limit/settings resource was found in the export. These flags do not disprove coloured tag entities. |
| M3 | `profiles.json`; Tag field profile entries | Profile export is descriptive, without action-capability grants. Tag is field-level read/write for the two exported profile types. This does not establish create/manage/delete-tag or restore permissions. |
| R1 | `origin/mep/MEP-629` at `219a099c`, `research/specs/tags.md` | Manage Tags is module-scoped in all four modules. Empty table has Tag Color, Tag Name and Last Modified; counter displays capacity 100 in this environment. Leads Tag filter offers `is`, `is not`, `is empty`, `is not empty`. No tag writes or populated chip states observed; Add Tags dialog remains unobserved. |
| R2 | Same revision, `research/specs/recycle-bin.md` | Initial cross-module list has Name, Type, Deleted By, Deleted Time, selection and Restore/Delete/Empty Recycle Bin controls. Notices describe 60-day retention, administrator permanent deletion, own-record restore and permission-dependent restore of others' records; mass restoration of related children is restricted while their parent remains deleted. Outcomes and Search panel are unobserved. |
| C1 | ADR 0001/0004; `packages/core/src/records/contract.ts` | Organization-bound generic service; metadata validation; thin transport codec; atomic all-target delete contract. No tag/recycle-bin service or capability matrix exists. |
| C2 | `packages/core/src/records/fixture/index.ts`, `registry.ts`, `notes/hooks.ts`, `contact-roles/hooks.ts` (MEP-558) | Delete validates targets and locks before removal. Composed hooks remove related activities, Notes and contact-role links. Current fixture deletion is permanent and supplies no recovery inventory. Merge has separate transfer semantics. |
| C3 | ADR 0005; ADR 0006 draft at `origin/mep/MEP-692`, `e8490dda` | Notes/Attachments lifecycle and proposed atomic mutation/history boundary; internal event kinds `record_deleted` and `record_restored`. ADR 0006 is still labelled Proposed in that file, despite its drafting issue being done. |

## 1. Proposed architectural boundaries

Recommend a tenant- and module-scoped tag catalogue with explicit record links,
and recoverable soft deletion with a deletion manifest. These are architecture
proposals, not claims about the reference's internal storage. Keep both behind
the organization-bound core service boundary and ADR 0004 codecs. All record
lifecycle changes use the generic record engine; no independent HTTP/database
write path or per-module restoration engine.

ADR 0002 decides physical record keys, tables, polymorphic references, RLS,
indexes and transaction machinery. Sketches below are logical entities only.
This draft does not change current permanent deletion, ADR 0005 cleanup behavior,
existing field types, or the pending ADR 0006 implementation.

## 2. Tags: catalogue, links and reads

Proposed logical entities:

- `Tag`: organization, module API name, stable opaque ID, display name, optional
  colour descriptor and server-maintained creation/modification attribution.
  A module boundary follows R1; tags in different modules have distinct identity.
- `RecordTag`: organization, module, record ID and tag ID; unique by this tuple.
  Referenced tag and record must belong to that same organization and module.
  Attaching an existing link must not create duplicate memberships.
- A name lookup key can enforce module-local catalogue uniqueness once the name
  equivalence rule is confirmed (T1). Stable IDs, rather than display names, keep
  record links valid across renames. Name uniqueness itself remains open.

Do not convert M1's `length: 2000` into a per-tag 2,000-character rule or an
array-item limit. Do not treat `unique: {}` as permission to create duplicate
catalogue names. Name trimming, Unicode/case equivalence, empty names, forbidden
characters and lengths remain T1. Catalogue capacity and tags-per-record limits
remain T2: the displayed 100 is environment evidence only. Concurrent create or
assignment must enforce the eventual accepted rules inside the write boundary.

M2 exports no tag palette or per-tag colour value. Preserve an optional logical
colour slot because R1 has a colour column; do not invent a palette, default,
editable colour rule or validation expression. Those remain T3.

For record detail/list projections, recommend resolving links through the
catalogue into the exported `Tag` field, retaining stable identity internally.
Exact wire item keys, empty representation, list visibility/order and projection
inclusion remain T4. Do not introduce comma-separated text or synthetic customer
examples. Rename should resolve through one catalogue entry, rather than rewrite
all record payloads; delete-tag link cleanup and deleted-record links remain T6.

M1 supports tag discovery/filtering but supplies no matching semantics. Reuse
ADR 0004's generic list/count criteria boundary with `field.api_name: Tag`;
implement membership evaluation against links rather than scalar text matching.
R1 establishes Leads operator labels only. Identity-versus-name input, multiple
values (any/all), negative matching of empty records, comparator literals,
name-search normalization and global search inclusion remain T5. In particular,
`searchable: true` is not proof that global record search matches tag names.
List and count must share the same eventual predicate and authorization scope.
Never expose unreadable record memberships through tag usage counts or options.

### Authorization boundary (behavior unresolved)

The following checks are proposed requirements, not grants to current roles.
No new role privileges may be inferred from field-level write access.

| Action | Proposed service check | Remaining evidence |
| --- | --- | --- |
| Read catalogue / suggestions | Authorized tenant/module access; scope usage data to visible records | T7: who sees unused/other users' tags? |
| Create tag | Distinct module tag-create capability | T7: profiles/roles and inline-create equivalence |
| Assign existing tag | Assignment capability plus writable, visible target and ordinary record lock checks | T7: exact capability mapping |
| Remove record tag | Removal capability plus writable, visible target and lock checks | T7: whether same grant as assignment |
| Rename / recolour | Catalogue-management capability, never implicit record ownership | T3/T7: permitted users and field rules |
| Delete catalogue entry | Distinct tag-delete check; atomic affected-link handling once defined | T6/T7: permissions and linked/deleted record behavior |

Capabilities are conceptual policy inputs, not a new API or exported profile
permission name. Until grants are approved, no implementation may equate all
members with managers or use creator identity as the entire permission model.
Reject foreign tag/record references without revealing their existence.

### Slice 1 interim rules

Implementation: `packages/core/src/records/tags/policy.ts` (MEP-771).

- T1: trim and NFC-normalize names; reject empty or over 50 characters;
  module-local uniqueness uses NFC plus lowercase.
- T2/R1: 100 catalogue entries per module; no per-record cap.
- T3: optional `#RRGGBB` colour, default null.
- T4/T5: project `{id, name}` in name order, empty null; ID any-of filtering,
  negative membership includes untagged records; list/count share a predicate.
- T6: idempotent membership addition; catalogue rename preserves links;
  permanent record deletion and catalogue deletion remove affected links.
- T7: no manage capability exists in `auth`; use the existing module-write
  check for catalogue writes, and ordinary record/lock checks for membership.
  This does not introduce a role or capability grant.

All are interim, pending MEP-629. Transport, storage and recoverable deletion
remain Proposed and outside this slice.

## 3. Recycle Bin: proposed retention boundary

Recommend retaining canonical records in a deleted lifecycle state, with a
separate logical manifest describing the deletion operation and affected graph.
The manifest is an index and restoration boundary, not a second authoritative
copy of every field. A snapshot-only tombstone table would duplicate evolving
record schemas and make relations/blob recovery harder. A bare deleted flag
would lose the cascade provenance needed to distinguish independent deletions.
Neither recommendation chooses a physical table layout.

Proposed manifest fields: tenant, deletion ID, root module/record ID, deleting
actor, UTC deletion time, retention deadline, affected record/relation references,
previous lifecycle state/version, and operation correlation. Keep ownership
separate from deleting actor: the notice's meaning of "own records" is R3.
Minimal display identity supports the bin list; it remains permission protected.

Normal get/list/count/search, related lists, lookups and attachment downloads
exclude deleted records and descendants before paging/counting. Ordinary History
reads remain inaccessible for deleted parents under ADR 0006. Restoration is a
separate authorized operation, never ordinary update or upsert. No restore may
resurrect an item already purged or silently overwrite a live record.

### Generic delete and retained graph

Use the MEP-558 pattern: resolve and validate every root and its permissions/
locks before changing any target; compose existing relation effects centrally.
A future coordinator must stage the affected graph before destructive hooks,
then commit lifecycle states, manifest, links and ADR 0006 events atomically.
Current `afterDelete` hooks alone cannot recover removed maps or guarantee this
boundary. Preserve active-read disappearance while replacing physical removal
only in a separately approved implementation.

| Affected material | Proposed recovery-safe representation | Unresolved behavior |
| --- | --- | --- |
| Root business fields and audit fields | Retain canonical values and original ID behind deletion state | R4: restore-time field/default/owner validation |
| Direct Notes and note-bound attachments | Retain content, parent references and attachment metadata behind the deleted parent | R5: which children are restored automatically? |
| Direct attachments and blobs | Keep metadata and bytes inaccessible but recoverable until eligible purge | R5/R6: independent child deletion and exact cleanup deadlines |
| Tasks/Calls/Events removed by parent cascade | Track actual removed items and their typed links in the operation graph | R5: cascade parity and shared-parent handling |
| Contact-role and other relationship links | Record removed edges without deleting surviving endpoint records | R5: restore dependencies and edited surviving endpoints |
| Tag memberships | Retain link provenance without making the deleted record discoverable | T6/R5: catalogue deletion during retention |

The recovery-safe proposal supersedes immediate blob cleanup only if explicitly
accepted alongside ADR 0005. Never use the accepted Notes delete cascade as proof
that child restore semantics were researched. Do not detach a mandatory parent
to null. Do not undo an unrelated deletion simply because its record once linked
to this root; previously deleted items keep their own deletion identity.
Merge/conversion are separate operations: do not expose merged-away duplicates
as ordinary restorable deletions or undo transferred relationships implicitly.

### Restore, permanent deletion and retention

R2 supports carrying **60 days** as the evidenced retention target. Exact clock
start, expiry boundary, timezone, eligibility at the deadline, scheduler cadence
and whether children share the parent's deadline remain R6, not invented rules.
No scheduled purge should be implemented until those questions are resolved.

Before restore, recommend validating the entire requested dependency graph under
current tenant/module/record permissions, live unique constraints and current
metadata. Conflicting live unique fields must not be overwritten or renamed
silently. Whether deleted rows reserve unique values and whether conflicts reject
the whole selection or yield per-item failures remain R4. Parent-deleted children
must not become readable as orphans; R2 establishes a mass-restore restriction,
not single-child behavior or automatic parent restoration. Deleted/purged parent,
missing owner, changed metadata and disabled module outcomes remain R4/R5.

Permanent deletion must be distinct from ordinary record delete and administrator
protected as described by R2. Exact administrator mapping, selection limits and
scope of Empty Recycle Bin remain R3/R7. Recheck authorization at execution; never
interpret an empty selection as permission to erase the entire tenant. Purge must
serialize with restore/expiry, remove recoverable content and links, and make blob
cleanup retryable after the logical commit. Do not delete shared live endpoints
or blobs still referenced by retained/live items.

ADR 0006 proposes longer-lived minimal events than the bin's record retention.
Bin purge and history erasure are separate lifecycles: retaining full record
snapshots in history would defeat permanent deletion. Existing field snapshots,
filename/identity payloads and privacy erasure require explicit joint disposition
(R8); this ADR does not silently shorten or extend ADR 0006's history policy.

### Visibility and event integration

Propose a dedicated bin-read/restore/purge policy boundary, evaluated before
search, counts and pagination. Ordinary delete permission is insufficient proof
of restore/purge permission. R2 describes own versus permission-dependent others'
restore, but does not establish bin visibility or the meaning of ownership (R3).
Do not infer it from Deleted By, current record owner or administrator membership.

Use ADR 0006's `record_deleted` / `record_restored`, actor, operation ID, UTC
commit time and sequence for successful transitions. Failed, denied, conflicting
or retried non-transitions emit no additional transition event. Parent cascade
effects share the operation; do not represent merge as delete. Restored records
resume the same stream/ID; whether child restoration adds child events and which
old Note/Attachment rows become visible again remains R8. No new purge event
kind or deleted-parent History endpoint is established here.

## 4. Transport sketches and storage dependency

ADR 0004 remains binding: browser → thin generic handler → codec → authorized
core service; session, `X-CRM-ORG`, Origin on non-GET, no-store, tenant isolation,
four-key errors and collection paging/empty conventions. New tag/bin paths and
wire shapes were not observed. The following are **candidate locators for open
question A1**, not decided endpoints or reference network claims. A version of
v2.2 follows the nearest existing record-resource convention provisionally;
confirmed evidence takes precedence before implementation.

| Intent | Candidate method/path under `/crm/v2.2` | Shape still open |
| --- | --- | --- |
| Tag catalogue / name search | `GET /settings/tags?module=&page=&per_page=` | Search key, `tags[]` item keys, usage/limits |
| Create / rename / delete tag | `POST /settings/tags`, `PUT /settings/tags/{tagId}`, `DELETE /settings/tags/{tagId}` | Module location, input/result cardinality, colour and errors |
| Assign / remove record tags | `POST /{module}/{recordId}/actions/add_tags`, `POST /{module}/{recordId}/actions/remove_tags` | Tag ID versus name input, overwrite behavior, batch variant |
| Filter/search live records | Existing `POST /{module}/bulk` and `POST /{module}/actions/count` | Tag criteria and matching semantics (T5) |
| Bin list / search | `GET /settings/recycle_bin?page=&per_page=` | Module/name/actor/time search keys, row IDs, envelope and total |
| Restore / selected permanent delete / empty bin | `POST /settings/recycle_bin/actions/restore`, `POST /settings/recycle_bin/actions/permanent_delete`, `POST /settings/recycle_bin/actions/empty` | Selection identity, confirmation scope, atomicity and result shapes |

Existing ordinary delete routes remain ADR 0004's single-record DELETE and
`actions/mass_delete`, delegating to `RecordService.delete(module, ids)`. The bin
must not introduce a second ordinary-delete path. ADR 0004 error classes and safe
messages apply; tag/restore-specific validation messages remain unconfirmed.
Unknown query keys retain ADR 0004 treatment; malformed supported criteria must
not broaden authorization or destructive scope.

Storage sketches pending ADR 0002: tenant-leading tag catalogue, record-tag
membership, canonical lifecycle state, deletion manifest/graph and event store.
Desired invariants are scoped identities, unique record-tag links, atomic
graph/event transitions and race-safe restore/purge. Catalogue name uniqueness,
active-versus-deleted unique indexes, pagination keys, retention indexes,
physical foreign keys and RLS details wait for evidence and ADR 0002. No DDL,
migration, database job library or background service is authorized here.

## 5. Open questions and acceptance gates

| Key | Decision still needed | Evidence / decision owner |
| --- | --- | --- |
| T1 | Name validity, length, trimming/Unicode/case equivalence and module-local name uniqueness | MEP-629 evidence; UI Lead spec review, CTO contract disposition |
| T2 | Environment capacity 100 applicability, per-record cap and limit failures | MEP-629; no universal limit inferred |
| T3 | Colour values, defaults, editability and validation despite false field flags | MEP-629 / metadata follow-up |
| T4 | Populated chips, item schema/order, empty representation and detail/list projection | MEP-629; API codec review |
| T5 | Four-module operators, value identity, any/all, negative empty matching, search scope and normalization | MEP-629; Platform Lead contract input |
| T6 | Removing a membership versus deleting a catalogue entry; effects on live/deleted links, rename timestamps and history | MEP-629; CTO lifecycle disposition |
| T7 | Exact create/assign/remove/rename/recolour/delete/read grants and limits of field-level permissions | Profile/action research; CTO approval |
| R3 | Bin visibility, definition of own records, restore-others grants and administrator mapping | MEP-629; permission contract review |
| R4 | Unique-value reservation/conflicts, batch failure policy, owner/metadata/lock changes on restore | MEP-629; CTO generic engine contract |
| R5 | Child cascade/restore inventory, deleted/purged parent, multiple parents and independently deleted children/links | MEP-629; reconcile ADR 0005/MEP-558 |
| R6 | Exact 60-day clock/expiry, cascade deadlines, restore versus purge race and cleanup retries | MEP-629 notices are not runtime proof; CTO lifecycle decision |
| R7 | Selected versus whole-bin destructive scope, confirmation and limits | MEP-629; no destructive reference testing |
| R8 | Restore event cardinality, Note suppression reversal, attachment history and permanent purge versus retained snapshots | Joint ADR 0005/0006 review by CTO |
| A1 | Endpoint paths/versions, methods, payloads, response envelopes, paging/search parameters and exact errors | Existing approved contracts plus MEP-629; sketches are not network evidence |
| S1 | Record keys, storage shape, uniqueness indexes, RLS and atomic coordinator | ADR 0002 / MEP-40, CTO |

Unknown outcomes must be researched through permitted evidence, never reference
writes. Future slices require approved scope/criteria and may not treat this
proposal as evidence that incomplete screens or unconfirmed behavior are ready.

## Consequences and future verification

Recovery requires retaining otherwise inaccessible content and coordinating the
entire cascade; it cannot be bolted onto a delete response or a browser cache.
Separate catalogue identity avoids rewriting links on rename. Both features add
permission and query paths that must use the same tenant boundary as records.

Future implementation tests must cover tenant/module isolation; tag link
idempotence and concurrent limit/uniqueness enforcement after rules are approved;
rename/delete links and search/count consistency; visibility-restricted usage
counts; delete graph rollback including hook/event failures; current locks and
all-target validation; unique-conflict restore without overwrites; missing or
deleted parents and independent child deletions; deleted-record exclusion from
all reads/downloads; restore/purge races and exact expiry boundaries; shared
blob safety and retry cleanup; event attribution/deduplication; codec round trips
and authorization before paging. Exercise all registered modules through the
shared contract suite rather than implementing module-specific deletion logic.

For this documentation-only draft, verify whitespace, source/revision pointers,
coverage of open questions and consistency with ADR 0004/0005/0006 and the generic
delete path. No runtime code changed; no application test suite is required.
