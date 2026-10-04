# ADR 0002 — Record storage, metadata model and tenant isolation

- Status: Proposed — revised after the independent review (MEP-101). Not accepted: acceptance waits for the slot measurements (MEP-96, MEP-103) and the second review (MEP-104), under the acceptance rule in "Outcome"
- Date: 2026-10-04
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

- **Keys.** The primary key of every organization-owned table is `(organization_id, id)`, and every foreign key between such tables is composite and starts with `organization_id`. A row cannot reference another organization's row, and no unique constraint spans organizations (§5).
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

1. Take a shared lock on the module's row (`select … from modules … for key share`) and load the module's metadata. The lock is the barrier for slot changes (§8).
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
- Module 1 reads events only for a record's history, by `(organization_id, record_id, record_version)`.
- An idempotency key for retried commands (import, public API) is decided with the first caller that retries (Phase 2).

### 8. Query compiler and indexes

`compileListQuery(metadata, view, query)` turns the port's `ListQuery` (view, page, page size, sort, extra filters, search) into one parameterized statement; `count` compiles the same predicate into a count.

- Field names are resolved through metadata to a system column, an index slot or a storage key. Storage keys reach the SQL text through one quoting function and only from metadata; values are always bind parameters.
- Each field type has a fixed operator set (§3). Relative date operators and record categories are resolved before compilation.
- Every statement filters by `organization_id`, `module_id` and `deleted_at is null`, and appends `id` in the direction of the sort so that order is total.
- **Null placement is always explicit** (`nulls first` or `nulls last`), never the PostgreSQL default, which differs by direction. Where empty values go is one compiler setting per direction. The port's interim rule (empty last in both directions) holds until the list research settles the reference's rule.
- Text sorts by the ICU root collation; the port fixture's interim rule (lower-case code-unit order) is replaced by it, and the contract suite is aligned in the compiler issue.
- **Paging** is by page number, as the port and ADR 0004 require: `limit perPage + 1 offset (page − 1) × perPage`; the extra row answers `moreRecords`. The cost grows with the offset (measured below); a keyset form is kept inside the compiler for export and bulk iteration, never on the wire.
- **Count** is the separate request of ADR 0004 and is exact.

**Index slots.** Under row-level security no predicate on the document was used as an index condition (§5), so expression and GIN indexes on `data` are not created. Fields that must be fast are projected instead:

- `records` carries a fixed set of typed slot columns: 8 `text`, 4 `bigint`, 4 `timestamptz`, 4 `uuid`. Each has one index `(organization_id, module_id, <slot>, id) where deleted_at is null`, created by the migration. There is no DDL after migration.
- `fields.index_slot` assigns a field of a module to a free slot of its kind: text-like and picklist to `text`; date (as UTC midnight) and date-time to `timestamptz`; lookup and user to `uuid`; integer, decimal and currency to `bigint`. Booleans are not projected.
- **Number slots are exact.** The slot holds the value multiplied by ten to the power of the field's decimal places, which preserves order and equality. A field takes a number slot only if its digits before the decimal point plus its decimal places are at most 18. A wider field is filtered and sorted from the document with an exact `numeric` cast, as a scan.
- The write path fills the slot from the document in the same statement. The document stays the source of truth: slots are never read for display and can be rebuilt.
- Predicates and sort keys on a slot use only leakproof operators on the plain column, so they are index conditions under RLS. An integration test runs the compiled statements as `crm_app` and fails if the plan of a slot filter has no index condition on the slot.
- **Both directions from one index.** A slot index is ascending with nulls last. It serves `asc nulls last` forwards and `desc nulls first` backwards. For the other two orders the compiler emits two branches over the same index, the non-empty range in the wanted direction and the empty range by `id`, concatenated in the wanted order under one limit. No second index per slot. MEP-103 measures this form before acceptance.
- **Shared statistics.** A slot column holds different fields in different modules, so its column statistics mix them. MEP-96 and MEP-103 measure the estimates with several modules and organizations in one slot; if they are off by more than ten times, the migration creates extended statistics on `(module_id, <slot>)`.

**Slot lifecycle.** A field's `index_state` is `none`, `backfilling`, `ready` or `clearing`. Only the metadata service changes it:

1. *Assign.* Under the module's exclusive lock (`select … from modules … for update`): set `index_slot` to a free slot of the field's kind and the state to `backfilling`, and bump `modules.metadata_version`. Writers hold the shared lock on the same row for their whole transaction (§6), so the change waits for writes in flight, and every later write sees the assignment and fills the slot.
2. *Backfill.* A maintenance command updates the module's rows in batches. Each statement computes the slot from the row's current `data`, so it cannot store a value older than the row.
3. *Verify.* One statement counts the rows whose slot differs from the expression over `data`. Only when it returns zero is the state set to `ready`, again under the exclusive lock.
4. The compiler uses a slot only in `ready`. In every other state, and for every field without a slot, it compiles to the document expression.
5. *Release* (field deleted, or its index dropped): the state becomes `clearing` under the exclusive lock; the compiler stops using the slot and writers store null in it. A command nulls the column for the module and verifies. Then the slot is free. A slot is assigned only when free.

**Who gets a slot.** The seed assigns slots to the fields that system views filter and sort on. In Phase 3 the customization flow assigns one when an administrator asks for it or a saved view filters or sorts on the field; when no slot of the kind is free the field stays unindexed (the screen rule comes with the customization spec). If a module needs more indexed fields than slots, the slot count is raised by a migration (a nullable column and its index, no table rewrite). If that stops scaling, the side table in Alternatives is the next mechanism. Slots are derived data, so neither change touches the documents.

A filter or sort on a field without a ready slot scans the module's rows: 57 to 183 ms median at 200,000 records. That is over the 100 ms list target; the target applies to slot fields.

**Search** is not decided here. The reference's Leads list shows no record search of its own, and the global search is not specified yet. Until it is, the port's interim search compiles to `ILIKE` over the document values of its four fields and scans the module's rows. Measured on a prepared search text without an index: 0.5 to 1.9 s for a rare term at 200,000 records. No search column and no search index are created.

- **Exception to the targets, stated as one:** no measured model meets the 150 ms search target under RLS. The target is suspended, not dropped, until the search decision; the interim search is correct and slow.
- What was measured: under the policy of §5 the trigram and full-text indexes were not used, in the document and in the typed model alike, because their operators are not leakproof. That does not rule out every search index. The candidate to measure with the search spec is a token table derived by the write path and queried with `text` equality and prefix ranges, which are leakproof.
- Nothing in §1–§7 stands in its way: the write path already derives data in the same transaction, and `fields.searchable` (carried over from the export) selects the fields.

### 9. Identifiers, audit fields, soft delete

- Record ids are UUIDv7 (ADR 0001) and opaque to the port. The reference CRM's numeric ids are not reproduced.
- `created_by`, `updated_by`, `created_at`, `updated_at` are set by the write path only; callers cannot supply them.
- `version` gives optimistic concurrency for edit forms and orders a record's events (§7).
- **Soft delete is required:** the reference CRM has a recycle bin from which records are restored. Delete sets `deleted_at` and `deleted_by`; indexes used by lists are partial on `deleted_at is null`. Purge after a retention period needs the Phase 4 worker; its steps are in §4.

## Measurement

Script and full results: `scripts/bench/` and `scripts/bench/results/record-storage.md` (MEP-50, reviewed in MEP-62). Embedded PostgreSQL 18.4, default settings, 8 CPUs, synthetic data: 200,000 records of a 46-field module in the measured organization, 50,000 of the same module in a second organization and 50,000 of a second module. 5 warm-up and 30 measured runs per query, 2,000 writes of each kind. Times are client-side.

Options: **A** the document model of §1 (A0 system indexes only; A3 adds an expression index and expression statistics per filtered or sorted field); **B** one typed table per module with an index per field; **C** entity-attribute-value rows. The slot tiers (A4) and the side table (A5) are measured in MEP-96 and MEP-103; their results are added here before acceptance.

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

### Outcome

The decision rule, applied as written, does not settle the question yet.

