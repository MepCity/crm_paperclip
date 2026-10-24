# ADR 0011 — Organization customization metadata

- Status: Accepted (board answers 2026-10-24)
- Date: 2026-10-23
- Issue: MEP-1122
- Decision owner: CTO; board policy answers in §5
- Scope: Architecture draft only; no runtime changes, migrations or grants

## Context and evidence boundary

Organization customization must change fields, field properties, layouts,
sections and saved views without editing module source files. ADR 0001 §5
requires metadata as data and one record write path. ADR 0004 supplies the
transport boundary. ADR 0002 (MEP-40) remains unaccepted and has no ADR file in
this checkout. As with [ADR 0008 §1](0008-documents-storage.md), define interfaces
and an in-memory adapter first; physical storage, RLS and record-key design
must wait for ADR 0002. This proposal does not decide JSONB versus relational
record storage or introduce a second record engine.

Evidence sources, in precedence order:

1. The research workspace's `metadata/` export is the source of truth for the
   reference data model. Its `modules.json` describes module capabilities;
   `modules/<module>/fields.json` contains types, constraints, view flags,
   lookup/picklist structure and profile associations. `layouts.json` contains
   layout visibility, actions, profile associations and ordered sections with
   field placement. `custom_views.json` is a summary inventory; nested
   `custom_views/` exports supply individual view definitions. Related-list,
   role and profile exports provide relationships and permission structure.
   Export identifiers, account information, labels and customer values are
   never copied into this ADR or committed fixtures. Local identifiers must be
   generated independently; sanitized model structure is translated explicitly.
2. [R1 Modules and Fields](../../research/specs/customization-modules-fields.md)
   (MEP-1109) establishes initial module, layout and field administration lists,
   empty Validation Rules / Map Dependency Fields, and the Summary state.
   Editors, saves, deletion, reordering and permission failures were not tested.
   Buttons and Links have unresolved capture failures. Custom Views is not a
   visible settings tab. Saved-view editing must use its own approved research,
   including [list views](../../research/specs/list-views.md), rather than infer
   a settings tab from exported metadata.
3. MEP-1135's counts-only inventory (`scripts/metadata-inventory.mjs`) identifies
   engine gaps: formula, linetax, module, multiselectpicklist, subform and
   userlookup occur in metadata but are absent from `FieldDataType`. Presence
   in an export does not authorize creation of those types. Capability support
   requires validation, rendering, querying and import/export adapters together.

No reference session was opened for this draft. Behaviour proposed below is our
recommended contract, not an observed reference write outcome. Module 2+
parity requires behaviour and inventory; network shapes may be our own.

## Options and recommendation for the CTO

| Option | Benefits | Costs / risks |
| --- | --- | --- |
| A. Immutable code baseline plus organization overlay resolved by core | Preserves existing module behaviour; explicit changes and rollback; one metadata source for all engines | Resolver, dependency checks, revision handling and baseline upgrades need contracts |
| B. Copy the entire baseline into each organization and edit the copy | Simple reads; all definitions immediately editable | Copies drift from fixes; upgrades require full reconciliation; encourages duplicate authorities |
| C. Keep customization in web screen definitions or browser preferences | Small initial UI change | Backend validation, imports and other users disagree; does not deliver organization customization |
| D. Generate module code or run tenant-specific DDL per settings change | Static generated types / physical columns | Deployment or migrations become part of an ordinary settings save; prematurely decides ADR 0002 |

Recommend **A** for CTO approval. The baseline is a versioned seed input, not a
permanent exception to ADR 0001's metadata-as-data model. The overlay is stored
as data behind a repository port. After ADR 0002, a persistent adapter may
materialize resolved definitions without changing the resolver contract.
The CTO has not accepted this recommendation. Board policy questions below
remain gates on the corresponding implementation slices.

## 1. One effective definition, separate from executable screens

Today `apps/web/src/modules/*/definition.ts` exports `ModuleScreenDefinition`:
React components, callbacks, actions, form rules and module presentation.
`packages/core/src/records/contract.ts` separately defines `ModuleMetadata`,
`FieldDefinition`, `LayoutSection`, `ListView` and `RecordService`; fixture
metadata lives under `packages/core/src/records/fixture/`. Screen definitions
are not the authoritative server schema and must never be serialized as
organization configuration.

