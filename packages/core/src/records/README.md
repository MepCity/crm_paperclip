# Record service port

The type-only `@crm/core/records` entry point defines the service used by Leads
screens. `RecordServiceFactory` binds an authorized `OrgContext` once; methods
accept module API names and opaque record IDs, never organization parameters.
`contract.ts` imports only types, and the entry point exports only types. Client
components can import it without loading authentication, a database or a service.
The method signatures follow MEP-68; `ListView.isDefault` follows the K2 amendment.

Metadata includes `FieldDefinition.massUpdate`, copied from metadata `mass_update`
(15 eligible Leads fields), and describes fields, ordered picklist display/stored values, layout sections
and ordered field API names. Each field has `views` flags (`view`, `create`, `edit`,
`quickCreate`), independent of `readOnly`. A section keeps its complete `fields`
list and exposes `columns` in observed top-to-bottom order, with one array per
`columnCount`. Fields with unobserved placement stay outside the columns. Screens
filter each column by the desired surface flag and handle composite name/address
inputs separately. `businessCardFields` is the ordered list of card field API names.
Exactly one view is default. List results carry page,
page size and `moreRecords`; `count` is separate. Updates are partial. View criteria
and extra filters combine with `and`. The four saved-view comparators and tokens
retain their spelling and saved-view meaning. Panel extensions and text equality
follow the interim operator table below. Tokens are resolved when the query runs;
groups support `and` and `or`. Existing scalar `equal` values for picklists,
owner IDs, null and other metadata field types remain supported for callers.
Panel picklist/owner membership uses nonempty arrays of strings. Equality on
picklists and owner IDs is case-sensitive; text-family comparisons are
case-insensitive (`toLowerCase`, no locale).

## Interim panel filter operators

All meanings and new wire values in this section are **Interim**, not observed
applied-filter behavior (ADR 0004 §4 / open question 3). The database query compiler
must implement this same table when its adapter ships; it is outside this issue.
The tree and service method signatures are unchanged. Invalid field/comparator/value
combinations raise `ValidationError` keyed by `filters` on both `list` and `count`.

| Panel operator | Field family | Criterion (comparator + value shape) |
| --- | --- | --- |
| is / isn't | text, textarea, email, phone, website | `equal` / `not_equal`, string |
| contains / doesn't contain | text family | `contains` / `not_contains`, string |
| starts with / ends with | text family | `starts_with` / `ends_with`, string |
| is empty / is not empty | every metadata field family | `is_empty` / `is_not_empty`, `null` |
| is / is not | picklist | `equal` / `not_equal`, nonempty string array (stored values) |
| = / != / < / <= / > / >= | integer, double, currency | `equal` / `not_equal` / `less_than` / `less_equal` / `greater_than` / `greater_equal`, finite number (integer fields require safe integers) |
| between / not between | number family | `between` / `not_between`, exactly two numbers `[lower, upper]` with `lower <= upper` |
| is | boolean | `equal`, boolean |
| is / is not | ownerlookup | `equal` / `not_equal`, nonempty user-ID string array |
| age in N days | datetime | `less_equal`, `{ token: "AGEINDAYS", offset: N }` (existing saved-view rule) |
| due in N days | datetime | `less_equal`, `{ token: "DUEINDAYS", offset: N }` |
| Today | datetime | `equal`, `{ token: "TODAY" }` (existing token) |
| Tomorrow / Yesterday | datetime | `equal`, `{ token: "PERIOD", name: "TOMORROW" / "YESTERDAY" }` |
| Till Yesterday / Starting tomorrow | datetime | `equal`, `PERIOD` name `TILL_YESTERDAY` / `STARTING_TOMORROW` |
| This Week / Previous Week | datetime | `equal`, `PERIOD` name `THIS_WEEK` / `PREVIOUS_WEEK` |
| This Month / Previous Month | datetime | `equal`, `PERIOD` name `THIS_MONTH` / `PREVIOUS_MONTH` |
| This Year / Previous Year / Next Year | datetime | `equal`, `PERIOD` name `THIS_YEAR` / `PREVIOUS_YEAR` / `NEXT_YEAR` |

Interim boundaries and empty-value behavior:

- Empty means `null` or exactly `""`; missing row fields evaluate as null. Whitespace
  is populated. Empty predicates use `null` as the unused criterion value, including
  booleans and reference fields; false and zero are populated.
- Empty text passes `not_equal` against a populated string and `not_contains`;
  empty picklist/owner values pass negative membership. Empty numbers match only
  `not_equal` among numeric comparisons; they fail both range operators.
