# ADR 0002 — Record storage, metadata model and tenant isolation

- Status: Proposed — measurements complete (MEP-50, MEP-96, MEP-103) and both reviews worked in (MEP-101, MEP-104). Two measurement expectations failed; "Outcome" says which and what this revision changes. Acceptance waits for the final independent review of that outcome
- Date: 2026-10-04, revised 2026-10-12
- Decider: CTO
- Issue: MEP-40

## Context

ADR 0001 §5 fixed the rules (metadata is data, one write path, events before automation, compiled queries) and left the physical model open. This ADR decides it. Every Leads implementation issue depends on it.

Facts from the metadata export (audited in MEP-15):

- 42 modules, about 1,050 fields, 27 field types. Core modules have 20 to 61 fields (Leads 56, Contacts 61, Accounts 51, Deals 29).
- The setup is close to the reference CRM defaults: one custom field in the core modules, one layout per module. Runtime extensibility is required by the Phase 3 exit criterion (customization recreated **without code changes**), not by today's data.
- Most fields are plain scalars. 212 fields are lookups, 76 are owner lookups; 23 are multi-module lookups, 20 formulas, 4 subforms.
- All 42 currency fields declare 16 digits; 18 of them declare 2 decimal places and 24 declare 9. Decimal fields declare up to 9 decimal places.
- Two picklists are large and shared by every address field of every module: country (248 values) and state (about 4,000). The link between a country and its states is shared too.
- Missing from the export: view criteria and columns, the profile permission matrix, the pipeline definition. They come from screen research.

Already decided elsewhere:

- Screens reach records through the record service port (`packages/core/src/records/contract.ts`, MEP-68). It is independent of storage; this ADR decides the database adapter behind it.
- Paths, paging (`page`, `per_page`, a separate count request) and wire shapes are ADR 0004.

Volume assumption: one organization, up to 200,000 records in the largest module, a handful of concurrent users. The model must not break at ten times that, but is not tuned for it.

## Decision

### 1. Record storage: one table, a JSONB document, typed system columns

All records of all modules live in one table. Values every record has are typed columns; everything defined by metadata lives in one JSONB document, which is the only source of truth for field values.

```sql
create table records (
  organization_id uuid not null,
  id              uuid not null default uuidv7(),
  module_id       uuid not null,
  owner_id        uuid,
  created_by      uuid not null,
  updated_by      uuid not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  deleted_by      uuid,
  deleted_with    uuid,          -- the record whose deletion removed this one (§4)
  version         integer not null default 1,
  name            text not null default '',
  data            jsonb not null default '{}',
  -- index slots, see §8: derived from data by the write path
  ix_text_1 text collate "und-x-icu",  -- … ix_text_8
  ix_num_1  bigint,                    -- … ix_num_4
  ix_time_1 timestamptz,               -- … ix_time_4
  ix_ref_1  uuid,                      -- … ix_ref_4
  primary key (organization_id, id),
  foreign key (organization_id, module_id) references modules (organization_id, id)
);
```

- **Keys.** The primary key of every organization-owned table that has an `id` is `(organization_id, id)`; relation tables (`record_links`, later `record_unique_values`) have a composite key that starts with `organization_id`. Every foreign key between such tables is composite and starts with `organization_id`. A row cannot reference another organization's row, and no unique constraint spans organizations (§5).
- `data` is keyed by the field's **storage key**: immutable, `[a-z][a-z0-9_]*`, unique per module, assigned when the field is created. The API name and the label stay editable metadata; renaming never rewrites records.
- Empty values are absent from the document. There is one representation of "no value".
- `name` is the record's display name, derived by the write path from the module's display field (for Leads: first and last name). Lookups and related lists read it without touching the document.
- Each field's metadata says where its value lives: `column` (system column), `document` (key in `data`) or `computed` (derived on read, never stored). The reference CRM's owner, created/modified by, created/modified time and id fields map to system columns.

Value formats inside the document:

| Kind | Format | Compared as |
| --- | --- | --- |
| Text-like | JSON string | `(data->>'k') collate "und-x-icu"` |
| Integer | JSON number, at most 15 digits | `(data->>'k')::numeric` |
| Decimal, currency | JSON string of canonical decimal text (optional sign, digits, the field's decimal places, no exponent) | `(data->>'k')::numeric` |
| Long integer | JSON string of digits (the port keeps it lossless) | text equality |
| Boolean | JSON boolean | `(data->>'k')` |
| Date | `YYYY-MM-DD` | `(data->>'k') collate "C"` |
| Date-time | UTC, fixed width `YYYY-MM-DDTHH:MM:SS.sssZ` | `(data->>'k') collate "C"` |
| Picklist | the value's immutable `value` string | text equality |
| Lookup, user | UUID string | text equality |

- **Decimal and currency values are exact end to end:** text in the document, `numeric` in SQL, a scaled integer in the index slot (§8), a decimal string in the port. They are never held as binary floating point. A `double precision` value cannot hold the 16 digits plus decimal places the export declares, and report totals must not drift.
- **No rounding anywhere.** A written value with more decimal places than the field declares, or more digits than it allows, is rejected; `-0` is stored as `0`. A filter threshold is parsed as an exact decimal and scaled like the slot (§8). If it has more decimal places than the field, equality matches nothing, `>` and `>=` compare with `>=` against the ceiling of the scaled threshold, and `<` and `<=` with `<=` against its floor. A threshold outside the `bigint` range compiles to a constant true or false, never to an overflow error. MEP-103 checked every operator against the exact `numeric` comparison at negative, zero, 18-digit and out-of-range thresholds.
- The port changes accordingly in the first engine issue: decimal and currency values become decimal strings, as long integers already are; integers stay numbers. Whether the wire carries them as JSON numbers, as the reference does, is settled under ADR 0004; storage and port are exact either way.
- The export's `length` of a numeric field does not say whether it counts the decimal places, and some system fields declare 50. Validation reads digits and decimal places from metadata; which digits `length` counts is an open question for the form research and a single validation rule.
- Date and date-time values are compared as text inside the document on purpose: a fixed-width UTC string sorts chronologically, while a cast to `timestamptz` is not immutable.

### 2. Metadata tables

All are organization-scoped rows protected by row-level security (§5). Standard and custom definitions live in the same tables.

| Table | Holds |
| --- | --- |
| `modules` | API name, labels, kind (`standard`, `custom`, `system`), display field, order, visibility, metadata version (§8) |
| `fields` | module, API name, storage key, label, type, storage (`column`, `document`, `computed`), required, read-only, unique, length, decimal places, default, picklist reference, controlling field, type options (JSONB), flags (sortable, filterable, searchable), index slot and its state (§8), custom flag |
| `picklists` | a value set, either owned by one field or shared (key, for example `country`, `state`) |
| `picklist_values` | set, immutable `value`, editable label, order, colour, active, record category (nullable) |
| `picklist_dependencies` | parent set and value, child set and value: which child values a parent value allows |
| `layouts`, `layout_sections`, `layout_fields` | layout per module; sections (label, columns, order); field placement with per-layout required, read-only and default |
| `related_lists` | module, related module, linking field, kind, label, order, visible columns |
| `views` | module, name, kind (`system`, `shared`, `personal`), owner, criteria (JSONB), columns, sort, default flag |

- **Unique keys.** `modules`: `(organization_id, api_name)`. `fields`: `(organization_id, module_id, api_name)`, `(organization_id, module_id, storage_key)` and, where a slot is set, `(organization_id, module_id, index_slot)`.
- **Shared sets.** A field references a set. Country and state are two shared sets, stored once per organization and referenced by every address field of every module; their dependency is one set of `picklist_dependencies` rows. A dependent field names its controlling field; the allowed values come from the dependency between the two sets.
- **View criteria** are stored as authored, in the port's `Criteria` shape (MEP-98). A criterion on a record category is stored as the category, never as the values it expands to today; the compiler expands it from `picklist_values` when the query runs. Adding a value to a category then changes the view without rewriting it.

Seeding:

- A converter script reads the export from a directory given by an environment variable and writes seed files in **our** format into `packages/core/seed/`: one file per module and one per shared picklist set. Source identifiers, timestamps and everything outside our model are dropped; the export itself is never committed.
- A value the repository's name rule rejects is left out by the converter and listed in its output; the board decides its replacement.
- Seed files are applied per organization through a metadata service (on organization creation, and by a command for existing organizations). The apply step is idempotent and only inserts what is missing; it never overwrites a customized row.
- Only the modules of the current delivery module are seeded. Module 1 seeds Leads and the shared sets it uses.
- View criteria and columns are not in the export; view seeds are written from the list-view spec.

### 3. Field types

Our type names are neutral; the converter maps export types to them.

| Export type (count) | Our type | Storage | Validation | Queries | Module 1 |
| --- | --- | --- | --- | --- | --- |
| text (141) | `text` | string | length, trim | equals, contains, starts with, empty, sort | Yes |
| textarea (64) | `textarea` | string | length | empty | Yes |
| email (13) | `email` | string | length | as text | Yes |
| phone (10) | `phone` | string | length | as text | Yes |
| website (4) | `url` | string | length | as text | Yes |
| picklist (105) | `picklist` | value string | active value of the field's set; allowed by the controlling value | is, in, category, empty, sort | Yes |
| boolean (25) | `boolean` | boolean | type | is | Yes |
| integer (47) | `integer` | number | integer, digits (at most 15) | comparison, between, sort | Yes |
| double (46) | `decimal` | decimal string | digits, decimal places | comparison, between, sort | Yes |
| currency (42) | `currency` | decimal string, in the organization's base currency | as decimal | as decimal | Yes |
| date (16) | `date` | string | calendar date | on, before, after, between, sort | Yes |
| datetime (118) | `datetime` | string; created and modified time are system columns | instant | as date | Yes |
| ownerlookup (76) | `owner` | system columns `owner_id`, `created_by`, `updated_by` | active member of the organization | is, in, sort by name | Yes |
| bigint (51) | `long` | system column `id` for the record id; otherwise a string of digits | digits | is | Yes (id only) |
| lookup (212) | `lookup` | UUID string plus a link row (§4) | target exists, same organization, right module | is, empty, sort by target name | With Contacts |
| userlookup (6) | `user` | UUID string | active member | is, in | Deferred |
| multiselectpicklist (1) | `multi_picklist` | array of value strings | each value in the set | contains any, contains all | Deferred |
| autonumber (5) | `autonumber` | string, assigned by the write path from a per-field counter row | read-only | as text | Deferred |
| formula (20) | `formula` | computed | expression parser | — | Phase 3 |
| multi_module_lookup (23) | `multi_lookup` | module and UUID plus a link row | as lookup | is | With Activities |
| module (4) | `module_ref` | module API name | known module | is | With Activities |
| multireminder (2), RRULE (2), ALARM (1) | structured activity values | JSON object | per type | none | With Activities |
| subform (4) | `subform` | child records in their own module, linked to the parent | per child field | through the child module | With the inventory modules |
| linetax (4) | inventory tax lines | — | — | — | With the inventory modules |
| profileimage (5) | `image` | file reference | type, size | none | With attachments |

- Validation follows what was observed. Format rules for email, phone and URL values are added only when a spec shows them (the port's fixture has none).
- The operator set per type is the ceiling the compiler supports; which comparators a screen offers comes from the view criteria contract (MEP-98) and the filter spec.
- Not field types but present on Leads: tags (a text field holding an array), the composite address and coordinates fields, and the conversion lookups. They are decided with their feature specs.

### 4. Relations

- **Owner and audit users** are system columns referencing `users`. Users are deactivated, never deleted, so these references never dangle.
- **Lookups** store the target id in the document and one link row, written in the same transaction:

```sql
create table record_links (
  organization_id  uuid not null,
  source_record_id uuid not null,
  field_id         uuid not null,
  target_record_id uuid not null,
  primary key (organization_id, source_record_id, field_id, target_record_id),
  foreign key (organization_id, source_record_id) references records (organization_id, id) on delete cascade,
  foreign key (organization_id, target_record_id) references records (organization_id, id) on delete restrict,
  foreign key (organization_id, field_id)         references fields  (organization_id, id) on delete cascade
);
```

- The database guarantees that source, target and field belong to the link's organization. That the field belongs to the source record's module and the target to the field's target module is the write path's check: it resolves a lookup field only through the source record's module metadata. Its tests run a consistency query (links joined to records and fields) that must find no mismatch. A database constraint for it would cost a second unique index on `records`; not added.
- A related list is one query on `(organization_id, target_record_id, field_id)`, joined to the source records with `deleted_at is null`. `uuid` equality stays an index condition under row-level security (§8).
- **Lifecycle.** Each operation is one write-path transaction with its events.

| Operation | Records and links |
| --- | --- |
| Delete (soft, §9) | Sets `deleted_at`. Outgoing and incoming links stay, so a restore brings relations back. Related lists and lookup pickers leave out deleted records. A lookup whose target is in the recycle bin keeps its value; how the reference shows it is researched with Contacts, the first lookup scope. |
| Restore | Clears `deleted_at`. Links are intact. |
| Purge | First clears every lookup that points at the record, in live **and** deleted sources: document key, slot value and link row, with a `record.updated` event per source. Then deletes the row; its outgoing links cascade. The restricting foreign key is the safety net: a purge that missed a source fails as a whole. |

- **Child records.** Deleting a record also deletes its child records (notes, open and closed activities; public documentation, `research/specs/leads-write-behaviour.md` A1). The lookup that makes a module a child is flagged in its field metadata. A delete issues a delete command for every live child in the same transaction, each with its own event and the same correlation id, and sets the child's `deleted_with` to the parent's id. Whether restoring the parent restores them is open in that spec; `deleted_with` identifies exactly the rows that one deletion removed, so either answer is one statement. This lands with the first child module.
- **Deleting a field** (Phase 3) is a metadata-service operation in the write path's terms: it removes the document key and the slot value of every record of the module and releases the slot (§8) before the field row goes; the cascade on `record_links.field_id` only removes the links.
- **Uniqueness** of a field value cannot be a constraint on a JSONB key without runtime DDL. When the first unique field is in scope, `record_unique_values (organization_id, field_id, value, record_id)` with primary key `(organization_id, field_id, value)` and composite foreign keys to the field and the record enforces it; the adapter raises the port's `ConflictError`, and the contract suite gains the rejection test. Delete removes the record's rows, so the value is free again; restore re-inserts them and fails with `ConflictError` if the value was taken meanwhile; purge has nothing left to do. Whether the reference's recycle bin keeps a value reserved is checked with the first unique field; it only changes whether delete removes the rows. No Leads field is unique in the export, so this is deferred.

### 5. Tenant isolation

Row-level security is enabled on every CRM table: the metadata tables, `records`, `record_links`, `events`.

```sql
create function current_org_id() returns uuid
  language sql stable
  return nullif(current_setting('app.org_id', true), '')::uuid;

alter table records enable row level security;
create policy org_isolation on records
  using (organization_id = (select current_org_id()))
  with check (organization_id = (select current_org_id()));
```

- **Fail closed.** With no setting the function returns null and the policy matches nothing; inserts fail the check. Measured for the document and the typed model: no rows without the setting; another organization's row cannot be read, updated or inserted.
- **What the policy guarantees, and what it does not.** `app.org_id` is a setting, not a credential: any SQL running as `crm_app` can call `set_config` and name another organization. Row-level security therefore protects against a statement inside `withOrg` that forgets the organization predicate or gets it wrong, which is the defect a compiler or a repository can have. It does **not** protect against arbitrary SQL executed as `crm_app`. That is prevented one layer up: values are bind parameters, identifiers come only from metadata through one quoting function (§8), and no code path executes SQL text taken from a request. The compiler's tests feed it hostile field names, sort keys and filter values.
- A context the runtime role cannot forge is not built now (see Alternatives). Policies call only `current_org_id()`, so a stronger mechanism later replaces one function body, not the tables or the queries. It must be decided before any feature runs user-authored expressions in the database (formula fields, report expressions) and before organizations that do not trust each other share a deployment.
- **`withOrg(ctx, fn)`** in `@crm/core` (it exists since the skeleton) is the only way to run CRM SQL. It opens a transaction, runs `select set_config('app.org_id', $1, true)` and passes a transaction handle of a distinct type to `fn`. Repositories accept only that type, so CRM SQL outside `withOrg` does not compile. The setting is transaction-local.
- **Setting hygiene, tested.** A repository test fails if `app.org_id` or `set_config` appears outside the tenancy module. A pool test sets a session-level value for another organization on a connection, returns it to the pool and checks that `withOrg` on that connection sees only its own organization, and that after commit and after rollback the transaction's value is gone. A stale session value cannot reach CRM SQL, because every `withOrg` transaction sets its own value first.
- **Compiled queries still filter by `organization_id` explicitly.** RLS is the second line of defence, not the query's only predicate.
- **Roles.**

| Role | Used by | Rights |
| --- | --- | --- |
| `crm_owner` | migration runner, maintenance commands | owns all objects; DDL |
| `crm_app` | CRM SQL inside `withOrg`, and tests (`DATABASE_URL`) | no superuser, no `BYPASSRLS`, owns nothing; explicit DML grants per CRM table, written in the migration that creates the table; `events` is insert and select only. On identity and tenancy tables: `select` on the display columns of `users` and on `memberships`, both behind a policy bound to the current organization; nothing on sessions, credentials, verification or invitation tokens |
| `crm_auth` | the authentication library and the lookups that run before an organization context exists | identity and tenancy tables only; no CRM table |

- The migration runner connects with `DATABASE_MIGRATION_URL`, the authentication side with its own URL. `pnpm dev` and the test harness create the roles in the embedded cluster; its superuser is used only for that.
- **Startup guard.** On first use `@crm/core` checks that the connected role is not a superuser, has no `BYPASSRLS` and does not own `records`, and refuses to run otherwise. This is why RLS is not `FORCE`d: the guard covers the superuser case that `FORCE` cannot, and migrations keep working as the owner.
- **Catalog test.** An integration test reads the catalog and fails if any table with an `organization_id` column lacks RLS or the standard policy for `crm_app`, or if `crm_app` holds a grant on a credential table. A new table cannot forget it.
- **Constraint checks run outside the policy:** PostgreSQL checks foreign and unique keys without row security. Because every key starts with `organization_id` and `with check` pins that column to the caller's organization, a probe with another organization's id fails exactly like a missing id. The adapter maps constraint errors to the port's errors and never passes the database message or its key values to the client. Probe tests: from one organization, reference another organization's record, field and module ids and, later, its unique values; each must be indistinguishable from "not found".
- **No `SECURITY DEFINER` functions and no views over CRM tables** without an ADR: both run with their owner's rights and would bypass the policy.
- Identity and tenancy tables (`users`, `sessions`, `organizations`, `memberships`, `invitations`) are read before an organization context exists; that side stays under service-level isolation (ADR 0001 §3) and runs as `crm_auth`.
- The Phase 4 worker reads events of all organizations; it gets its own role and policy in the job-queue ADR.

**What RLS costs (measured).** A query that keeps its plan pays nothing measurable: with the policy on, the same plan and buffer count ran within 3 % in the typed model and within the run-to-run noise in the document model. The cost is in the planner. In the measured setup (PostgreSQL 18.4, the policy and the role above), a predicate whose operator function is not marked leakproof was never chosen as an index condition and was estimated without the column's statistics; it ran as a filter above the policy. Flags read from the catalog: leakproof — equality and ordering on `text`, `uuid`, `timestamptz`, `boolean`; not leakproof — every `jsonb` operator (`->`, `->>`, `@>`), `ILIKE`, full-text `@@`, and `numeric` comparison. The flags of `bigint` comparison are reported by MEP-96. §8 is built on this observation.

### 6. Write path

One function in `@crm/core` changes records. The database adapter of the record service port calls it for `create`, `update` and `delete`; import and automation will call it too. Nothing else writes `records`.

```ts
type RecordCommand =
  | { op: "create"; module: string; values: Record<string, unknown> }
  | { op: "update"; module: string; id: string; values: Record<string, unknown>; expectedVersion?: number }
  | { op: "delete"; module: string; id: string }
  | { op: "restore"; module: string; id: string };

writeRecords(
  ctx: OrgContext,
  commands: RecordCommand[],
  options: { source: "ui" | "api" | "import" | "automation" | "system"; correlationId?: string },
): Promise<RecordResult[]>;
```

Inside one `withOrg` transaction, all or nothing:

1. Take a shared lock on the module's row (`select … from modules … for key share`) and load the module's metadata. The lock is the barrier for slot changes (§8). Metadata is read after the lock is held; a cached copy may be used only if its `metadata_version` equals the locked row's. A transaction that touches several modules or records locks module rows in id order, then record rows in id order. Measured cost of the lock: none outside the noise (insert p95 5.74 ms with it, 5.08 ms without; update 3.93 and 4.00 ms).
2. Normalize and validate `values` (keyed by API name) against it: unknown, read-only and computed fields are rejected; type, required, length and picklist membership are checked. Errors are returned per field API name, as the port's `ValidationError` requires.
3. Authorize through one hook, `authorize(ctx, action, module, record)`. Module 1 checks membership; profiles and sharing rules replace the hook body later.
4. Write the row. An update merges the patch into `data` and removes emptied keys. Every command bumps `version` by one; an update fails with a conflict if `expectedVersion` does not match.
5. Maintain `name`, the index slots and `record_links`.
6. Append one event per changed record.

- **Port mapping.** `create` and `update` are one command each. `delete(module, ids)` is one call with a delete command per id. A call is atomic: if any command fails (unknown or already deleted id, validation, authorization, version conflict), nothing is written and the error names the command's index and, for validation, the field API names. The port's bulk delete therefore deletes all ids or none, as its contract suite expects.
- `expectedVersion` is not in the port yet; it is added to the port when the edit form spec needs it.

### 7. Events

```sql
create table events (
  organization_id uuid not null,
  id              uuid not null default uuidv7(),
  type            text not null,   -- record.created | record.updated | record.deleted | record.restored | record.purged
  module_id       uuid not null,
  record_id       uuid not null,
  record_version  integer not null,
  actor_id        uuid,            -- null for system
  source          text not null,
  correlation_id  uuid not null,
  occurred_at     timestamptz not null default now(),
  payload         jsonb not null,  -- { v: 1, changes: { <storage key>: { from, to } } }
  primary key (organization_id, id)
);
```

- Append-only: the runtime role cannot update or delete events.
- **Payload by type.** Created: every stored key, with `from: null`. Updated: the changed keys. Deleted and restored: no changes; the row stays readable by id. Purged: the last `name` only.
- **Order.** `record_version` is the record's `version` after the change. Versions of one record increase by one without gaps, so a consumer orders one record's events, and detects a missing one, by `(record_id, record_version)`. There is no total order across records: neither the UUIDv7 id nor a sequence is in commit order.
- **Delivery** is at least once; the event `id` is the consumer's idempotency key. Delivery state (claimed, done, attempts, next retry) lives in a separate table per consumer, decided with the job queue in Phase 4, so this table stays append-only. Consumers claim rows; they do not page by id.
- `correlation_id` groups the events of one request or bulk operation; automation uses it later to stop loops.
- **Record history.** The events are the stored history of a record: the Timeline reads them by `(organization_id, record_id, record_version)`. The port member and which events the Timeline shows, and how, follow the Timeline spec (MEP-159); nothing else stores history.
- An idempotency key for retried commands (import, public API) is decided with the first caller that retries (Phase 2).

### 8. Query compiler and indexes

`compileListQuery(metadata, view, query)` turns the port's `ListQuery` (view, page, page size, sort, extra filters, search) into one parameterized statement; `count` compiles the same predicate into a count.

- Field names are resolved through metadata to a system column, an index slot or a storage key. Storage keys reach the SQL text through one quoting function and only from metadata; values are always bind parameters.
- Each field type has a fixed operator set (§3). Relative date operators and record categories are resolved before compilation.
- Every statement filters by `organization_id`, `module_id` and `deleted_at is null`, and appends `id` in the direction of the sort so that order is total.
- **Null placement is always explicit** (`nulls first` or `nulls last`), never the PostgreSQL default, which differs by direction. Where empty values go is one compiler setting per direction. The port's interim rule (empty last in both directions) holds until the list research settles the reference's rule.
- Text sorts by the ICU root collation; the port fixture's interim rule (lower-case code-unit order) is replaced by it, and the contract suite is aligned in the compiler issue.
- **Paging** is by page number, as the port and ADR 0004 require: `limit perPage + 1 offset (page − 1) × perPage`; the extra row answers `moreRecords`. The cost grows with the offset. The list target holds up to offset 5,000 (page 100 at 50 rows); deeper pages are outside it, with the measured figures in "Outcome". A keyset form is kept inside the compiler for export and bulk iteration, never on the wire (measured: 2.65 ms p95 for page 100).
- **Keys first.** A statement whose page the index scan cannot deliver directly, because it skips rows or has to sort the matching set, is compiled in two steps inside one statement: a materialized CTE selects only `id` and the sort key for the page, then the rows are read by primary key. Carrying whole rows through the sort was the cost: a sort of 19,800 matches 167 → 6.95 ms p95, offset 5,000 over 13,000 matches 164 → 59 ms.
- **Count** is the separate request of ADR 0004 and is exact.

**Index slots.** Under row-level security no predicate on the document was used as an index condition (§5), so expression and GIN indexes on `data` are not created. Fields that must be fast are projected instead:

- `records` carries a fixed set of typed slot columns: 8 `text`, 4 `bigint`, 4 `timestamptz`, 4 `uuid`. Each has one index `(organization_id, module_id, <slot>, id) where deleted_at is null`, created by the migration. There is no DDL after migration. The index includes empty values: with indexes restricted to non-empty values the plain sorts lost the index order (first page 158 ms p95 against 1.6 ms), although those indexes are 3.3 times smaller and writes log 42 KB instead of 104 KB.
- `fields.index_slot` assigns a field of a module to a free slot of its kind: text-like and picklist to `text`; date (as UTC midnight) and date-time to `timestamptz`; lookup and user to `uuid`; integer, decimal and currency to `bigint`. Booleans are not projected.
- **Number slots are exact.** The slot holds the value multiplied by ten to the power of the field's decimal places, which preserves order and equality. A field takes a number slot only if its digits before the decimal point plus its decimal places are at most 18. A wider field is filtered and sorted from the document with an exact `numeric` cast, as a scan.
- The write path fills the slot from the document in the same statement. The document stays the source of truth: slots are never read for display and can be rebuilt.
- Predicates and sort keys on a slot use only leakproof operators on the plain column, so they are index conditions under RLS (measured for `text`, `uuid`, `timestamptz` and `bigint`; the catalog marks all five `bigint` comparison operators leakproof). An integration test runs the compiled statements as `crm_app` and fails if a slot filter has no index condition on the slot, if a plain sort on a slot does not read the slot index in order, or if a related list does not use the link index.
- **Both directions from one index.** A slot index is ascending with nulls last. It serves `asc nulls last` forwards and `desc nulls first` backwards. For the other two orders the compiler emits two branches over the same index, the non-empty range in the wanted direction and the empty range by `id`, each limited to `offset + perPage + 1`, concatenated in the wanted order. No second index per slot. Measured: first pages 2.9 ms p95 (the same order written as one statement sorts the module: 177 to 182 ms), offset 5,000 58 to 61 ms. The form does not hold at depth: at offset 120,000 both branches fetch and sort that many whole rows (1.4 to 1.7 s). See "Outcome".
- **Shared statistics.** A slot column holds different fields in different modules, so its column statistics mix them. Measured with four value distributions in one slot: row estimates were off by up to 14 times. The migration creates extended statistics (`mcv`) on `(module_id, <slot>)` for every slot; with them the worst measured case fell from 10.7 to 0.74 ms p95. One estimate stayed 20 times off at under 1 ms; estimates are not a correctness matter.

**Slot lifecycle.** A field's `index_state` is `none`, `backfilling`, `ready` or `clearing`. Only the metadata service changes it:

1. *Assign.* Under the module's exclusive lock (`select … from modules … for update`): set `index_slot` to a free slot of the field's kind and the state to `backfilling`, and bump `modules.metadata_version`. Writers hold the shared lock on the same row for their whole transaction (§6), so the change waits for writes in flight, and every later write sees the assignment and fills the slot.
2. *Backfill.* A maintenance command updates the module's rows in batches. Each statement computes the slot from the row's current `data`, so it cannot store a value older than the row.
3. *Verify.* One statement counts the rows whose slot `is distinct from` the expression over `data` (a plain `<>` would not count an empty slot). It runs without the lock: every write since step 1 fills the slot from the row it writes, so only rows the backfill missed can differ. When it returns zero, the state is set to `ready` and `metadata_version` bumped under the exclusive lock. Measured with a concurrent writer at 28 writes per second: backfill of 200,000 rows in 105 s and 2.9 GB of log, verify 3.8 s, no mismatch; 200 rows corrupted on purpose (half emptied, half wrong) were counted exactly, and none after repair.
4. The compiler uses a slot only in `ready`. In every other state, and for every field without a slot, it compiles to the document expression.
5. *Release* (field deleted, or its index dropped): the state becomes `clearing` under the exclusive lock; the compiler stops using the slot and writers store null in it. A command nulls the column for the module and verifies. Then the slot is free. A slot is assigned only when free.

**Who gets a slot.** The seed assigns slots to the fields that system views filter and sort on. In Phase 3 the customization flow assigns one when an administrator asks for it or a saved view filters or sorts on the field; when no slot of the kind is free the field stays unindexed (the screen rule comes with the customization spec). If a module needs more indexed fields than slots, the slot count is raised by a migration (a nullable column and its index, no table rewrite). If that stops scaling, the side table in Alternatives is the next mechanism. Slots are derived data, so neither change touches the documents.

A filter or sort on a field without a ready slot scans the module's rows: 57 to 183 ms median at 200,000 records. That is over the 100 ms list target; the target applies to slot fields.

**Aggregates** group and filter on slot columns where the fields have slots, and sum the scaled integer exactly. Measured for the 12-month report: 32 and 38 ms p95, against 100 and 130 ms on document expressions and 57 and 82 ms on typed columns.

**Search** is not decided here. The reference's Leads list shows no record search of its own, and the global search is not specified yet. Until it is, the port's interim search compiles to `ILIKE` over the document values of its four fields and scans the module's rows. Measured on a prepared search text without an index: 0.5 to 1.9 s for a rare term at 200,000 records. No search column and no search index are created.

- **Exception to the targets, stated as one:** no measured model meets the 150 ms search target under RLS. The target is suspended, not dropped, until the search decision; the interim search is correct and slow.
- What was measured: under the policy of §5 the trigram and full-text indexes were not used, in the document and in the typed model alike, because their operators are not leakproof. That does not rule out every search index. The candidate to measure with the search spec is a token table derived by the write path and queried with `text` equality and prefix ranges, which are leakproof.
- Nothing in §1–§7 stands in its way: the write path already derives data in the same transaction, and `fields.searchable` (carried over from the export) selects the fields.

### 9. Identifiers, audit fields, soft delete

- Record ids are UUIDv7 (ADR 0001) and opaque to the port. The reference CRM's numeric ids are not reproduced.
- `created_by`, `updated_by`, `created_at`, `updated_at` are set by the write path only; callers cannot supply them.
- `version` gives optimistic concurrency for edit forms and orders a record's events (§7).
- **Soft delete is required:** the reference CRM has a recycle bin from which records are restored. Delete sets `deleted_at` and `deleted_by` (and `deleted_with` on child records, §4); indexes used by lists are partial on `deleted_at is null`. A deleted record stays 60 days and is then purged (public documentation, `research/specs/leads-write-behaviour.md` A1). The purge needs the Phase 4 worker; its steps are in §4. Who may see and empty the recycle bin belongs to the permissions ADR.

### 10. User preferences

Display preferences that must follow the user across browsers (hidden rail, rows per page, text wrap) are not records: no events, no version, no recycle bin.

```sql
create table user_preferences (
  organization_id uuid not null,
  user_id         uuid not null,
  key             text not null,
  value           jsonb not null,
  updated_at      timestamptz not null default now(),
  primary key (organization_id, user_id, key)
);
```

- Row-level security as in §5; the service reads and writes only the current member's rows. Keys are namespaced strings defined in code, not metadata.
- The port member is added with the first screen that moves a preference off browser storage.

## Measurement

Script and full results: `scripts/bench/` and `scripts/bench/results/record-storage.md` (MEP-50, reviewed in MEP-62). Embedded PostgreSQL 18.4, default settings, 8 CPUs, synthetic data: 200,000 records of a 46-field module in the measured organization, 50,000 of the same module in a second organization and 50,000 of a second module. 5 warm-up and 30 measured runs per query, 2,000 writes of each kind. Times are client-side.

Options: **A** the document model of §1 (A0 system indexes only; A3 adds an expression index and expression statistics per filtered or sorted field); **B** one typed table per module with an index per field; **C** entity-attribute-value rows. The index slots (**A4b**: the model of §1 and §8 with exact `bigint` number slots) and the side table of indexed values (**A5**) were measured afterwards on the same data and protocol: `scripts/bench/results/record-storage-slots.md` (MEP-96) and `record-storage-slots-2.md` (MEP-103).

Targets, fixed before measuring (p95):

| Scenario | Target |
| --- | --- |
| Filtered and sorted list page | 100 ms |
| Text search | 150 ms |
| Single record read | 5 ms |
| Single record write with its event | 15 ms |
| Grouped aggregate over 12 months (report) | 1 s |
| Row-level security overhead | 10 % |

Decision rule, fixed before measuring: the document model stands if it meets the targets with generic or per-field indexes. If it misses a list target by more than three times even with per-field indexes, the storage decision is reopened.

### Results without row-level security

Median / p95 in ms.

| Scenario | A3 | B | C |
| --- | --- | --- | --- |
| Default list, newest first | 0.40 / 0.43 | 0.31 / 0.66 | 3.35 / 3.43 |
| Picklist filter, text sort, first page | 2.00 / 3.69 | 1.31 / 2.85 | 209 / 2085 |
| Same, page 100 by keyset | 2.00 / 3.61 | 1.04 / 2.36 | 280 / 392 |
| Same, page 101 by offset 5,000 | 105 / 142 | 61 / 76 | 229 / 590 |
| Owner, date range and number filter | 5.55 / 14.4 | 5.66 / 14.5 | 28.0 / 33.3 |
| Boolean filter matching 90 %, text sort | 0.40 / 0.48 | 0.32 / 0.34 | 179 / 265 |
| Three-field filter, 73 rows | 2.38 / 5.11 | 1.31 / 1.39 | 13.4 / 17.3 |
| Related list by lookup | 0.71 / 1.06 | 0.25 / 0.34 | 5.72 / 11.2 |
| Count, 13,000 matches | 30.5 / 49.9 | 29.2 / 37.5 | 31.0 / 62.5 |
| Count, 177,000 matches | 124 / 151 | 84 / 234 | 571 / 1473 |
| Single record read | 0.44 / 0.87 | 0.44 / 0.64 | 1.48 / 2.45 |
| Insert with event | 1.20 / 2.45 | 0.70 / 1.08 | 20.4 / 44.2 |
| Update one field with event | 1.13 / 2.48 | 0.66 / 0.97 | 1.26 / 2.20 |
| Report, 12 months by one field | 105 to 272 / 162 to 441 | 63 / 89 | 149 / 706 |
| Substring search, rare term, trigram index | 3.29 / 3.36 | 2.20 / 2.28 | 6.55 / 6.68 |

- With an index per field, A and B meet every target except one: the page at offset 5,000 in A (p95 142 ms against 100; B 76 ms). B is up to 2.8 times faster on lists and 1.7 to 4.3 times on the report. C misses the insert target and has list medians of 180 to 280 ms.
- A0, with no per-field index, runs the filtered lists in 49 to 376 ms (sorting 177,000 rows by a document field is the worst case). Per-field access paths are needed at this volume.
- A needs expression statistics: with the indexes but without them, the planner walked the wrong index (first page 98 ms, the 90 % boolean case 1,234 ms).
- The report spread in A (105 to 272 ms on one plan and one buffer count) is unexplained. All values are inside the target.
- Size: `records` in A is 501 MB; the two typed tables in B are 329 MB; C is 825 MB of tables and 2.1 GB of indexes. The GIN index on the document is 249 MB and raises write-ahead log per insert from 17 KB to 64 KB.
- In B, adding a column took 1.5 ms and building an index concurrently 0.4 s. B is not rejected for the cost of DDL (see Alternatives).

### Results with row-level security

Run as a role that neither owns the tables nor bypasses the policy. Medians in ms, from the earlier full run (`4eed15c`), where the on and off rows were measured under equal load.

| Scenario | A3 off | A3 on | B off | B on |
| --- | --- | --- | --- | --- |
| Default list | 0.91 | 0.92 | 0.74 | 0.76 |
| Picklist filter, text sort, first page | 1.76 | 1.77 | 1.35 | 1.36 |
| Same, page 100 by keyset | 2.29 | 183 | 1.52 | 1.53 |
| Same, offset 5,000 | 98 | 104 | 45.8 | 45.6 |
| Owner, date range and number filter | 7.53 | 57.2 | 7.85 | 7.77 |
| Boolean filter matching 90 %, text sort | 0.92 | 1.04 | 0.75 | 0.74 |
| Three-field filter | 3.09 | 135 | 2.00 | 2.04 |
| Related list by lookup | 0.90 | 109 | 0.80 | 0.79 |
| Count, 13,000 matches | 21.1 | 111 | 21.9 | 21.5 |
| Single record read | 0.67 | 0.72 | 0.79 | 1.43 |

- B keeps every plan and buffer count; its medians stay within 3 %, except the single read (same plan and 4 buffers, a p95 outlier in that run).
- A keeps the plans that use an expression index only for **ordering**. Wherever the index was a **filter**, the plan falls back to a scan: 57 to 183 ms, p95 up to 192 ms. That is 1.9 times the list target, under the reopen threshold.
- Search loses its index in A and B alike: a selective prefix went from 2.7 and 1.4 ms to 1,667 and 1,696 ms (p95 1,744 and 4,218 ms), a rare substring from 4.7 and 3.3 ms to 307 and 205 ms.
- Writes are unaffected (A insert 1.05 ms off, 1.08 ms on).

### Results for the index slots

From MEP-103: 200,000 records, row-level security on, runtime role, three rounds per read (the round with the lowest p95 is shown), 548 correctness, equivalence and isolation checks, none failing. Ten slots assigned unless stated. p95 in ms.

| Scenario | A4b | Note |
| --- | --- | --- |
| Picklist filter, text sort, first page | 1.48 | index order |
| Same, page 100 by keyset | 2.65 | |
| Same, offset 5,000 | 164; keys first 59 | typed table, in the earlier MEP-96 run: 86 |
| Owner, date range and number filter | 8.77 | |
| Three-field filter | 1.97 | |
| Related list by lookup | 0.85 | |
| Number filter on a `bigint` slot, sorted by it | 1.09 | |
| Number filter with an order the index cannot deliver (19,800 matches sorted) | 167; keys first 6.95 | |
| Count, 13,000 matches | 2.85 | index-only |
| Single record read | 0.52 | |
| Insert, update one field, update five fields, with event; 20 slots filled | 5.94, 5.70, 4.49 | 105 KB of log per write |
| Report, 12 months by one field | 32 and 38 | |

Sort on a text slot with 40 % empty values, all four orders (`asc`/`desc` × empty first/last), p95 in ms:

| Page | Index order (2 orders) | Two branches (2 orders) |
| --- | --- | --- |
| First, no filter | 1.6, 1.9 | 2.9, 2.9 |
| Offset 5,000, no filter | 4.2, 4.3 | 61, 58 |
| Offset 120,000 (where empty values begin), no filter | 197, 244 | 1,715, 1,409 |
| First, with a filter on another slot (13,000 matches) | 1.8, 2.0 | 3.5, 2.7 |
| Offset 5,000, same filter | 60, 58 | 102, 99 |
| Boundary page, same filter | 63, 62 | 106, 107 |

- **Exactness.** Filters and sorts on the `bigint` slot returned the same records in the same order as the exact `numeric` comparison in every check, including 16 digits before the decimal point. A `double precision` slot differed in 39 of 48 ordered comparisons.
- **Size** at 200,000 records: table 490 MB and indexes 516 MB with ten slots assigned; 599 and 529 MB with all twenty filled.
- **Row-level security.** No plan differed between policy off and on. In 18 of 165 off/on pairs the buffer count differed by one, all in parallel plans. The median ratio of the on and off medians is 1.05. Nine of the 55 scenarios were more than 10 % slower with the policy on in all three rounds. Seven are forms the compiler does not emit or deep pages already over the target; the largest, about two times (9.9 → 20 ms, 77 → 153 ms), are one-statement sorts of the whole matching set for a first page. Two are emitted forms inside the target: the index-order walk to offset 5,000 in both directions (about 3 → 4 ms; ratios 1.3 to 1.7). The cause was not isolated. The paired measurement against a role that bypasses the policy gave ratios of 0.76 and 1.00 for the two scenarios where both roles ran the same plan; in the other three the bypass role ran a different plan, so those ratios compare nothing.
- **Side table (A5),** same data, fields, writes and role: reads 232 ms p95 for the first page of the picklist list (A4b 1.48), 217 ms by keyset (2.65), 34 ms for the owner, date and number filter (8.77), count 60 ms (2.85); equal to the slots on the related list and the number filter. The A5 statements were written once and not tuned. Writes with ten fields are cheaper than slots (insert 3.12 ms, 51 KB of log); with twenty fields the insert costs 9.39 ms and 128 KB, and the data is 1.9 GB against 1.1 GB.

### Outcome

**Earlier models.** A3 (expression indexes) misses the list target under RLS wherever its index was a filter (p95 up to 192 ms). B meets every list, read and write target with RLS on. C is out: insert cost, size, list medians. Search misses its target under RLS in A and B alike and does not separate the models; that target is suspended by the exception in §8. What this ADR proposes is A4b, and B's times are not evidence for it.

**The rule.** Written before the slot results, in the previous revision of this section and, made precise after the second review, as six expectations in MEP-103: with RLS on, as the runtime role, at 200,000 records. Applied as written:

| # | Expectation | Result |
| --- | --- | --- |
| 1 | Number filter, and owner, date and number filter, on `bigint` slots: slot index condition, p95 ≤ 100 ms, exact at every operator and threshold | Met: 1.09 and 8.77 ms |
| 2 | Four sort orders: first page and boundary page p95 ≤ 100 ms; plain sorts in index order with no sort of the whole set; offset 5,000 ≤ 300 ms | **Not met.** First pages (≤ 3.5 ms) and offset 5,000 (≤ 102 ms) pass. The boundary page fails: 197 to 1,715 ms without a filter, 106 and 107 ms with one in the two-branch orders, and the two-branch plans sort the whole set there |
| 3 | Insert and update with their event, 20 slots filled, p95 ≤ 15 ms | Met: 5.94 and 5.70 ms |
| 4 | Backfill under concurrent writes verifies with no mismatch and finds injected ones exactly | Met: 0, then 200, then 0. The writer reached 28 writes per second, not the 50 intended |
| 5 | Single read p95 ≤ 5 ms; report p95 ≤ 1 s | Met: 0.52 ms; 32 and 38 ms |
| 6 | Every read has the same plan and buffer count with the policy off and on; paired on/off ratio ≤ 1.10 | **Not met.** Plans are equal; 18 pairs differ by one buffer; two emitted forms and seven others are reproducibly slower with the policy on; three of the five paired ratios are unusable |

The previous revision said that if a list rule failed, the ADR is not accepted as written, and the side table and the typed table are evaluated on the same scenarios before any decision. That is where this stands:

- **The side table was evaluated** in the same run. It equals the slots on two reads and is 1.6 to 157 times slower on the other six, and it is worse on size and on writes with twenty fields. Its reads were not tuned; it stays the next mechanism if a module outgrows its slots, not a replacement.
- **The typed table was not measured on the sort matrix.** It was measured beside the first slot variant on the list scenarios (MEP-96): 86 ms p95 at offset 5,000. The slots with keys first took 59 ms in the later run; two runs, so an indication and not a comparison. Its cost at offset 120,000 is not known.
- **What failed is depth, not the model.** Every failing figure in expectation 2 is a boundary page: an offset of about 120,000 without the filter, and of roughly 8,000 with it if the filtered set has the same share of empty values. First pages, filters, the keyset page, counts, reads, writes, exactness and the report are inside their targets, several with a wide margin. The page number is the wire format (ADR 0004), and a page-number query walks the rows it skips in any storage model.

**What this revision changes instead of claiming the rule held:**

1. The list target is claimed only up to offset 5,000. Beyond it this ADR claims nothing; it states the measured cost: 0.2 s at offset 120,000 in the two index orders, 1.4 to 1.7 s in the two-branch orders. Such a page is page 2,400 at 50 rows.
2. Statements are compiled keys first (§8). The two-branch form as measured selects whole rows in each branch; whether it holds at depth with keys first, or needs a second index for a slot that is sorted in a two-branch order, is not measured. Both are changes to the compiler or to one migration, not to stored data. The compiler issue measures the sort matrix at the three depths before it chooses, and reports the typed-table figure beside it if the result is over 300 ms.
3. The 10 % overhead target for row-level security is claimed for the emitted forms that return a page without skipping rows, where the rounds show it. It is not claimed for plans that walk thousands of rows per page; there the measured overhead is about 1 ms on 3 ms at offset 5,000 and up to two times in forms the compiler does not emit. The compiler issue isolates the cause with one plan compared node by node.
4. Whether pages beyond a depth should be refused, as a product rule, is a board decision if the list research shows the reference CRM allows them; it is listed under deferred decisions.

On that basis the storage model — one `records` table, the document as the source of truth, exact typed index slots — is put forward for acceptance. The final review is asked one question above all: whether the typed table must be measured on the sort matrix before acceptance, given that no result there would remove the reason it was rejected (runtime DDL and table ownership for the runtime role, see Alternatives).

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Typed table per module, columns added by runtime DDL | Customization would run DDL at runtime. Either the runtime role gets DDL rights and table ownership, which defeats row-level security and least privilege, or a separate privileged executor applies it, which is a second way into the schema outside Drizzle migrations and the cloned test template. Schema then differs per environment and per organization. Custom columns of different organizations collide in a shared table; a table per organization is the per-tenant schema ADR 0001 rejected. It stays the fallback if the slot model fails in use; its speed was never the objection. |
| Entity-attribute-value rows for all fields | Measured: insert 20 ms and 483 KB of log, 2.9 GB in total, list medians of 180 to 280 ms. |
| A side table of indexed values only (one typed row per record and indexed field) | No slot limit and no statistics shared between fields of one column. Measured (MEP-103): cheaper writes with ten indexed fields, dearer with twenty (insert 9.39 against 5.94 ms p95), 1.9 GB against 1.1 GB, and reads equal to the slots on two scenarios and 1.6 to 157 times slower on six; its statements were not tuned. It is the next mechanism if a module outgrows its slots. |
| Typed columns for standard fields, JSONB only for custom fields | Two code paths for every feature (validation, compiler, layouts), and "standard" is still metadata we must be able to change in Phase 3. |
| A table or partition per module | New modules need runtime DDL; no benefit at this volume. |
| Document keyed by API name or field id | API names are editable; UUID keys add about 2 KB per record and make documents unreadable. |
| Lookups only in the document | No referential integrity, and a related list could not use an index under RLS. |
| Expression or GIN indexes on the document | Measured: not used as a filter under RLS; the GIN index costs 249 MB and almost four times the log per insert. |
| Decimals and currency as JSON numbers with `double precision` slots | Cannot hold the declared 16 digits with their decimal places exactly, and totals drift. The typed model was measured with `numeric(16,2)`, so its results would not have carried over either. |
| `numeric` slots | Exact, but `numeric` comparison is not leakproof: the slot would lose its index under RLS. |
| A second index per slot for the two other orders | Doubles the 20 indexes on the write path, which already logs 105 KB per write. The two-branch form serves first pages and offset 5,000 from one index. A second index for one slot remains an option for deep pages (Outcome, change 2). |
| Slot indexes over non-empty values only | 3.3 times smaller and 42 KB of log per write instead of 104 KB, but plain sorts lost the index order (first page 158 ms p95). |
| Mark the JSONB and `ILIKE` functions leakproof, or wrap them in leakproof functions | Needs a superuser, changes built-in catalog rows that a dump and restore does not carry, and is refused by managed PostgreSQL services. The deployment topology is not decided (ADR 0001). |
| Run compiled reads as a role that bypasses the policy | A wrong organization predicate in one compiled statement then returns another organization's rows; ADR 0001 §3 rule 4 exists to prevent that. |
| A tenant context the runtime role cannot set (a database role per organization, or a signed setting checked by a definer function) | Per-organization roles are created at runtime and switched per transaction. A signed setting needs a secret the runtime role cannot read and a `SECURITY DEFINER` check inside every policy. Both add moving parts to guard a path, arbitrary SQL as the runtime role, that the design closes at the compiler. The triggers for revisiting are in §5. |
| `FORCE ROW LEVEL SECURITY` | Does not bind superusers, which is the likely misconfiguration locally, and makes owner-run migrations blind to rows. The startup guard covers both. |
| Organization filter only in services, no RLS | One forgotten predicate leaks another organization's data. |
| A globally unique record id (`id` as the primary key) | A unique key that spans organizations lets a constraint error reveal that an id exists elsewhere, and needs a second unique index for the composite foreign keys. |

## Consequences

- Custom fields, modules, layouts and views are inserts into metadata tables. No DDL and no deploy, which is the Phase 3 exit criterion.
- The database no longer types or constrains field values. Validation in the write path is the only guard, so nothing else may write `records`.
- Indexed values exist twice (document and slot), and lookup ids three times at most (document, slot, link row). The write path owns all copies; a consistency check belongs in its tests.
- The number of indexed fields per module is bounded by the slot count. Other fields filter and sort by scanning the module: 57 to 183 ms median at 200,000 records, over the list target and linear beyond.
- Decimal and currency values are strings in the port and the document. Code that calculates with them must use a decimal type, never `number`; totals are computed in SQL as `numeric`.
- Every write transaction holds a shared lock on its module's row. A slot change waits for the writes in flight and briefly blocks new ones.
- Deep pages cost in proportion to the offset, because the wire format pages by number: inside the target to offset 5,000, 0.2 to 1.7 s at offset 120,000.
- Twenty slot indexes make every write log about 105 KB, and a backfill of one slot over 200,000 records logs 2.9 GB.
- Reports are fast only on fields that have a slot (32 to 38 ms p95 for a 12-month group at 200,000 records); on document expressions the same report takes 100 to 130 ms. Phase 5 assigns slots to report fields or adds a reporting table without changing the model.
- Row-level security is not free on plans that walk many rows per page; the compiler must keep emitted forms short of that, and its plan tests are the guard.
- Every predicate the compiler emits for an index path must stay leakproof. A cast, a function call or a `numeric` comparison on a slot silently turns an index scan into a scan; the plan test in §8 guards it.
- Row-level security does not contain arbitrary SQL run as the runtime role. The compiler's parameter and identifier rules are the guard for that path, and the credential tables are out of that role's reach.
- The application needs three database roles and three connection URLs in every environment, including tests.
- No extension is required.

## Relation to earlier ADRs

- ADR 0001 §5 rule 5 named GIN and expression indexes and full-text search as the tools for flexible fields. §8 replaces the indexes with typed slots and defers the search index.
- ADR 0001 §3 keeps identity and tenancy tables under service-level isolation. §5 adds a separate database role for that side, so CRM SQL cannot read credentials or sessions.
- ADR 0004 is unaffected: handlers call the port; this ADR supplies the adapter behind it. The wire form of decimal values is an open point there.

## Deferred decisions

| Decision | When |
| --- | --- |
| Profiles, field-level permissions, sharing rules (bodies of `authorize` and record-level policies) | Separate ADR, after the permission screens are researched |
| Search: fields, matching rule, token table or another index that works under RLS | With the search spec; needs its own measurement |
| Text sort and equality rules of the reference (case, accents), and where empty values sort in each direction | With the list research; compiler settings |
| Pages beyond offset 5,000: the two-branch form with keys first, a second index for a slot, or a depth limit | Compiler issue measures the first two; a depth limit is a board decision |
| Cause of the row-level security overhead on plans that walk many rows | Compiler issue |
| Whether restoring a record restores the child records deleted with it; who may see and empty the recycle bin | With the first child module; permissions ADR |
| Which digits a numeric field's `length` counts; the wire form of decimal and currency values | With the Leads form spec; ADR 0004 |
| Numeric fields wider than 18 digits in an index slot | When such a field must be indexed |
| Tags, composite address | With the Leads form spec |
| How a lookup shows a target that is in the recycle bin | With Contacts |
| Lead conversion and its lookups | After Contacts, Accounts and Deals exist |
| Unique fields, autonumber, formula, multi-select picklist | Phase 3, or when first in scope |
| Idempotency key for retried commands | Phase 2 (CSV import) |
| Event delivery to consumers, worker role, purge of deleted records | Phase 4 |
| A tenant context the runtime role cannot set | Before user-authored expressions run in the database, or before mutually untrusted organizations share a deployment |
| Multi-currency | When a second currency is in scope |
| External ids for importing existing data | Phase 2 (CSV import) |
| Metadata caching (keyed by `modules.metadata_version`) | When measured as needed |
