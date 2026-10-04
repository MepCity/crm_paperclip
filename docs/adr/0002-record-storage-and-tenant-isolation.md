# ADR 0002 — Record storage, metadata model and tenant isolation

- Status: Proposed (measurement MEP-50 and independent review pending)
- Date: 2026-10-03
- Decider: CTO
- Issue: MEP-40

## Context

ADR 0001 §5 fixed the rules (metadata is data, one write path, events before automation, compiled queries) and left the physical model open. This ADR decides it. Every Leads implementation issue depends on it.

Facts from the metadata export (audited in MEP-15):

- 42 modules, about 1,050 fields, 27 field types. Core modules have 20 to 61 fields (Leads 56, Contacts 61, Accounts 51, Deals 29).
- The setup is close to the reference CRM defaults: one custom field in the core modules, one layout per module. Runtime extensibility is required by the Phase 3 exit criterion (customization recreated **without code changes**), not by today's data.
- Most fields are plain scalars. 212 fields are lookups, 76 are owner lookups; 23 are multi-module lookups, 20 formulas, 4 subforms.
- Two picklists are large and repeated on every address field: country (248 values) and state (about 4,000).
- Missing from the export: view criteria and columns, the profile permission matrix, the pipeline definition. They come from screen research.

Volume assumption: one organization, up to 200,000 records in the largest module, a handful of concurrent users. The model must not break at ten times that, but is not tuned for it.

## Decision

### 1. Record storage: one table, JSONB document plus typed system columns

All records of all modules live in one table. Values every record has are typed columns; everything defined by metadata lives in one JSONB document.

```sql
create table records (
  id              uuid primary key default uuidv7(),
  organization_id uuid not null,
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
  search          text not null default '',
  foreign key (organization_id, module_id) references modules (organization_id, id)
);
```

- `data` is keyed by the field's **storage key**: immutable, `[a-z][a-z0-9_]*`, unique per module, assigned when the field is created. The API name and the label stay editable metadata; renaming never rewrites records.
- Empty values are absent from the document. There is one representation of "no value".
- `name` is the record's display name, derived by the write path from the module's display field (for Leads: first and last name). Lookups, related lists and search read it without touching the document.
- `search` is the lower-cased concatenation of the searchable fields, maintained by the write path.
- Each field's metadata says where its value lives: `column` (system column), `document` (key in `data`) or `computed` (derived on read, never stored). The reference CRM's owner, created/modified by, created/modified time and id fields map to system columns.
- Every foreign key between organization-owned tables is composite and includes `organization_id`, so a row cannot reference another organization's row.

Value formats inside the document:

| Kind | Format | Compared as |
| --- | --- | --- |
| Text-like | JSON string | `(data->>'k') collate "und-x-icu"` |
| Integer, decimal, currency | JSON number, at most 15 significant digits | `(data->'k')::numeric` |
| Boolean | JSON boolean | containment |
| Date | `YYYY-MM-DD` | `(data->>'k') collate "C"` |
| Date-time | UTC, fixed width `YYYY-MM-DDTHH:MM:SS.sssZ` | `(data->>'k') collate "C"` |
| Picklist | the value's immutable `value` string | containment or text |
| Lookup, user | UUID string | containment |

Date and date-time values are compared as text on purpose: a fixed-width UTC string sorts chronologically, while a cast to `timestamptz` is not immutable and cannot be indexed.

### 2. Metadata tables

All are organization-scoped rows protected by row-level security (§5). Standard and custom definitions live in the same tables.

| Table | Holds |
| --- | --- |
| `modules` | API name (unique per organization), labels, kind (`standard`, `custom`, `system`), display field, order, visibility |
| `fields` | module, API name, storage key, label, type, storage (`column`, `document`, `computed`), required, read-only, unique, length, decimal places, default, picklist reference, type options (JSONB), flags (sortable, filterable, searchable, indexed), custom flag |
| `picklists`, `picklist_values` | a value set and its values (immutable `value`, editable label, order, colour, active). Fields reference a set, so country and state are stored once per organization instead of once per address field |
| `layouts`, `layout_sections`, `layout_fields` | layout per module; sections (label, columns, order); field placement with per-layout required, read-only and default |
| `related_lists` | module, related module, linking field, kind, label, order, visible columns |
| `views` | module, name, kind (`system`, `shared`, `personal`), owner, criteria, columns, sort, default flag |

