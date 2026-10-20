# ADR 0008 — Documents storage, folder access and read boundary

- Status: Proposed
- Date: 2026-10-20
- Issue: MEP-929; umbrella: MEP-921
- Review: Platform Lead, then CTO decision
- Scope: Architecture draft only; no migrations, implementation or permission grants

## Evidence and decision boundary

[Documents](../../research/specs/documents.md) (MEP-922) establishes the folder
pane, My Folders / Team Folders, a lock glyph, Name / Last Modified and one
folder listing. It does not establish populated files, Details contents or
write outcomes. [Write flows](../../research/specs/documents-write-flows.md)
(MEP-927, sources A–R, questions U1–U13) supplies documented capabilities,
separating current Documents, generic file service and legacy attachment help.
Generic service capabilities are not proof of deployment availability.

Metadata `modules.json` identifies Documents as organization-based, with API
support and record create/edit/delete flags false. No `modules/Documents/`
field/layout export exists. This supports a separate domain boundary, not an
inference that the Documents UI cannot upload files. Only metadata structure was
read; no reference session or capture was opened and no customer data is copied.

ADR 0001 requires organization context and tenant-leading keys; ADR 0004 defines
thin HTTP handlers, codecs and browser ports; ADR 0005 §2 accepts private blobs
separate from record attachment metadata. ADR 0007's MEP-828 acceptance governs
record recovery, including retained attachment bytes. Its accepted recovery
boundary takes precedence over ADR 0005's earlier immediate deletion for those
record deletion graphs. Ordinary Documents Trash is a different lifecycle.
ADR 0002 (MEP-40) is still pending and has no file in this checkout. The DDL below
is reviewable proposed key structure, not a claim that ADR 0002 has approved it.
Physical record references and RLS integration must be reconciled with that ADR
before persistence work. No throughput, latency or storage-efficiency claim is
made without measurements.

## 1. Domain entities and shared content store

| Option | Benefit | Cost / limit |
| --- | --- | --- |
| A. Dedicated Documents service and tables | Expresses folder trees, memberships and versions without synthetic record metadata | Requires its own authorization and adapter contract |
| B. Register folders/files in the generic record engine | Reuses record tooling | No exported record schema; record ownership, custom fields and deletion hooks do not express this domain |
| C. Model everything as record Attachments | Reuses current attachment metadata | A document can exist without a record and have several versions and record links |

Recommend **A**. Keep `DocumentSpace`, `DocumentFolder`, `DocumentFile`,
`DocumentVersion`, membership/grants and association distinct from `RecordData`.
All document mutations go through one Documents domain service; HTTP handlers
must not write tables directly. Record attachment creation still uses the record
engine and its parent checks. Cross-domain transitions need an explicit atomic
coordinator, rather than an independent attachment write route.

Use the ADR 0005 private blob-store port and tenant namespace for both domains.
Each ready version refers to an immutable blob; attachment links refer to a
version, never a filesystem path. Sharing an adapter does not authorize content
deduplication across tenants or allow Documents to bypass attachment type checks.
No new file types, quotas, native editors, cloud connection or inline preview
policy are approved here. Metadata publication uses pending/ready states,
stream verification and conditional commit; uncommitted uploads cannot appear
in reads. DB rollback cannot undo disk writes: orphan cleanup is retryable after
commit. Cleanup may remove a blob only after checking every live and retained
reference under serialized publication/purge. Do not rely on a process counter.

### Proposed relational keys (design sketch, not a migration)

IDs are UUIDv7, times UTC. `organizations`, `memberships` are existing tables.
The shared blob catalogue name is proposed; adopting it requires an attachment
adapter migration, not a second blob authority. Nullable audit columns below
are omitted for readability, not an authorization substitute: each mutable
entity also needs creator/modifier membership references, timestamps and a
revision for conditional writes. No display-name uniqueness is approved yet.

