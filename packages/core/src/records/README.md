# Record service port

The type-only `@crm/core/records` entry point defines the service used by Leads
screens. `RecordServiceFactory` binds an authorized `OrgContext` once; methods
accept module API names and opaque record IDs, never organization parameters.
`contract.ts` imports only types, and the entry point exports only types. Client
components can import it without loading authentication, a database or a service.
The method signatures follow MEP-68; `ListView.isDefault` follows the K2 amendment.

Metadata describes fields, ordered picklist display/stored values, layout sections
and ordered field API names. Exactly one view is default. List results carry page,
page size and `moreRecords`; `count` is separate. Updates are partial. View criteria
and extra filters combine with `and`.
`ListQuery.fields` projects field API names, always including `id`. Omission
returns all fields; an empty list returns only `id`. Unknown names raise a
`ValidationError` keyed by `fields`. Projection happens after filtering and sorting. The only observed comparator is `is`: exact
stored-value equality, case-sensitive for strings; an array matches any element;
null matches an empty field. Groups support `and` and `or`.

Field values are JSON-compatible domain values: strings for text-like fields,
UTC timestamps, opaque single-module references, image references and long
integers; finite numbers for integer/decimal/currency fields; booleans for checkbox
fields; `{ module, id }` for connected-module references; and null for empty fields.
Long integers use strings to avoid precision loss. These representations specify
neither HTTP payloads nor physical storage.

## Current delivery status

The port, fixture adapter, reusable contract suite and application selection point
are implemented. The fixture publishes all 56 Leads fields and 14 configured views.
It generates 250 deterministic synthetic records using a fixed seed. Organization
state lives in process memory under one `globalThis` / `Symbol.for` key, surviving
module re-evaluation and separate server bundles in the same runtime.
Factories bound to the same organization share it,
while different organizations remain isolated. State is lost when the process
restarts and is not shared across processes. This adapter is for screen development.

Inputs used: `research/specs/leads-fields-and-layout.md`,
`research/specs/list-views.md`, `research/specs/app-shell.md`, ADR 0001 and existing context/error
types. The follow-up checked relevant field constraints and Lead_Source stored
values against local research metadata. No captures or live reference CRM was accessed.

## Screen usage

A server component or route handler obtains its already-authorized `OrgContext`,
then calls `getRecordService(ctx)` from `apps/web/src/lib/records.ts`. All screens
obtain record data through that selection point. It currently imports the fixture
from the separate `@crm/core/records/fixture` subpath. Client components import
only types from `@crm/core/records`.

`Owner`, `Created_By` and `Modified_By` carry user IDs (strings), not display
names. Screens resolve those IDs through `listMembers(ctx)` from `@crm/core`.
Display names are not part of the record service port.

```ts
const service = getRecordService(ctx);
const module = await service.getModule("Leads");
const views = await service.listViews(module.apiName);
const view = views.find((candidate) => candidate.isDefault);
if (!view) throw new Error("No default view.");
const query = { viewId: view.id, page: 1, perPage: 20 };
const page = await service.list(module.apiName, query);
const total = await service.count(module.apiName, query);
```

Validation uses metadata: required fields, lengths, types and published picklist
membership. Empty published picklists accept null; Country and State validate only
string/null and length. Unknown fields and writes to system-managed fields are
validation failures. Owner/created-by/modified-by use the bound user; Full_Name is
computed. System-generated fields unavailable on forms cannot be supplied by callers.
Lengths apply to strings/reference IDs and numerical digits (sign and decimal
separator excluded, exponent notation expanded). No email/phone syntax or
unobserved decimal-place validation rule is added.

Unknown modules, views and records raise `NotFoundError`. Validation raises
`ValidationError` with field API names (query failures use page/perPage/sort/filters).
A future uniqueness violation must use the existing `ConflictError`. This Leads
fixture has no unique fields and permits duplicate Email on create and update.
Returned metadata, views, records and nested values are detached copies; write
inputs are copied before storage. Bulk delete validates every ID before deleting.

## Adapter verification

Import `describeRecordServiceContract` from `@crm/core/records/contract-suite` in a
test file and provide a factory accepting `OrgContext` (synchronous or asynchronous):

```ts
describeRecordServiceContract("adapter", (ctx) => createRecordService(ctx));
```