Seeding:

- A converter script reads the export from a directory given by an environment variable and writes a compact seed file per module in **our** format into the repository. Source identifiers, timestamps and everything outside our model are dropped; the export itself is never committed.
- Seed files are applied per organization through a metadata service (on organization creation, and by a command for existing organizations). The apply step is idempotent and only inserts what is missing; it never overwrites a customized row.
- Only the modules of the current delivery module are seeded. Module 1 seeds Leads.
- View criteria and columns are not in the export; view seeds are written from the list-view spec.

### 3. Field types

Our type names are neutral; the converter maps export types to them.

| Export type (count) | Our type | Storage | Validation | Queries | Module 1 |
| --- | --- | --- | --- | --- | --- |
| text (141) | `text` | string | length, trim | equals, contains, starts with, empty, sort | Yes |
| textarea (64) | `textarea` | string | length | search, empty | Yes |
| email (13) | `email` | string, lower-cased | format, length | as text | Yes |
| phone (10) | `phone` | string | character set, length | as text | Yes |
| website (4) | `url` | string | URL, length | as text | Yes |
| picklist (105) | `picklist` | value string | active value of the field's set | is, in, empty, sort | Yes |
| boolean (25) | `boolean` | boolean | type | is | Yes |
| integer (47) | `integer` | number | integer, digits | comparison, between, sort | Yes |
| double (46) | `decimal` | number | digits, decimal places | comparison, between, sort | Yes |
| currency (42) | `currency` | number in the organization's base currency | as decimal | as decimal | Yes |
| date (16) | `date` | string | calendar date | on, before, after, between, sort | Yes |
| datetime (118) | `datetime` | string; created and modified time are system columns | instant | as date | Yes |
| ownerlookup (76) | `owner` | system columns `owner_id`, `created_by`, `updated_by` | active member of the organization | is, in, sort by name | Yes |
| bigint (51) | record id | system column `id` | — | is | Yes (id only) |
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

Not field types but present on Leads: tags (a text field holding an array), the composite address and coordinates fields, and the conversion lookups. They are decided with their feature specs.

### 4. Relations

- **Owner and audit users** are system columns referencing `users`. Users are deactivated, never deleted, so these references never dangle.
- **Lookups** store the target id in the document and one row in `record_links (organization_id, source_record_id, field_id, target_record_id)`, written in the same transaction. Both sides are composite foreign keys to `records`: the source side cascades, the target side restricts. The table gives referential integrity that JSONB cannot, and makes a related list one indexed query on `(organization_id, target_record_id, field_id)`.
- **Delete behaviour.** Deleting a record is a soft delete (§9); links stay, so a restore brings relations back. Purging a record first clears the lookups pointing at it through the write path, which emits their change events; the restricting foreign key is the safety net.
- **Uniqueness** of a field value cannot be a constraint on a JSONB key without runtime DDL. When the first unique field is in scope, a `record_unique_values (organization_id, field_id, value)` table with a primary key enforces it. No Leads field is unique in the export, so this is deferred.

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

- **Fail closed.** With no setting the function returns null and the policy matches nothing; inserts fail the check.
- **`withOrg(ctx, fn)`** in `@crm/core` is the only way to run CRM SQL. It opens a transaction, runs `select set_config('app.org_id', $1, true)` and passes a transaction handle of a distinct type to `fn`. Repositories accept only that type, so CRM SQL outside `withOrg` does not compile. The setting is transaction-local, so pooled connections cannot leak it.
- **Compiled queries still filter by `organization_id` explicitly.** RLS is the second line of defence, not the query's only predicate.
- **Roles.**