- Range endpoints are inclusive. Reversed or malformed ranges fail validation.
- N is a nonnegative integer. `AGEINDAYS` keeps
  `floor((now - field) / 86_400_000) <= N`, including its existing future-date behavior.
  `DUEINDAYS` means `now < field <= now + N * 86_400_000`; N=0 matches nothing.
- Calendar periods use UTC and half-open `[start, nextStart)` intervals. Weeks
  start Monday 00:00 UTC. Months/years use calendar boundaries, including year
  rollover and leap days. Till Yesterday is before today's UTC midnight; Starting
  tomorrow includes tomorrow's UTC midnight and all later dates.
- Null or unparseable datetimes never match date tokens. TODAY retains its existing
  UTC-day boundary. Runtime clocks resolve tokens on each query.
- Role/group membership, blocked email, arbitrary date offsets/dates/ranges,
  fiscal periods, system filters and related-module filters are not introduced.


`ListQuery.fields` projects field API names, always including `id`. Omission
returns all fields; an empty list returns only `id`. Unknown names raise a
`ValidationError` keyed by `fields`. Projection happens after filtering and sorting.

Field values are JSON-compatible domain values: strings for text-like fields,
UTC timestamps, opaque single-module references, image references and long
integers; finite numbers for integer/decimal/currency fields; booleans for checkbox
fields; `{ module, id }` for connected-module references; and null for empty fields.
Long integers use strings to avoid precision loss. These representations specify
neither HTTP payloads nor physical storage.

## Current delivery status

The port, fixture adapter, reusable contract suite and application selection point
are implemented. The fixture publishes all 56 Leads fields and 14 configured views.
It generates 250 deterministic synthetic records using a fixed seed and a clock.
`createFixtureRecordService(context, options?)` takes an optional `now: () => Date`
(default: the system clock) for seed times, create/update timestamps and date tokens.
Organization
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
validation failures. `Owner` accepts an organization member user ID on create
and update; omission on create defaults to the bound user. Null, empty or unknown
Owner IDs raise `ValidationError` keyed by `Owner`. Created_By and Modified_By use
the bound user and remain unwritable; Full_Name is computed. System-generated
fields unavailable on forms cannot be supplied by callers.
Lengths apply to strings/reference IDs and numerical digits (sign and decimal
separator excluded, exponent notation expanded). No email/phone syntax or
unobserved decimal-place validation rule is added.

Unknown modules, views and records raise `NotFoundError`. Validation raises
`ValidationError` with field API names (query failures use page/perPage/sort/filters).
A future uniqueness violation must use the existing `ConflictError`. This Leads
fixture has no unique fields and permits duplicate Email on create and update.
Returned metadata, views, records and nested values are detached copies; write
inputs are copied before storage. Bulk delete validates every ID before deleting. `delete`, `massUpdate` and
`changeOwner` require 1–500 IDs. `massUpdate` accepts exactly one writable field
whose massUpdate flag is true, with the same value/required/length/type/picklist
validation as update. `changeOwner` accepts an active organization member ID;
removed/unknown/foreign owners fail under Owner. All three batch writes are atomic:
unknown/foreign IDs fail with NotFoundError before any write. This atomicity remains
Interim until per-record failure behavior is documented (ADR 0004 §5).
ValidationError has an optional internal reason (`invalid`, `mandatory`, `limit`)
to distinguish error wire codes without inspecting translated message text.

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

## Recorded sort behavior

These points are evidence, separate from the interim policies below.

- None of the 14 views stores a sort. Saved `sort_by` and `sort_order` are null on
  every definition in `research/specs/list-views.md`. MEP-71.
- Applied order is `query.sort`, otherwise the view's `sort`, otherwise record id
  descending (`{ field: "id", order: "desc" }`). Identifiers are decimal text and
  compare as `BigInt`. The id-descending default was observed on the five views
  that held records when captured (All Leads, Mailing Labels, My Leads, Open Leads,
  Unread Leads): no list request carried a sort parameter and each response
  reported `info.sort_by` `id`, `info.sort_order` `desc`. The other nine views were
  empty and answer 204 with no body, so the same rule is an assumption for them.
  See `research/specs/list-views.md` › Saved and response sort evidence.
  MEP-71.

## Interim fixture policies (not reference parity)

These CTO-approved policies permit development while research is pending. They are
not evidence of reference CRM behavior and must not determine screen parity.

- A criteria leaf whose field is absent from module metadata is still published on
  the view, and evaluation treats that leaf as matching every record.
  `Common_Status` is that field on the recent and unread views. Open question 12
  in `research/specs/list-views.md`.