Introduce an `EffectiveModuleDefinition` in core: sanitized baseline metadata
plus organization changes, identified by module, baseline version and overlay
revision. It includes fields, layout identities/sections, view definitions and
explicit capability flags. Preserve existing `ModuleMetadata` projections while
adapters gain the richer contract. Current metadata has one `layout` array;
multiple layouts need an explicit extension and deterministic selection, not
an overloaded array. Default to the existing single layout until a reviewed
layout-assignment policy exists.

Resolution order:

1. Load the registered module baseline and the organization's overlay snapshot.
2. Apply allowlisted field property patches and append custom fields with stable
   local IDs and immutable API names; API names cannot collide with baseline,
   reserved or previously retired field names. Labels are mutable presentation.
3. Resolve layouts and section membership by stable field IDs. Validate all
   references, order, supported column counts and required-field reachability.
4. Resolve saved views against active fields and the supported criteria AST.
5. Intersect capabilities with engine support and the caller's authorization;
   return an immutable, revision-tagged projection.

Allow property patches for labels, supported length/range/picklist constraints,
required state, read-only state and surface visibility only where the baseline
explicitly allows them. A customization cannot unset a system-required field,
make a computed/system field writable, relax a domain invariant or replace an
executable module action. Reject unsupported properties, types and criteria;
never silently coerce them to text or ignore them.

The web layer combines this projection with registered screen callbacks.
Generic list/filter/form/detail builders consume effective fields and layout.
Specialized module sections and form rules remain code extensions, but cannot
reintroduce a hidden/deleted field or weaken server constraints. Leads' current
specialized behaviour requires explicit regression coverage and its existing
board parity gate before any visible deviation. Custom modules, scripts,
validation-rule interpreters, dependency rules and automation are outside this
ADR; an extension point does not enable them.

Baseline upgrades carry an explicit version. Resolve and validate overlays
against the new baseline before activation; reject unresolved collisions and
retain the previous compatible snapshot. Never silently discard customization
or publish a partially upgraded schema.

## 2. Domain port, revisions and storage boundary

Proposed logical entities, all scoped by organization and module:

- `CustomizationSnapshot`: baseline version, revision, field additions/patches,
  field tombstones, layouts and section placement, saved views and audit metadata.
- `CustomField`: local identity, API name, type, permitted constraints and
  lifecycle (`active` or `retired`). Record values remain in the record store;
  the metadata repository never becomes a value store.
- `LayoutDefinition`: local identity, label, ordered sections and field IDs,
  default marker; assignment scope reserved for a separately accepted policy.
- `SavedViewDefinition`: local identity, columns, criteria, sort, scope and
  system/default markers. Existing system views retain their protected status.

Define a framework-free `CustomizationRepository` with
`readSnapshot(orgId, module)` and conditional
`compareAndSwap(orgId, module, expectedRevision, nextSnapshot, auditEntry)`.
A core customization service accepts `OrgContext`, validates permissions,
resolves the candidate, checks dependencies and publishes it atomically.
A failed validation or stale revision changes nothing. One successful publish
increments the revision and records actor, operation, target IDs and time;
audit entries avoid record values. Reads never create a customization snapshot.

The initial in-memory adapter keys all maps by organization and module, returns
defensive immutable snapshots, and implements atomic conditional publication
within its supported process. It is explicitly ephemeral: restart loses edits,
and separate processes do not share revisions. Until a persistent adapter is
approved, editing is a gated development/test capability, not a durable
production settings feature. No disk JSON substitute or ad-hoc database tables.

Record writes resolve one schema revision and validate/commit under that same
revision. Publication and writes must serialize per organization/module, or
abort/retry on a changed revision before side effects. In-memory adapters need
one shared coordinator with the record service; future database transactions
must provide the equivalent guarantee. A process-local mutex is insufficient
for persistent multi-process execution. ADR 0002 must settle transaction,
audit/outbox, constraint enforcement and RLS integration before that adapter
ships. Authorization is rechecked on every operation, including cache hits.

Cache effective metadata by organization, module, baseline version and overlay
revision; authorization projections also include caller/policy identity.
Publication invalidates metadata, views, list/filter builders and form/detail
queries for that module. Other organizations' caches remain untouched. An open
form submits its schema revision: stale mutations fail with a conflict and
require refresh; they are not automatically replayed and lose no local edits.