| Role | Used by | Rights |
| --- | --- | --- |
| `crm_owner` | migration runner, maintenance commands | owns all objects; DDL |
| `crm_app` | the application and tests (`DATABASE_URL`) | no superuser, no `BYPASSRLS`, owns nothing; explicit DML grants per table, written in the migration that creates the table; `events` is insert and select only |

- The migration runner connects with `DATABASE_MIGRATION_URL`. `pnpm dev` and the test harness create both roles in the embedded cluster; its superuser is used only for that.
- **Startup guard.** On first use `@crm/core` checks that the connected role is not a superuser, has no `BYPASSRLS` and does not own `records`, and refuses to run otherwise. This is why RLS is not `FORCE`d: the guard covers the superuser case that `FORCE` cannot, and migrations keep working as the owner.
- **Catalog test.** An integration test reads the catalog and fails if any table with an `organization_id` column outside the identity and tenancy tables lacks RLS or the standard policy. A new table cannot forget it.
- Identity and tenancy tables (`users`, `sessions`, `organizations`, `memberships`, `invitations`) are read before an organization context exists and stay under service-level isolation (ADR 0001 §3).
- The Phase 4 worker reads events of all organizations; it gets its own role and policy in the job-queue ADR.

### 6. Write path

One service in `@crm/core` changes records. Server actions, REST handlers, import and automation call it.

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

1. Load the module's metadata.
2. Normalize and validate `values` (keyed by API name) against it: unknown, read-only and computed fields are rejected; type, required, length and picklist membership are checked. Errors are returned per field.
3. Authorize through one hook, `authorize(ctx, action, module, record)`. Module 1 checks membership; profiles and sharing rules replace the hook body later.
4. Write the row. An update merges the patch into `data`, removes emptied keys, bumps `version` and fails with a conflict if `expectedVersion` does not match.
5. Maintain `name`, `search` and `record_links`.
6. Append one event per changed record.

### 7. Events

```sql
create table events (
  id              uuid primary key default uuidv7(),
  organization_id uuid not null,
  type            text not null,   -- record.created | record.updated | record.deleted | record.restored
  module_id       uuid not null,
  record_id       uuid not null,
  actor_id        uuid,            -- null for system
  source          text not null,
  correlation_id  uuid not null,
  occurred_at     timestamptz not null default now(),
  payload         jsonb not null   -- { v: 1, changes: { <storage key>: { from, to } } }
);
```

- Append-only: the runtime role cannot update or delete events.
- `correlation_id` groups the events of one request or bulk operation; automation uses it later to stop loops.
- Module 1 reads events only for a record's history, by `(organization_id, record_id, id)`. Delivery state for consumers is decided with the job queue in Phase 4; consumers will claim rows, not page by id, because ids are not in commit order.

### 8. Query compiler

`compileListQuery(metadata, query)` turns a validated query into one parameterized statement.

```ts
type Criteria =
  | { and: Criteria[] } | { or: Criteria[] }
  | { field: string; op: Operator; value?: unknown };

type ListQuery = {
  module: string;
  fields: string[];
  criteria?: Criteria;
  search?: string;
  sort?: { field: string; direction: "asc" | "desc" }[];
  page: { size: number; cursor?: string };
};
```

- Field names are resolved through metadata to a column or a storage key. Storage keys reach the SQL text through one quoting function and only from metadata; values are always bind parameters.
- Each field type has a fixed operator set (§3). Relative date operators are resolved to absolute bounds before compilation.
- Every statement filters by `organization_id`, `module_id` and `deleted_at is null`, and appends `id` to the sort so that order is total. Empty values sort last.
- Pagination is keyset: the cursor encodes the sort values and the id of the last row. A total is a separate, capped count.
- Search matches the `search` column.
- **Index strategy:** see Measurement. The candidates are base indexes on the system columns, one `jsonb_path_ops` GIN index on `data`, a trigram GIN index on `search`, and per-field partial expression indexes for fields flagged `indexed`, created by a maintenance command as `crm_owner`, never on the request path.