The suite invokes only public methods. Each test gets a fresh synthetic organization;
an adapter harness must provision that organization and bound user, and clean up its
test state. Pagination tests create their own matching records and discover views
through `listViews`; they require no fixture IDs or default insertion order. Tests
cover metadata/view consistency, every page size, counts, criteria plus filters,
search, text/number sorting, CRUD, field errors, duplicate Email, system fields,
tenant isolation and independent return values. `fixture.test.ts` separately tests
the precise seed, view content and interim fixture policies. Run targeted tests with
`corepack pnpm exec vitest run --project unit packages/core/src/records` and the full
repository gate with `corepack pnpm verify`.

## Interim fixture policies (not reference parity)

These CTO-approved policies permit development while research is pending. They are
not evidence of reference CRM behavior and must not determine screen parity.

- All 14 views have null sort. Eleven system views have interim null criteria:
  `all-leads`, `all-locked-leads`, `converted-leads`, `mailing-labels`,
  `my-converted-leads`, `my-leads`, `recently-created-leads`,
  `recently-modified-leads`, `todays-leads`, `unread-leads`, `unsubscribed-leads`.
  `SYSTEM_VIEW_IDS_WITH_INTERIM_NULL_CRITERIA` is their single inventory constant.
  MEP-71 tracks the actual definitions; view names never imply predicates.
- Search trims input; blank means no restriction. Otherwise it matches a
  case-insensitive substring (`toLowerCase`, no locale) in Full_Name, Company,
  Email or Phone. It combines with view criteria and filters using `and`.
- Full_Name is recomputed at create/update: First_Name plus a space plus Last_Name
  when First_Name is populated, otherwise Last_Name. Salutation is excluded.
- Create/update normalize exactly empty strings (`""`) in string-valued fields to
  null before validation and storage. Strings are not trimmed; required-field
  validation and type checks for non-string fields are unchanged.
- Synthetic Lead_Source values use published stored values or null, excluding
  the `-None-` placeholder. First_Name includes populated and null values;
  Full_Name follows the same composition rule as writes.
- Seeded Owner, Created_By and Modified_By are assigned to the user who first
  opens the organization's store. Opening it as another user does not reassign
  existing records. The pure seed generator is independent of user context.
- Callers cannot write Owner. The reference CRM create/edit forms expose Lead
  Owner; support will be handled in a separate task after the MEP-18 form spec.
- Effective sort is query override, view sort, then creation order (seed order,
  then created records). All metadata fields are accepted for sorting; the nine
  metadata-ineligible fields are not separately rejected until the Sort By menu
  is researched. Invalid sort/filter fields raise keyed validation errors.
- Numbers compare numerically, booleans false before true, strings by lowercase
  code-unit order (no localeCompare/Intl), timestamps chronologically, object
  references by ID. Equal
  values preserve default order. Null and empty strings sort last in either order.
- Page must be a positive integer and perPage one of 10, 20, 30, 40, 50, 100.
  Beyond the last page, records are empty and moreRecords is false.

## Deferred

- Country/State option inventories and their dependency. Both are picklists with
  maxLength 120 and no picklist property; seed values are null. MEP-18 tracks these
  questions, placeholder storage and Full_Name composition.
- Unsubscribed Mode deliberately publishes 3 of 4 options, in spec order. The
  fourth contains a forbidden product name and cannot enter this repository.
  Unsubscribed_Mode/Unsubscribed_Time are system-managed and seeded null.
- The reference's storage of the -None- placeholder is unverified. Published lists
  include it, but the fixture represents empty picklists with null.
- Uniqueness enforcement and rejection tests await the first scope with a unique
  field. Leads has unique=false on every field; no hidden module or unreachable
  uniqueness branch is introduced.

## Open points for ADR 0002

- Preserve the port across document, typed-table or EAV storage. Tenant isolation,
  detached values and the same validated write service remain adapter obligations.
- Preserve opaque IDs and lossless long-integer strings across implementations.
- Define how picklist inventories enter runtime metadata, including deferred
  Country/State options and dependency behavior.
- Three custom views expand Lead Status record categories to stored-value arrays.
  Open expands six values, Junk to Junk Lead and Not Qualified to Not Qualified;
  empty status is excluded. Reference category wire encoding is unverified and
  the current port has no category member. Avoid losing that distinction.
- Replace interim search/sort/null/default-order policies when researched. Filter
  operators, sortable menu entries and system view criteria/sorts remain open.
- Add metadata-driven uniqueness enforcement using ConflictError and a genuine
  rejection contract test with the first authorized unique-field scope.

## Deliberately excluded

Storage, schemas/migrations, identity-generation strategy, HTTP paths/methods,
authorization and role rules, event processing, routes, screens, conversions,
bulk actions, import/export and non-Leads modules are outside this delivery.
The database package and route tree remain unchanged. No dependencies are added.