```sql
CREATE TABLE document_spaces (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  id uuid NOT NULL DEFAULT uuidv7(),
  kind text NOT NULL CHECK (kind IN ('my', 'team')),
  owner_user_id uuid,
  associated boolean NOT NULL DEFAULT true,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, owner_user_id)
    REFERENCES memberships(organization_id, user_id),
  CHECK ((kind = 'my') = (owner_user_id IS NOT NULL))
);
CREATE UNIQUE INDEX document_my_space_owner
  ON document_spaces(organization_id, owner_user_id) WHERE kind = 'my';

CREATE TABLE document_folders (
  organization_id uuid NOT NULL,
  space_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  parent_id uuid,
  name text NOT NULL,
  state text NOT NULL CHECK (state IN ('active', 'trashed')),
  PRIMARY KEY (organization_id, id),
  UNIQUE (organization_id, space_id, id),
  FOREIGN KEY (organization_id, space_id)
    REFERENCES document_spaces(organization_id, id),
  FOREIGN KEY (organization_id, space_id, parent_id)
    REFERENCES document_folders(organization_id, space_id, id),
  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE UNIQUE INDEX document_space_root
  ON document_folders(organization_id, space_id) WHERE parent_id IS NULL;
CREATE INDEX document_folder_children
  ON document_folders(organization_id, space_id, parent_id);

CREATE TABLE content_blobs (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  id uuid NOT NULL DEFAULT uuidv7(),
  storage_key text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  checksum text NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'ready', 'purging')),
  PRIMARY KEY (organization_id, id),
  UNIQUE (organization_id, storage_key)
);
CREATE TABLE document_files (
  organization_id uuid NOT NULL,
  space_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  folder_id uuid NOT NULL,
  name text NOT NULL,
  state text NOT NULL CHECK (state IN ('active', 'trashed')),
  current_version_id uuid,
  checkout_user_id uuid,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, space_id, folder_id)
    REFERENCES document_folders(organization_id, space_id, id),
  FOREIGN KEY (organization_id, checkout_user_id)
    REFERENCES memberships(organization_id, user_id)
);
CREATE INDEX document_file_children
  ON document_files(organization_id, space_id, folder_id);
CREATE TABLE document_versions (
  organization_id uuid NOT NULL,
  file_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  sequence bigint NOT NULL CHECK (sequence > 0),
  blob_id uuid NOT NULL,
  note text,
  PRIMARY KEY (organization_id, id),
  UNIQUE (organization_id, file_id, id),
  UNIQUE (organization_id, file_id, sequence),
  FOREIGN KEY (organization_id, file_id)
    REFERENCES document_files(organization_id, id),
  FOREIGN KEY (organization_id, blob_id)
    REFERENCES content_blobs(organization_id, id)
);
ALTER TABLE document_files ADD FOREIGN KEY
  (organization_id, id, current_version_id)
  REFERENCES document_versions(organization_id, file_id, id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE document_memberships (
  organization_id uuid NOT NULL,
  space_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK
    (role IN ('admin', 'organizer', 'editor', 'commenter', 'viewer')),
  PRIMARY KEY (organization_id, space_id, user_id),
  FOREIGN KEY (organization_id, space_id)
    REFERENCES document_spaces(organization_id, id),
  FOREIGN KEY (organization_id, user_id)
    REFERENCES memberships(organization_id, user_id)
);
CREATE TABLE document_item_grants (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  user_id uuid NOT NULL,
  folder_id uuid,
  file_id uuid,
  access text NOT NULL CHECK
    (access IN ('view', 'comment', 'edit', 'organize', 'share')),
  expires_at timestamptz,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, user_id)
    REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (organization_id, folder_id)
    REFERENCES document_folders(organization_id, id),
  FOREIGN KEY (organization_id, file_id)
    REFERENCES document_files(organization_id, id),
  CHECK ((folder_id IS NOT NULL) <> (file_id IS NOT NULL))
);
```

This minimum sketch covers direct users, not group/CRM-role principals or public
links. Those require typed tenant-scoped principal keys and live expansion at
authorization time; do not serialize a group as an arbitrary user ID or freeze
its membership at grant creation. Restricted subfolders, policy flags, trash
manifests and attachment-link rows need additional reviewed storage. Managed
attachment projections need a tenant/module/record/attachment tuple whose FK
must target ADR 0002's actual record key; no nonexistent record table is assumed.
Their owner is resolved from the current record, not copied into a stale folder.
Persistence is gated on these missing relations, not authorized by this sketch.

Composite FKs prevent foreign-tenant parents, spaces, blobs and version pointers.
They do not prevent ancestor cycles, grants to personal spaces or non-ready
current versions. The service must enforce those invariants transactionally.
Every proposed table needs enabled and forced RLS for a non-bypass runtime role,
with both USING and WITH CHECK matching the transaction-local authorized org.
Use the existing tenancy wrapper; never accept an arbitrary client org setting.
RLS settings and exact policy DDL await ADR 0002; absence of that migration must
not be described as implemented row isolation. Tenant-only RLS also does not
replace item-level access checks in §2.

## 2. Spaces, membership and trust boundary