## 3. Permissions and field lifecycle

Permission policy (board decision 1): only an authenticated current organization
`admin` may customize organization fields, layouts or shared views. Ordinary
members may read only their effective authorized metadata. Any existing private
view rights stay separate; this ADR grants no new shared-view write right to
members. Future profile-based capabilities must be resolved server-side rather
than inferred from a hidden UI button. Non-members retain the existing
not-found boundary. Layout hiding is presentation, never field-level security;
actual field access restrictions must also apply to APIs, queries and exports.

| Change | Existing records | Proposed validation / dependency rule |
| --- | --- | --- |
| Add optional field | Old records read an absent value as null; no eager rewrite | New writes validate the supported type; defaults apply only to new records when explicitly configured |
| Add required field / tighten required state | Existing values stay intact | Initially reject publication if affected records lack valid values; rejected (board decision 3) |
| Hide field on a surface | Values retained; no destructive rewrite | Block configurations making a required editable field unreachable without a valid server value; UI visibility alone does not revoke data access |
| Make field read-only | Values retained | Reject caller writes through every write path; server-owned calculations remain privileged internal operations |
| Rename label / move section | Values and field identity unchanged | Views, mappings and sort use stable identity/API name, never label |
| Remove picklist option / tighten length or uniqueness | No silent truncation or substitution | Validate affected records, including retained/recoverable records; reject until conflicts are explicitly resolved |
| Delete custom field | Retire definition; retain stored values | Block while active views, layouts, import mappings or domain dependencies refer to it; detach explicitly first; ordinary reads/writes no longer expose it |
| Delete system field / change field type or API name | Unsupported | Reject; type conversion and physical value purge need separate reviewed migration/retention policy |

Retirement is a proposed reversible metadata lifecycle, not automatic physical
purge. Retained values are unavailable to ordinary record APIs, filters, search
and exports. Restrict any future recovery access to an explicit authorized
service. Restore only the same identity after compatibility/dependency checks;
never reuse a retired API name for another field. Values are retained indefinitely
(board decision 2). Records in the recycle bin are checked on restore against current
metadata; restore fails atomically with actionable conflicts instead of silently
coercing data. Do not rewrite historical record events or audit labels.

Dependency checks include supported layouts/views, conversion mappings, merge
criteria, search/header/status fields, import mappings, related-list projections
and registered code invariants. Unknown dependencies block destructive changes.
Do not silently drop a saved-view criterion: that could broaden its result set.

## 4. Existing HTTP routes and engine integration

Keep ADR 0004's thin handlers, operation codecs, authenticated organization
header/context and service authorization. Proposed mutations extend existing
resources; they are not claims about observed reference network requests.

| Resource | Current operation | Proposed extension |
| --- | --- | --- |
| `/crm/v2.2/settings/fields` | GET through `operations.fields` | GET effective fields/revision; POST custom field; PATCH allowlisted property changes; DELETE retirement, addressed by local field ID |
| `/crm/v2.2/settings/modules/[module]` | GET through `operations.module` | GET effective module/capabilities/revision; PATCH supported module labels/default layout only |
| `/crm/v2.1/settings/layouts` | GET through `operations.layouts` | GET effective layouts; POST/PATCH/DELETE validated layout changes addressed by local layout ID |
| `/crm/v9/settings/custom_views` and `/[viewId]` | Existing view resources | Extend their operations for saved-view changes; do not add a duplicate customization view store or invent a settings tab |

Keep current query conventions and response codecs backward compatible; add
revision/capabilities through an explicit contract change. Mutations carry
`expectedRevision` plus a typed command; module remains explicit where not in
the path. A command publishes one complete validated snapshot, including layout
placement needed for a new required field. Exact payload codecs belong to the
contract slice. Existing error handling maps validation, forbidden, not-found
and conflict errors; define a distinct stale-schema error code so clients can
refresh safely. Unknown keys and unsupported types fail validation. No mutation
handler writes the repository directly or takes an organization ID from a body
as authority.