- **A3 does not meet the targets.** It misses the list target at offset 5,000 (p95 142 ms) and, with RLS on, on every list whose index was a filter (p95 up to 192 ms). Both misses are under three times the target, so the rule neither confirms the document model nor reopens it.
- **B meets** every list, read and write target with RLS on.
- **C is out:** insert cost, size, list medians.
- **Search** misses its target under RLS in A and B alike. It does not separate the models; the target is suspended by the exception in §8.

What this ADR proposes is therefore not A3 but **A4**: the document model with typed index slots (§8). B's times are not evidence for it: the slots sit on a wider table, share statistics between modules, and add 20 indexes to the write path.

**Acceptance rule, written before the A4 results.** The ADR is accepted only if MEP-96 and MEP-103 show, at 200,000 records, with RLS on, as the runtime role:

1. **Lists on slot fields:** every scenario uses the slot index as an index condition and has p95 ≤ 100 ms. This covers first pages, the keyset page, the three-field filter, the related list, the number filter on the `bigint` slot, and both sort directions with both null placements.
2. **Deep page (offset 5,000):** reported against the same 100 ms. A miss under three times is recorded as a named exception for deep pages, with B's figure beside it; a miss above three times fails the rule.
3. **Writes:** insert and update with their event, with all 20 slots assigned and filled, p95 ≤ 15 ms.
4. **Single read:** p95 ≤ 5 ms.
5. **Exactness:** a filter and a sort on the `bigint` slot return the same records in the same order as the exact `numeric` comparison on the document, including values with 16 digits before the decimal point.
6. **Backfill:** with concurrent writers, the verify step finds no mismatch.

Size and write-ahead log have no target; they are reported and listed in Consequences.

If rule 1, 3, 5 or 6 fails, the ADR is not accepted as written. The side table of indexed values (A5, measured in MEP-103) and the typed table per module with a privileged DDL executor are then evaluated on the same scenarios before any decision.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Typed table per module, columns added by runtime DDL | Customization would run DDL at runtime. Either the runtime role gets DDL rights and table ownership, which defeats row-level security and least privilege, or a separate privileged executor applies it, which is a second way into the schema outside Drizzle migrations and the cloned test template. Schema then differs per environment and per organization. Custom columns of different organizations collide in a shared table; a table per organization is the per-tenant schema ADR 0001 rejected. It is the measured fallback if the slots fail the acceptance rule. |
| Entity-attribute-value rows for all fields | Measured: insert 20 ms and 483 KB of log, 2.9 GB in total, list medians of 180 to 280 ms. |
| A side table of indexed values only (one typed row per record and indexed field) | No slot limit and no statistics shared between fields of one column. Costs one row and its index entries per record and indexed field on every write, and each filter or sort field is a join under its own policy. Not measured yet: the EAV figures do not apply to it, because EAV stores all 46 fields as rows. MEP-103 measures it next to the slots. It is the fallback if slots fail the acceptance rule and the next mechanism if a module outgrows its slots. |
| Typed columns for standard fields, JSONB only for custom fields | Two code paths for every feature (validation, compiler, layouts), and "standard" is still metadata we must be able to change in Phase 3. |
| A table or partition per module | New modules need runtime DDL; no benefit at this volume. |
| Document keyed by API name or field id | API names are editable; UUID keys add about 2 KB per record and make documents unreadable. |
| Lookups only in the document | No referential integrity, and a related list could not use an index under RLS. |
| Expression or GIN indexes on the document | Measured: not used as a filter under RLS; the GIN index costs 249 MB and almost four times the log per insert. |
| Decimals and currency as JSON numbers with `double precision` slots | Cannot hold the declared 16 digits with their decimal places exactly, and totals drift. The typed model was measured with `numeric(16,2)`, so its results would not have carried over either. |
| `numeric` slots | Exact, but `numeric` comparison is not leakproof: the slot would lose its index under RLS. |
| A second, descending index per slot | Doubles the 20 indexes on the write path. The two-branch form over one index is measured first (MEP-103). |
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
- Deep pages cost in proportion to the offset, because the wire format pages by number.
- Reports aggregate over document expressions: 105 to 272 ms for a 12-month group at 200,000 records, against 63 ms on typed columns. If Phase 5 needs more, it projects into slots or a reporting table without changing the model.
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