| Option | Benefit | Cost / limit |
| --- | --- | --- |
| A. One owner/admin rule for all folders | Simple | Contradicts owner-only managed attachments and folder-specific roles |
| B. Separate managed My projection and team access policy | Matches documented distinction | Requires record ownership and folder grants to be evaluated independently |
| C. Treat the lock glyph as read-only | Easy UI mapping | No evidence establishes its meaning |

Recommend **B**. My Folders is a read-only projection of the current user's
managed record attachments, excluding note, email, template and upload-field
attachments (write-flow sources A/B/D). Hierarchy/shared record access alone
does not expose another owner's My tree. Owner transfer updates this projection
through the record lifecycle, preserving attachment IDs. No ordinary upload,
rename, move, share or trash is available from this projection.

Team spaces survive CRM disassociation (`associated=false`); remove association
is not delete-content. Associated roots appear only after CRM tab/profile and
folder access checks. Organization admin is not implicitly folder Admin.
The documented baseline (source F) is:

| Folder role | Baseline operations, subject to policy and item grants |
| --- | --- |
| Admin | Membership/settings, add/edit/rename/share; move including source exit |
| Organizer | Add members except Admin; add/edit/rename/share; move within root; trash/restore |
| Editor | View/add/edit/copy/rename; no baseline share/move/delete |
| Commenter | View/comment/copy/download |
| Viewer | View/copy/download |

Admin trash/restore/purge follows sources E/M. Version restoration/deletion needs
Organizer/Admin; version viewing has a location-specific gate (source I).
Download/print restrictions can override read access. Item grants may elevate
selected content to Edit without elevating root membership (source J). Restricted
subfolders can reduce inherited access; do not assume a simple maximum-role
calculation. Exact group/role precedence, last-admin rule and policy inheritance
remain U2. Recommend no write grants until that resolver is approved; fixtures
must use explicit capabilities, never `role !== viewer` as the whole policy.

Server boundary: session → authorized OrgContext → CRM capability → scoped
resource → effective item/action policy → lifecycle/checkout checks. Apply the
same predicate to tree, list, detail, counts, versions and downloads before
pagination. Prune unreadable ancestors without leaking their names. Foreign and
inaccessible IDs return the same not-found outcome; readable resources with a
denied action can return forbidden. Group revocation, membership removal,
expiry and policy changes take effect on the next request. A UI flag, a record
view grant, a blob key or `locked` never authorizes access. `locked` remains a
presentation marker, separate from checkout; its reference meaning stays U2.

## 3. Versions, names, moves and deletion

| Area / options | Recommendation and unresolved behavior |
| --- | --- |
| Overwrite bytes vs immutable versions | Immutable versions with stable file ID and conditional current-version pointer; restoring a version creates a new head, preserving history (source I). Managed record attachments remain non-versioned. Native editor history remains a separate future adapter. |
| Last-writer-wins vs revision checks | Require expected file/folder revision for writes and serialize sequence allocation, checkout/check-in/discard and purge. Failed or stale checks publish no version. Checkout authority, expiry and literal errors stay U6. |
| Rename by replacing identity vs changing name | Preserve IDs, blob keys, links and versions; update name and modifier/time in one transaction. Name normalization, length, extension/case and conflicts stay U1/U4/U7. |
| Duplicate create vs replace/version/auto-suffix | Recommend explicit conflict with no mutation until a user chooses an approved action; never silently overwrite. This is a proposed local rule, not reference evidence. No name unique index until equivalence and folder/file namespace are decided. |
| Move as copy/delete vs reparent | Stable identity, atomic source/destination validation and cycle prevention. Within team: Organizer/Admin; exit: source Admin; destination: Editor+ (source L). Re-evaluate grants and policy in the transaction. Prior shares/external restrictions need explicit handling; do not silently escalate or drop access. Managed My items cannot move here. Cross-space moves must update descendant space keys atomically; the FK sketch alone does not implement this. |
| Shared CRM bin vs separate Documents Trash | Separate ordinary-document Trash and policies. CRM managed attachments remain under ADR 0007's record/attachment recovery boundary, not team Trash. Reuse coordination/blob retention machinery without pretending the domains have identical permissions or clocks. |

Trashing an ordinary folder hides its descendant graph from all ordinary reads
and downloads, without destroying bytes. Store deletion identity, original
parent, actor/time and graph membership; independently trashed descendants keep
their own deletion operation. Restore checks current access, parent availability
and approved name policy; never restores into a missing parent or overwrites a
live name. Recommend all-target validation and atomic graph transition, with an
explicit conflict until a destination decision is supplied. Only folder Admin
permanently removes Trash entries; Organizer/Admin restore. Source-service
administrator Deleted Items may add another recovery stage (source N); do not
call Trash removal irreversible until that scope is decided.