| Consumer | Required effect |
| --- | --- |
| Record create/edit, inline edit, mass update, conversion and merge | All call the same metadata-aware validation/service path; UI rules cannot bypass constraints |
| Lists, saved views, sorting and global search | Resolve active authorized fields; typecheck criteria and sort; invalidate cached columns/results; reject stale field references rather than broaden queries |
| Filter panel | Build operators from supported field capabilities; server validates the same AST; parameterized compiler for future SQL |
| Forms / quick create | Use effective layout, view flags, constraints and picklists; preserve draft values on revision conflicts |
| Record detail / specialized sections | Render effective sections and authorized fields; apply read-only rules to inline edits; preserve registered module actions |
| CSV import | Capture mapping and schema revision; revalidate at execution and each commit boundary; report stale mappings without partial schema-driven corruption |
| CSV export | Resolve authorized active columns and revision at execution; existing export permission rules remain; invalidate retired-field mappings |
| Background consumers / recovery | Recheck current authorization and schema before side effects; historical schemas are diagnostic evidence, not permission grants |

## 5. Consequences and unresolved board policy

Benefits: one schema for settings reads and all record engines; custom fields
remain runtime data; domain code and tenant configuration stay separate.
Costs: schema changes become coordinated operations; specialized screens need
adapters; dependency and compatibility validation must precede editing UI.
In-memory edits cannot be marketed as durable configuration.

Board decisions (2026-10-24, MEP-1228):

1. Organization customization (fields, layouts, shared views) is admin-only
   until profiles are designed; private-view creation stays a separate member
   capability.
2. Retired fields are recoverable; their values are retained indefinitely.
   Physical purge stays disabled.
3. Required-field publication that existing records do not satisfy is rejected;
   no backfill or grandfathering design.
4. First field types: supported simple scalar types only; formula, subform and
   new lookup semantics come later.
5. One default layout per module initially; multiple layouts and assignment
   rules come later.
6. Unverified editor/save outcomes, Buttons and Links write behaviour are
   specified from the reference's public documentation; anything still unclear
   is listed as an open question. The reference stays read-only.
7. Number/date format comes from the organization setting only for now; a
   personal override comes later.

## 6. Implementation order and verification gates

These are proposed slices, not created implementation tasks or permission to
start them. CTO acceptance and the relevant board answers precede writes/UI.
Slices touching a shared file are sequenced under one owner.

| Slice | Dependencies | Deliverable and verification |
| --- | --- | --- |
| A. Core resolver + port + memory adapter | ADR recommendation accepted | Baseline overlay, deterministic resolution, revision/CAS, tenant isolation, defensive copies, invalid-patch rollback and baseline-upgrade tests |
| B. HTTP read projections + codecs | A | Existing settings/view routes return one revision; backward-compatibility and cross-tenant request contract tests |
| C. Record write/query integration | A; lifecycle policy resolved | Shared schema coordinator; create/edit/import/conversion constraints, stale-write race, retirement/dependency, restore and unsupported-type tests |
| D. Generic web metadata consumers | B; paired with C before enabling edits | Lists/filters/forms/detail use effective schema; component and targeted e2e coverage including specialized Leads/Activities regressions |
| E. Customization service mutations + route commands | B + C; admin policy resolved | Denied-member, non-member, invalid-reference, conflict, atomic-audit and no-side-effect-on-failure contract tests |
| F. Field administration UI | D + E; editor behaviour specified | Optional scalar field and permitted properties first; targeted create/hide/retire/stale-editor e2e against our application |
| G. Layout/section editor | D + E; layout policy specified | Can develop independently of F with separate files; required-field reachability, ordering and invalid-reference tests |
| H. Saved-view editor integration | D + E; saved-view scope approved | Independent of F/G; columns, typed criteria, sharing and protected-system-view tests using the existing view resource |
| I. Import/export adaptation | C + E | Independent of editor UI; schema-change-during-job, stale mapping and denied-column tests |
| J. Persistent adapter | ADR 0002 accepted; A/C contracts settled | Tenant-leading keys/RLS, revision transactions, value/metadata coordination, durable audit, restart and multi-process race tests; no runtime DDL per field |

B and C may proceed independently after A; D and E can proceed on their
respective dependencies. F/G/H/I are independent bounded slices once their
policies are resolved, with integration ownership for shared files. J is a
separate persistence gate, not a prerequisite for ephemeral contract tests.
No local full-suite run is warranted for this documentation-only draft. Handoff
checks are current `origin/main` merged, clean diff whitespace, relative links
resolved and the reference-name commit hook passed. Runtime implementation
slices must follow the repository's targeted-test and CI gates.