### 9. Identifiers, audit fields, soft delete

- Record ids are UUIDv7 (ADR 0001). The reference CRM's numeric ids are not reproduced.
- `created_by`, `updated_by`, `created_at`, `updated_at` are set by the write path only; callers cannot supply them.
- `version` gives optimistic concurrency for edit forms.
- **Soft delete is required:** the reference CRM has a recycle bin from which records are restored. Delete sets `deleted_at` and `deleted_by`; indexes used by lists are partial on `deleted_at is null`. Purge after a retention period needs the Phase 4 worker.

## Measurement

Script and raw results: MEP-50 (`scripts/bench/record-storage.ts`, `scripts/bench/results/record-storage.md`). Embedded PostgreSQL 18.4, default settings, synthetic data: 200,000 records of a 46-field module in the measured organization, plus 100,000 rows of another module and another organization.

Targets, fixed before measuring (p95, database time):

| Scenario | Target |
| --- | --- |
| Filtered and sorted list page | 100 ms |
| Text search | 150 ms |
| Single record read | 5 ms |
| Single record write with its event | 15 ms |
| Grouped aggregate over 12 months (report) | 1 s |
| Row-level security overhead | 10 % |

Decision rule: the JSONB model stands if it meets the targets with the generic indexes, or with per-field expression indexes on flagged fields. If it misses a list target by more than three times even with expression indexes, the storage decision is reopened.

Results: _pending MEP-50._

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Typed table per module, columns added by runtime DDL | The runtime role would need DDL rights and table ownership, which defeats row-level security and least privilege. Schema would differ per environment and per organization, outside Drizzle migrations and the cloned test template. Custom columns of different organizations collide in a shared table; a table per organization is the per-tenant schema ADR 0001 rejected. |
| Entity-attribute-value rows | About 30 rows per record. A list page needs one join per displayed, filtered or sorted field; reports are worst. |
| Typed columns for standard fields, JSONB only for custom fields | Two code paths for every feature (validation, compiler, layouts), and "standard" is still metadata we must be able to change in Phase 3. |
| A table or partition per module | New modules need runtime DDL; no benefit at this volume. |
| Document keyed by API name or field id | API names are editable; UUID keys add about 2 KB per record and make documents unreadable. |
| Lookups only in the document | No referential integrity, and every related list needs its own index. |
| `FORCE ROW LEVEL SECURITY` | Does not bind superusers, which is the likely misconfiguration locally, and makes owner-run migrations blind to rows. The startup guard covers both. |
| Organization filter only in services, no RLS | One forgotten predicate leaks another organization's data. |

## Consequences

- Custom fields, modules, layouts and views are inserts into metadata tables. No DDL and no deploy, which is the Phase 3 exit criterion.
- The database no longer types or constrains field values. Validation in the write path is the only guard, so nothing else may write `records`.
- Lookup ids exist twice (document and link row). The write path owns both; a consistency check belongs in its tests.
- Reports aggregate over JSONB expressions. If Phase 5 needs more than the measurement shows, projections or expression indexes are added without changing the model.
- The application needs two database roles and two connection URLs in every environment, including tests.
- `pg_trgm` becomes a required extension if trigram search is chosen (available in the embedded build and on any PostgreSQL 18).

## Deferred decisions

| Decision | When |
| --- | --- |
| Profiles, field-level permissions, sharing rules (bodies of `authorize` and record-level policies) | Separate ADR, after the permission screens are researched |
| Dependent picklists (country and state), tags, composite address | With the Leads form spec |
| Lead conversion and its lookups | After Contacts, Accounts and Deals exist |
| Unique fields, autonumber, formula, multi-select picklist | Phase 3, or when first in scope |
| Event delivery to consumers, worker role, purge of deleted records | Phase 4 |
| Multi-currency | When a second currency is in scope |
| External ids for importing existing data | Phase 2 (CSV import) |
| Metadata caching | When measured as needed |