Do not apply CRM's 60 days to ordinary documents. Active plan, Trash retention,
Deleted Items availability, name-conflict UI and expiry semantics remain U8.
Recommend no automatic purge until a retention policy is accepted. Final purge
must serialize with restore, version publication and new attachment references,
retain bytes pinned elsewhere, then enqueue idempotent cleanup after logical
commit. No scheduler is authorized here. No reference writes are needed to
review these proposals.

## 4. Attaching from Documents to a record

| Option | Benefit | Cost / limit |
| --- | --- | --- |
| A. Copy bytes into an independent attachment | Record access/lifecycle independent of source | Duplicate storage; later document changes do not propagate |
| B. Reference stable file, always latest version | Minimal metadata and dynamic content | Later versions silently change what the record presents; revocation couples both domains |
| C. Reference a pinned immutable version with separate attachment identity | No new byte copy; stable attachment contents | Requires reference-aware retention and dual authorization |

Recommend **C as a local proposal**, pending U12 and CTO acceptance. Current
integration help documents links; legacy Documents help documents attachment
selection, neither proves copying, pinning or version propagation in the captured
Attach > Documents menu. ADR 0005 currently keeps drive sources disconnected;
this ADR does not enable that picker or redefine ordinary HTTP/HTTPS link rows.

A future typed document-reference attachment records tenant, attachment ID,
parent module/record ID, source file/version ID and attribution. Enforce the
version-to-file composite key from §1 and the actual record/attachment keys once
ADR 0002 supplies them. Creation needs writable parent, Attach action, source
read and permitted download/use. Download rechecks both current parent access
and source permission; a reference is not a durable sharing grant. Denied/deleted
source hides bytes without exposing its metadata. Trashing the source blocks
access; restore may re-enable it. Purging the source can leave an unavailable
attachment reference; pinned bytes remain until all live/retained references
release them. Removing the attachment never deletes the source document.

Managed record uploads may appear in My Folders, but document-reference rows
must not recursively appear as new managed uploads or generate another copy.
Record merge transfers the attachment identity under existing attachment rules;
record deletion retains the link in its deletion graph without trashing the
shared source. Product acceptance must explicitly choose revocation behavior,
retention and unavailable-reference presentation before enabling this source.

## 5. Read port and proposed HTTP contract

| Option | Benefit | Cost / limit |
| --- | --- | --- |
| A. Extend generic RecordService | Familiar call surface | Invents Documents metadata/record semantics |
| B. Dedicated organization-bound read service with ADR 0004 adapters | Preserves thin handlers, codec and fixture replacement pattern | Requires Documents-specific DTOs |
| C. Fetch directly in the screen | Fewer layers initially | Couples layout to transport and bypasses the existing port |

Recommend **B**. The existing UI contract is
`apps/web/src/modules/documents/port.ts`, introduced in MEP-920:

- `listFolders(): Promise<readonly DocumentFolder[]>` returns roots with
  `{id,name,section:"my"|"team",locked:boolean}`.
- `listItems(folderId, {field:"modifiedAt",direction:"asc"|"desc"})` returns
  direct `DocumentItem` children. Items contain
  `{id,name,kind:"folder"|"file",uploadedBy,modifiedBy,modifiedAt,parentId}`.
- `getItem(id): Promise<DocumentItem | undefined>` supplies selection detail;
  absent/inaccessible items resolve undefined in this adapter.

Preserve these signatures, field types and absence behavior. Bind the server
service to OrgContext at construction; do not add tenant IDs to screen calls.
Audit display strings map from authorized actor data; bytes, keys, memberships
and internal storage states never enter this DTO. Fixture values are synthetic
UI scenarios, not new reference evidence or authorization precedent.

Name sorting is required by this proposal but unsupported by the current
`DocumentSort.field` union. Add an **optional** `listItemsByName(folderId,
{direction})` capability in a separately reviewed implementation; keep current
`listItems` unchanged. Clients without the capability retain modification sort
and do not advertise Name sorting. An optional `getFileDetails(id)` can later
return a separately specified DTO without changing `getItem`; Details fields,
preview, sizes and versions are not invented in the present UI slice. Root
navigation plus direct-child reads compose a lazy tree; no recursive whole-tree
method or pagination requirement is added to the existing array port.

Proposed HTTP locators below are **our contract**, not observed requests.
Module 2+ does not require matching transport shapes; the accepted Module 1
pattern means codecs, explicit org header, envelopes, errors and thin handlers.
Do not route these through generic `/{module}` record CRUD.