- `TODAY` matches when the field's UTC calendar day equals the adapter clock's UTC
  calendar day. Open question 14 in `research/specs/list-views.md`.
- `AGEINDAYS` with `less_equal` matches when
  `floor((now − field) / 86_400_000) <= offset`. A null or unparseable field does
  not match. Open question 13 in `research/specs/list-views.md`.
- Create sets read-only `Converted__s` and `Locked__s` to false so a new lead is
  unconverted and unlocked. Callers cannot write those flags, and null would not
  match `equal false`. What sets the flags in the reference CRM is open question 16
  in `research/specs/list-views.md`. `Email_Opt_Out` stays null unless the caller
  sends it.
- Search trims input; blank means no restriction. Otherwise it matches a
  case-insensitive substring (`toLowerCase`, no locale) in Full_Name, Company,
  Email or Phone. It combines with view criteria and filters using `and`.
- Full_Name is recomputed at create/update by joining populated Salutation,
  First_Name and Last_Name in that order with a single separating space. This
  follows the one observed record in `research/specs/record-detail.md`; empty-name
  cases remain interim. Input string normalization is unchanged.
- Create/update normalize exactly empty strings (`""`) in string-valued fields to
  null before validation and storage. Strings are not trimmed; required-field
  validation and type checks for non-string fields are unchanged.
- Synthetic Lead_Source values use published stored values or null, excluding
  the `-None-` placeholder. First_Name includes populated and null values;
  Full_Name follows the same composition rule as writes.
- Seeded Owner, Created_By and Modified_By are assigned to the user who first
  opens the organization's store. Opening it as another user does not reassign
  existing records. The pure seed generator is independent of user context.
- Business-card selection is `Owner`, `Email`, `Phone`, `Mobile`, `Lead_Status`,
  following the observed detail card. The metadata export carries the five-field
  limit but not the selected five; the fixture selection remains interim.
- Without `FixtureRecordServiceOptions.listMemberIds`, the fixture regards users
  from authorized contexts opened in that synthetic organization as its members.
  The application selection point supplies the live `listMembers(ctx)` IDs on
  every explicit Owner write, so removed and foreign members are rejected without
  introducing a database dependency into the standalone fixture.
- Effective sort follows Recorded sort behavior above. All metadata fields are
  accepted for sorting; the nine metadata-ineligible fields are not separately
  rejected until the Sort By menu is researched. Callers were not observed sending
  `id`, and the port does not add a special allowance: `id` is already a module
  field. Invalid sort or filter fields, unknown comparators and comparator/type
  mismatches raise keyed validation errors. Equal values keep the default
  id-descending order. That tie break remains interim.
- Numbers compare numerically, booleans false before true, strings by lowercase
  code-unit order (no localeCompare/Intl), timestamps chronologically, object
  references by ID. Equal values preserve id-descending order. Null and empty
  strings sort last in either order.
- Page must be a positive integer and perPage one of 10, 20, 30, 40, 50, 100.
  Beyond the last page, records are empty and moreRecords is false.

## Deferred

- Country/State option inventories and their dependency. Both are picklists with
  maxLength 120 and no picklist property; seed values are null. MEP-18 tracks these
  questions and placeholder storage.
- Unsubscribed Mode deliberately publishes 3 of 4 options, in spec order. The
  fourth contains a forbidden product name and cannot enter this repository.
  Unsubscribed_Mode/Unsubscribed_Time are system-managed and seeded null.
- Mailing Labels selects five columns absent from Leads field metadata:
  `Old_Street`, `Old_City`, `Old_State`, `Old_Country`, `Old_Zip_Code`. They are
  not published. The captured table shows Salutation, Lead Name and Company
  (`research/specs/list-views.md` › Fields absent from the Leads field metadata).
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
- Three custom views keep the `CATEGORY` token. The fixture resolves it from Lead
  Status picklist categories at query time (Open, Junk, Not Qualified). Empty
  status is not a member of those categories.
- Replace interim search, date-token, unknown-field and tie-break policies when
  researched. Applied panel filter requests/results and sortable menu entries remain open. Saved
  view criteria and the recorded default sort are no longer open.
- Add metadata-driven uniqueness enforcement using ConflictError and a genuine
  rejection contract test with the first authorized unique-field scope.

## Deliberately excluded

Storage, schemas/migrations, identity-generation strategy, HTTP paths/methods,
authorization and role rules, event processing, routes, screens, conversions,
other bulk actions, import/export and non-Leads modules are outside this delivery.
The database package and route tree remain unchanged. No dependencies are added.