| Read | Request | Response mapping |
| --- | --- | --- |
| Accessible roots | `GET /crm/v2.2/documents/folders` | `{data: DocumentFolder[]}` → listFolders |
| Direct folder contents | `GET /crm/v2.2/documents/folders/{id}/items?sort_by=modifiedAt&sort_order=desc` | `{data: DocumentItem[]}` → listItems |
| Name contents, future capability | Same route with `sort_by=name`, `sort_order=asc|desc` | Same items → listItemsByName |
| Selected item | `GET /crm/v2.2/documents/items/{id}` | `{data:[DocumentItem]}`; 404 maps to undefined for getItem only |

Default is modifiedAt descending, as the captured indicator suggests. Recommend
stable ID ascending as a final tie-breaker for both directions, no assumed
folder-first grouping. Name comparator/case/locale remain a contract question;
choose one shared server/fixture comparator before enabling Name. Supported
sorts change only the response, not stored user preferences. Invalid sort field,
direction or malformed ID is 400, never a broadened query. Results are authorized
before sorting; this initial array contract is complete, with no silent page
truncation. If real data volume requires paging, introduce a separately reviewed
port rather than truncating the UI's arrays.

HTTP adapter uses session + `X-CRM-ORG` and the existing handler wrapper, wire
error `{code,details,message,status:"error"}`, safe error mapping and client
fetch wrapper. 401 remains authentication failure, 403 action denial, 404 absent
or inaccessible resource, 400 validation and 500 safe unexpected failure.
An empty accessible folder returns 200 `{data:[]}`; a missing/inaccessible folder
returns 404, not a misleading empty list. The adapter must not turn network,
permission or malformed-response failures into empty arrays/undefined.
Screens consume injected ports/hooks; fetch paths live only in the HTTP adapter.
Capability/UI gates and query cache keys include org and current user; clear
cached trees/items on identity/org change and invalidate after permission
changes. Do not reuse an authorized response between different actors.

## 6. Decision gates, consequences and verification

Dedicated storage adds a permission resolver, version lifecycle and reference
coordinator. Shared private blobs avoid requiring another storage deployment;
actual storage use depends on version/retention policy and is unmeasured.
The fixture remains a read-only UI implementation until separate write slices
receive accepted contracts. This draft does not authorize changes to specs,
existing read-port code, record recovery or storage adapters.

| Open gate | Reviewer / decision owner |
| --- | --- |
| §1 separate service/tables, shared blob catalogue and physical keys/RLS; reconcile pending ADR 0002 | Platform Lead → CTO |
| U2 group/role precedence, restricted inheritance, last Admin, CRM capability mapping and lock glyph meaning | Platform Lead + UI Lead → CTO; glyph needs safe evidence |
| U1/U4/U7 names, collisions, move grants and transaction scope | Platform Lead + UI Lead → CTO |
| U3/U5 upload/preview budgets and allowed types; no generic plan ceiling inferred | Platform Lead + UI Lead; CTO accepts policy changes |
| U6 checkout authority, version retention/numbering, native editor scope | Platform Lead → CTO |
| U8 ordinary Trash / Deleted Items policy, restore conflicts, shared-byte retention and purge schedule | Platform Lead → CTO |
| U9 external links/expiry/revocation and sharing adapter scope | Platform Lead + UI Lead → CTO |
| U10/U11 Name comparator, optional port capabilities, Details and unseen UI states | Platform Lead + UI Lead → CTO contract decision |
| U12 pinned reference vs copy/latest, current picker identity and unavailable link behavior | Platform Lead + UI Lead → CTO; remain disconnected pending acceptance |
| U13 exact messages and empty/loading/error screens | UI Lead; no fabricated reference wording |

Documentation validation: source paths and current port checked, metadata flags
re-read, key/FK sketch reviewed for tenant boundaries, `git diff --check` and
repository terminology/privacy checks. No runtime changed, so application unit,
UI e2e and database suites are not evidence for this draft and are not run.
Before handoff, merge current `origin/main` and recheck source/port consistency.

Future implementation acceptance must test two tenants and two actors in one
tenant; owner-only My projection and owner transfer; membership revocation and
restricted descendants; counts/list/detail/download policy consistency; no
storage-key exposure; source/destination move checks and cycles; concurrent
name/version/checkout conflicts; graph rollback and restore/purge races;
attachment pin/revoke/delete interactions; retained shared-blob cleanup; missing
versus empty and network failure mappings; both sort directions/ties; fixture/HTTP
port round trips and permission checks before pagination. Those tests belong to
approved implementation slices, not to this documentation-only issue.
