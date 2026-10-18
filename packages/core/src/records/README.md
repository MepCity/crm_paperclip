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
| age in N weeks / months | datetime | `less_equal`, `{ token: "AGEINDAYS", offset: N, unit: "weeks" \| "months" }` (**Interim**) |
| due in N days | datetime | `less_equal`, `{ token: "DUEINDAYS", offset: N }` |
| due in N weeks / months | datetime | `less_equal`, `{ token: "DUEINDAYS", offset: N, unit: "weeks" \| "months" }` (**Interim**) |
| Previous N unit | datetime | `equal`, `{ token: "RELATIVE", direction: "previous", count: N, unit }` (**Interim**) |
| Next N unit | datetime | `equal`, `{ token: "RELATIVE", direction: "next", count: N, unit }` (**Interim**) |
| On | datetime | `equal`, `"YYYY-MM-DD"` (**Interim**) |
| before / after | datetime | `less_than` / `greater_than`, `"YYYY-MM-DD"` (**Interim**) |
| between / not between | datetime | `between` / `not_between`, `["YYYY-MM-DD", "YYYY-MM-DD"]` (**Interim**) |
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
  Optional `unit` `weeks` multiplies the day window by seven; `months` means
  `field >= now - N calendar months` (short months use the month's last day).
  `DUEINDAYS` means `now < field <= now + N * 86_400_000`; N=0 matches nothing.
  Week and month due windows use the same multipliers and calendar addition.
- `RELATIVE` uses half-open UTC intervals over N complete prior or next units;
  `Previous 1 days` matches `PERIOD.YESTERDAY`, `Previous 1 weeks` matches
  `PERIOD.PREVIOUS_WEEK`, and `Next 1 days` matches `PERIOD.TOMORROW`.
- Calendar date strings are strict `YYYY-MM-DD` values; `On` is the UTC day
  interval, `before` is strictly before that midnight, `after` is from the
  next midnight onward, and `between` is inclusive at both calendar ends.
- Calendar periods use UTC and half-open `[start, nextStart)` intervals. Weeks
  start Monday 00:00 UTC. Months/years use calendar boundaries, including year
  rollover and leap days. Till Yesterday is before today's UTC midnight; Starting
  tomorrow includes tomorrow's UTC midnight and all later dates.
- Null or unparseable datetimes never match date tokens. TODAY retains its existing
  UTC-day boundary. Runtime clocks resolve tokens on each query.
- Role/group membership, blocked email, fiscal periods, system filters and
  related-module filters are not introduced except for the interim Campaign system filter. `multi_module_lookup` keeps only
  empty / not-empty panel predicates.


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
are implemented. The fixture publishes all 56 Leads fields and 14 configured views,
plus all 61 Contacts fields and 10 configured views. Each module keeps its own
in-memory record set. It generates 250 deterministic synthetic records per module
using a fixed seed and a clock.
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
A uniqueness violation uses `ConflictError`. The Leads fixture has no unique fields
and permits duplicate Email on create and update. Contacts publishes `Email` as
unique (case-insensitive); create, update and mass update reject another record in
the same organization with the same email, while null or empty email does not
collide and other organizations remain isolated.
Returned metadata, views, records and nested values are detached copies; write
inputs are copied before storage. Bulk delete validates every ID before deleting. `delete`, `massUpdate` and
`changeOwner` require 1–500 IDs. `massUpdate` accepts exactly one writable field
whose massUpdate flag is true, with the same value/required/length/type/picklist
validation as update. `changeOwner` accepts an active organization member ID;
removed/unknown/foreign owners fail under Owner. All three batch writes are atomic:
unknown/foreign IDs fail with NotFoundError before any write.
`update`, `massUpdate`, `changeOwner` and `delete` reject records whose `Locked__s`
is true with `RecordLockedError` (wire `RECORD_LOCKED`, HTTP 400). A locked target
in a batch leaves every record unchanged, including modification fields.
Update and ownership changes use the spec's update error message; delete uses
its delete message. Ownership-specific wording remains unobserved. This atomicity remains
Interim until per-record failure behavior is documented (ADR 0004 §5).
ValidationError has an optional internal reason (`invalid`, `mandatory`, `limit`)
to distinguish error wire codes without inspecting translated message text.

## Adapter verification

Import `describeRecordServiceContract` from `@crm/core/records/contract-suite` in a
test file and provide a factory accepting `OrgContext` (synchronous or asynchronous):

```ts
import { leadsRecordServiceContractModule } from "@crm/core/records/contract-suite-module";

describeRecordServiceContract(
  "adapter",
  (ctx) => createRecordService(ctx),
  leadsRecordServiceContractModule,
);
```

For another module, add a `RecordServiceContractModuleDefinition` (API name, labels,
`buildMinimalValidInput`, `systemFields`, `filterMarker`, sort fields,
`expectedUniqueFields` when uniqueness should be asserted, and any `optional`
scenario blocks your adapter supports) beside the Leads one and pass it as the
third argument. Connected-module sample IDs live only under `optional.connectedLookup`;
the suite body stays module-neutral.

The suite invokes only public methods. When `optional.lockedRecords` is defined,
the adapter harness must provision at least one locked synthetic record discoverable
through an equality filter on its configured `field`; callers cannot set that
system-managed flag. Missing locked records fail the scenario explicitly. Without
that definition, locked-record scenarios are not registered. Each test gets a fresh synthetic organization;
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

- Leads Country/State inventories remain deferred; those fields have maxLength
  120 and no picklist property. Contacts and Accounts share the exported 248-country
  and 3,954-state catalogs. Country-to-state dependency behavior remains unobserved;
  no dependency constraint is inferred. Seed address values remain null.
- Unsubscribed Mode deliberately publishes 3 of 4 options, in spec order. The
  fourth contains a forbidden product name and cannot enter this repository.
  Unsubscribed_Mode/Unsubscribed_Time are system-managed and seeded null.
  Contacts publishes the fourth Unsubscribed_Mode stored value under neutral
  wording (`reference CRM campaigns`) so the picklist inventory stays complete.
- Mailing Labels selects five columns absent from Leads field metadata:
  `Old_Street`, `Old_City`, `Old_State`, `Old_Country`, `Old_Zip_Code`. They are
  not published. The captured table shows Salutation, Lead Name and Company
  (`research/specs/list-views.md` › Fields absent from the Leads field metadata).
  The Contacts Mailing Labels view omits the same five legacy address columns
  because they are absent from the Contacts field export.
- The reference's storage of the -None- placeholder is unverified. Published lists
  include it, but the fixture represents empty picklists with null.
- Leads has unique=false on every field. Contacts Email uniqueness is enforced in
  the fixture and covered by the contract suite and module tests.

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
- Extend metadata-driven uniqueness beyond Contacts Email when later modules publish
  additional unique fields.

## Deliberately excluded

Storage, schemas/migrations, identity-generation strategy, HTTP paths/methods,
authorization and role rules, event processing, routes, screens, conversions,
other bulk actions, import/export and non-Leads modules are outside this delivery.
The database package and route tree remain unchanged. No dependencies are added.

`getHomeCurrency(): Promise<CurrencyDefinition>` returns the organization home currency (ISO code, configured symbol, name and prefix flag); no locale-derived symbol.

## Calendar dates and record references

`date` values are real calendar days formatted as `YYYY-MM-DD`, without a timezone.
Invalid dates raise `ValidationError`. Sorting follows calendar order. Date filters
accept the same operators and tokens as datetime filters, evaluated at day precision
using the existing UTC calendar rules.

Every `lookup` value is `{ module, id, name? }`; `module` must match the field's
`lookup.module`. `ownerlookup` remains a user ID string. `multi_module_lookup`
uses the same reference shape and permits `name`; its existing reference-presence
empty checks, ID sorting and text-operator restrictions remain unchanged.

For single-module lookups with registered target modules the fixture validates existence in the bound
organization on create, update and mass update, and derives the read name from the target record,
ignoring caller names. On get, list and count, a registered-module reference whose target no longer
exists is returned as `null` instead of raising an error. Each fixture module bundle declares `displayNameField` (Leads and Contacts:
`Full_Name`); public `ModuleMetadata` does not change.
Accounts is registered with `Account_Name` as its display name. Contacts Account Name and
Accounts Parent Account validate targets within the bound organization. Vendors remains
unregistered: references are stored and returned as supplied, without target validation.
Lookup equality accepts an opaque target ID for related Contacts and Member Accounts queries;
existing name filters remain available.
Open question: Parent Account self-reference and cycle validation are unobserved and not enforced.
Accounts reuses Contacts country/state catalogs and exposes read-only Billing/Shipping address
and coordinate composites with independently writable child fields, following the Contacts pattern.
Accounts business-card fields and the eight writable information rows follow
`research/specs/accounts-record-detail.md` and `research/specs/accounts-form.md`.
Offscreen system-field column assignment, search fields and id-descending default
for null-sort views remain interim. Owner retains the existing membership-validated
write behavior despite the export's secondary field-read-only flag. Single-module lookup sorting
and text filters use `name`; a missing name behaves as empty. The wire codec
represents single-module lookups as `{ id, name? }` and restores the module from
field metadata. Dates remain strings; metadata publishes `data_type: "date"`.
The three Leads conversion lookups remain read-only.

Deals validates and resolves Account_Name and Contact_Name against registered fixture modules; lookups into unregistered modules, including Campaign_Source, remain unchanged. The metadata export contains no separate pipeline definition or selected business-card fields.

## Search and duplicates

`search` searches every registered module unless `modules` restricts it, using
trimmed, case-insensitive substring matching (three characters minimum). Name
scope searches only the computed record name. Paging defaults to page 1 and 30
rows per module; positive integer page sizes are accepted. Totals precede paging,
and a matching module remains present when the requested page is empty. Filters,
sort and projection apply independently. Discovery and list use the same
organization-scoped read path; discovery does not apply saved-view criteria.
The current fixture metadata has no multi-selection, automatic-number or formula
fields; the search helper recognizes the former two and skips absent fields.
`fields`, `sort` and `filters` are validated against every module the call visits.
Without `modules` that is all registered modules, so a name only one module knows
raises `ValidationError` for the whole call (keyed `fields`, `sort` or `filters`).
Callers that use a module-specific field select that single module with `modules`.

`findDuplicateGroups` requires one to three distinct known fields, with nonempty,
case-insensitive equality on every selected field. Conflicts compare nonempty
business values, read-only fields included: the merge cannot select those either,
but a differing read-only value still tells the records apart. System attribution,
the computed record name, `id` and the `Locked__s` write-lock flag stay out of the
comparison — the lock is an access flag, never a value a caller chooses. Blank
business values are filled from the group, except a lookup whose value names a
record of that same group: the automatic fill never hands the master a pointer at
itself or at a duplicate about to disappear. Lookup identity is the referenced module
and ID, independent of name.

`merge` accepts a master and one or two distinct duplicates in its bound module
and organization. It applies update validation and the existing update/delete
lock checks to every participant. The fixture currently has no finer record ACL;
these checks are the same as existing update/delete, not a new permission model.
All lookup redirections and unique-field checks are prepared before any write.
The duplicates disappear permanently; selected values overwrite the master,
other values remain. Every lookup that pointed at a removed duplicate is
redirected to the master, except on the master itself: that field is not turned
into a self-pointer, it becomes `null`. A value given explicitly in `values`
still wins whenever it targets a record that survives — and a self-pointer the
caller names explicitly is kept, because `merge` validates references by the same
rule as `update`, which allows it. Only the automatic path guarantees that a master
never ends up pointing into its own group. Creation attribution comes
from the oldest participant; modification attribution uses the caller and the
merge clock.

`deduplicate` requires the existing `admin` role and holds an organization/module
lock shared by all service instances until success or failure. Groups with no
business conflicts and at most three records merge automatically. Latest
activity chooses the master, then latest modification breaks missing/tied
activity. Other groups return unchanged as `conflicts`. So does a group whose
automatic merge is rejected by a record lock or a unique-value collision: the
run moves on to the next group and `mergedGroups`/`removedRecords` count only
the groups that really merged, so one rejected group never aborts the call or
leaves earlier merges unreported. Any other merge failure is a bug and still
rejects the call. Notes, attachments, activities, automation and queued large
merges remain outside this adapter.

## Deals stage rules — interim

The single pipeline uses Stage picklist order and its exported stage probabilities
and categories. Create without Probability, or a changed Stage without Probability
in the same input, applies the stage probability. An explicit Probability wins and
must be an integer from 0 through 100. Expected_Revenue is read-only: supplying it
raises the existing field ValidationError. Every Deals write derives it as
Amount × Probability / 100, rounded to two decimals; empty Amount yields null.
Reason_For_Loss__s can only be supplied for a target stage in the Closed Lost
category (including Closed Lost to Competition). It is optional and cleared when
leaving that category. Closed deals can be reopened without extra validation.

Interim rules fixed for this implementation, because writes in the reference CRM
are forbidden and these outcomes have not been observed:

- When automatic stage probability is applied; explicit probability preservation.
- `Probability: null` in the input means not provided: stage default on create or
  stage change, otherwise the existing probability is kept.
- Probability integer range 0–100 applies only to non-null provided values.
- Expected revenue formula and two-decimal rounding; `summarize` sums use the same
  two-decimal rounding for currency and numeric amount fields.
- Reopening a closed deal without additional validation.
- Initial history creation and appending only when the stage actually changes.
- History calendar-day differences use UTC dates, independent of elapsed hours.

DealHistory is a read-only module with the twelve exported fields. All public
mutation methods reject it with ForbiddenError. Creating a deal adds its first
snapshot; changing Stage adds a snapshot of Stage, Amount, Probability,
Expected_Revenue, Closing_Date, Modified_By and Modified_Time, updates
Stage_Modified_Time, and closes the previous snapshot with Moved_To__s and
Stage_Duration_Calendar_Days. The active snapshot has null duration/moved-to.
Other writes derive revenue without appending history. Deleting a deal removes
its history. Synthetic seeds include several two-stage histories.
Read with list/count, view `all-deal-history`, and a Potential_Name equality
criterion containing the deal ID string; the default sort is
Modified_Time descending. Global search defaults retain the writable CRM modules;
DealHistory can be searched explicitly.

## Group summaries

`RecordService.summarize(module, query)` accepts `viewId`, optional `filters` and
`search`, required `groupBy` (picklist API name), and optional `sum` (currency,
integer or double API name). It uses the same matching rules as list/count and
has no sorting or pagination. It returns `readonly GroupSummary[]`, one
`{ value, count, sum }` per stored picklist option in metadata order, including
empty groups. A null-value group is appended only when matching rows have an
empty grouping field. Without sum, sum is null; with sum, an empty group sums to
zero. Unknown or incompatible fields raise ValidationError.

HTTP: `POST /crm/v2.2/{module}/actions/grouped_counts?cvid=<view>&group_by=<field>&sum=<field>`.
The optional JSON body carries the same `filters` and `search` as actions/count;
the response is `{ groups: GroupSummary[] }`. Sum may be omitted. This local DTO
and query shape are interim; no reference write or saved preference is required.
The HTTP adapter implements the same port, and the shared module contract suite
checks summary/list/count parity for Leads, Contacts, Accounts and Deals.

## Tasks and the shared activity foundation

Tasks is registered with all 20 exported fields, layout columns, Status/Priority
options and 17 saved views. Subject remains free text; its exported suggestions
are preserved in `tasksPicklists` without making the text field a picklist.
Seeds contain 250 deterministic synthetic tasks linked directly to existing
Leads, Contacts, Accounts and Deals, including multiple tasks on one record,
records without tasks, one-sided references, and every Status/Priority value.
Existing module seeds are unchanged. All null view sorts use the shared
id-descending default.

### Multi-target references

`lookup.module` remains the default target. Optional `lookup.modules` lists
allowed targets and contains that default. `lookupTargetModules(field)` is the
shared accessor used by validation and resolution. Single-target wire values
retain `{id,name?}`; multi-target values carry `{module,id,name?}` so the target
survives HTTP round trips. Metadata returns both the default and target list.

The sanitized `fixture/tasks/related-targets.json` source table retains only
module names and structural hrefs from the export. A row qualifies when its
related module is Tasks and href is `<source module>/{ENTITYID}/Tasks`.
What_Id targets are derived from qualifying source rows except Leads/Contacts;
its default is Accounts. Who_Id defaults to Contacts and temporarily permits
Contacts/Leads, in one constant (`tasksWhoTargets`). The shared resolver rejects
unlisted modules and missing records in registered modules on create/update;
it derives names from target display fields. Deleted targets read as null in
get/list. Allowed unregistered modules retain their supplied references,
including names, without an existence check. No Tasks-specific resolver exists.

Direct related reads use existing list/count criteria:

```ts
const filters = {
  field: "Who_Id", // Leads/Contacts; use What_Id for Accounts/Deals
  comparator: "equal",
  value: { module: "Contacts", id: recordId },
} as const;
await records.count("Tasks", { viewId: "open-tasks", filters });
```

Reference equality compares both module and opaque id, ignoring supplied name.
Open/closed reads add Status not_equal/equal Completed, or use open-tasks and
closed-tasks. Completed is supported by the exported Closed Tasks view; this
query boundary does not implement a completion transition. Contact tasks are
not additionally inferred onto their Account.

### Opaque object fields and view boundaries

ALARM (`Remind_At`) and RRULE (`Recurring_Activity`) accept null or plain JSON
objects with finite numbers, strings, booleans, nulls, nested objects/arrays.
Objects are cloned on writes/reads and retained by deep value equality. Field
dataType determines whether a value is an object or reference. Arrays/scalars,
cycles and non-JSON members are invalid top-level values. Other field types
retain their existing validation. These fields cannot be filtered or sorted.
No reminder delivery, email notification or recurrence generation is performed.

Saved-view tokens convert exactly: CURRENTUSER/TODAY are existing tokens;
TOMORROW maps to PERIOD TOMORROW; YESTERDAYMINUS to PERIOD TILL_YESTERDAY.
New NEXT7DAYS means overdue through UTC calendar day +7 inclusive;
TODAYANDOVERDUE means through today inclusive. Both use less_equal and exclude
null dates. NEXT7DAYS deliberately differs from DUEINDAYS, which excludes
past/today dates. Boundary tests include overdue, today, tomorrow, +7 and +8.
Source views preserve BEST_TIME; published columns omit only this undefined
column through the explicit `tasksDroppedColumns` exception, in seven views.
All remaining column order is preserved, and no 21st field is synthesized.

### Open questions and temporary decisions

- MEP-427 form research must confirm Leads on Who_Id; this is the CTO's temporary
  routing decision because related lists do not identify the linking field.
- The export supplies no inner key names/types for ALARM/RRULE. Keys remain
  opaque; MEP-427 research will inform a separate schema-tightening issue.
  Test JSON payloads are synthetic examples, not proposed reminder/repeat schemas.
- MEP-425 detail research must explain BEST_TIME. Its projection exception stays
  visible in source and tests until a separate decision supplies its meaning.
- Completed defines closure for these queries; actual completion, reminder and
  recurrence flows await their own research/implementation.

### Adding Events and Calls with this pattern

1. Read the module's exported fields, layout, picklists and detailed saved views;
   retain structure only and replace source identifiers with local fixture IDs.
2. Extract a sanitized related-target table using that activity's module name and
   href suffix. Derive What_Id targets from it, and use approved Who_Id targets.
   Keep `lookup.module` for existing consumers and use `modules` for multiple
   allowed targets. Reuse shared validation/resolution without module branches.
3. Add deterministic synthetic seeds referencing existing fixture records and
   register a bundle with display field, managed fields, defaults and id range.
4. Convert criteria with exact calendar boundaries; record undefined projection
   columns explicitly. Reuse list/count criteria for direct related reads.
5. Define a module contract-suite configuration, including a separate mass-update
   scenario when the filter marker is ineligible (Tasks uses Priority).
   Add exported field/picklist tables, lookup lifecycle, related reads and generic
   CRUD handler/HTTP round-trip tests.
6. Opt into opaque array values with `acceptsJsonArray` only on approved fields.
   Events uses the contract below; preserve the exported dataType independently.
   Neither activity executes reminder or recurrence rules in its fixture.


## Events (Meetings)

Events publishes all 34 exported fields, two one-column layout sections, and 11
saved views with unchanged criteria and column order. API name is Events; labels
are Meeting / Meetings. Meeting_Venue__s keeps In-office, Client location, Online
in export order. Meeting_Provider__s has no exported options and publishes an empty
picklist. Required fields are Event_Title, Meeting_Venue__s, Start_DateTime and
End_DateTime. Venue is the only exported mass-update field.

`acceptsJsonArray` on FieldDefinition is an acceptance policy, not a copy of
`json_type`. It returns in metadata (wire `accepts_json_array`) and permits null or
opaque readonly JSON arrays on Remind_At and Remind_Participants (multireminder).
Participants keeps its exported bigint dataType and acceptsJsonArray metadata,
but its write contract has changed **opaque → typed**. Each item is
`{ type: "user" | "lead" | "contact" | "email", id: string | null,
name: string, email: string | null }`. At most 50 items are accepted. User,
lead and contact items require a nonempty id; email items require a nonempty
email. Lead/contact IDs must exist in the bound organization. Unknown keys
are discarded on write; invalid items return ValidationError on Participants.
A null field and an empty array remain valid. Reminder items remain arbitrary
plain JSON. Arrays are detached on writes and reads; equality ignores object
key order and preserves array order. These fields cannot be filtered or sorted.

Tasks set Closed_Time at the write instant when entering Completed and clear
it when leaving Completed. Writes while already Completed preserve it.
Closed_Time is system managed. Meetings require Start_DateTime and End_DateTime;
end before start returns ValidationError on End_DateTime. Provisionally,
All_day normalizes the respective UTC dates to 00:00:00 and 23:59:59.

Scheduled Calls with a past Call_Start_Time read as Overdue without changing
storage; list/count filters see the same derived status. Completed calls
require Call_Duration in mm:ss format (two or more minute digits, seconds
00–59); Call_Duration_in_seconds is derived on write. Cancelled remains a
status and retains the record.

CURRENTTIME maps exactly from `${CURRENTTIME}`. The runtime adapter clock resolves
it anew for each query, using the exact instant without day rounding. Only datetime
fields and less_than, less_equal, greater_than, greater_equal accept it. Null or
unparseable dates never match. Four exported completed/upcoming views use it.
`${THISWEEK}` maps to PERIOD THIS_WEEK; TODAY and CURRENTUSER retain their mapping.

The 250 deterministic synthetic meetings include all-day/timed, past/future,
empty/populated arrays and direct references to seeded Leads, Contacts, Accounts
and Deals. Participants use the typed shape above; reminder JSON is invented test data. Existing module seeds remain unchanged. Null view sorts use id descending.
Who_Id temporarily allows Contacts/Leads, in eventsWhoTargets. What_Id targets
come from qualifying `<source module>/{ENTITYID}/Events` rows in the sanitized
related-target table, excluding Who_Id targets; its default is Accounts. The
common resolver handles allowed unregistered targets and deleted target reads.
Read related meetings with list/count on all-meetings and Who_Id or What_Id
reference equality, including both module and id. No separate open/closed related
list rule is introduced.

Open questions and temporary decisions:

- The export has four jsonarray fields. Tag is the explicit exception: it keeps
  text, create/edit disabled, and rejects arrays, as the existing five modules do.
  A separate common tag decision must reconcile that representation for all modules.
- Host_or_Participant is absent from the field dictionary. Its source criterion
  remains published on My Meetings and the existing missing-field evaluation rule
  matches every record. The fixture view therefore returns all meetings; this is
  not evidence of reference behavior and does not establish screen parity. No
  Participants schema or Owner substitution is inferred.
- Cancelled Meetings exports null criteria; My Cancelled Meetings exports only
  Owner equality. No cancellation state or transition is invented.
- End-time saved views do not establish the rule for open/closed related lists;
  that boundary still requires research. Who_Id Leads routing awaits form research.
- Reminder delivery, participant invitations/notifications, recurrence generation,
  check-in transitions, database adapter and screens remain outside this definition.

## Calls

Calls follows the Tasks pattern (`fixture/calls/`): sanitized export metadata,
picklists, views, deterministic seed and a derived related-target table.

- **Fields / views:** 26 fields (Call_Type, Call_Start_Time and Call_Duration are
  required), 4 layout sections, 6 picklists (`Call_Type`, `Call_Purpose`,
  `Call_Result`, `Reminder`, `Outgoing_Call_Status`, `Scheduled_In_CRM`) and 23
  system views with a null sort (shared default order applies).
- **Targets:** `Who_Id` = Contacts, Leads (temporary rule, same constant as Tasks,
  kept in `callsWhoTargets`). `What_Id` = the `Calls` rows of
  `related-targets.json` minus the Who targets: Accounts, Campaigns, Cases, Deals,
  Invoices, Products, Purchase_Orders, Quotes, Sales_Orders, Vendors. Resolution
  reuses the shared multi-target reference code; no Calls-specific resolver.
- **Related reads:** "calls of this record" is `list`/`count` with a `Who_Id` or
  `What_Id` equality filter; unit tests cover Leads, Contacts, Accounts, Deals.
- **Seed:** 250 synthetic calls (ids from 150000000000000000; next id range
  160000000000000000), every picklist value used, linked to seeded Leads,
  Contacts, Accounts and Deals; other modules' seeds are unchanged.
- **Interim rules:** the source `${EMPTY}` token is projected to `is_empty`; the
  integer criterion value `"0"` becomes a number; a source column listed
  twice (Completed Calls: Call_Start_Time) appears once. `Owner` is exported with
  `read_only: true` but `field_read_only: false`; it stays writable here because
  the shared ownership change writes it.
- **Not covered:** call logging/scheduling rules, duration calculation, reminders,
  CTI. Reminder is a plain picklist. There is no HTTP layer in the repository yet;
  generic CRUD is verified through the module-independent contract suite and the
  service-level tests.
- **Open questions:** (1) whether an open/closed call split exists beyond the
  exported view criteria (Scheduled / Overdue / Completed on
  `Outgoing_Call_Status`); none is encoded. (2) Whether `Who_Id` should allow more
  than Contacts and Leads (export lists only Contacts; Leads kept as for Tasks).

## Activity summaries and system filters (interim)

Parent modules Leads, Contacts, Accounts and Deals accept optional `activityFilter`
on list/count/summarize. `ActivityFilterValue` uses the five choices
`without_open_activity`, `overdue`, `without_any_activity`, `activity_done`, and
`activity_due` with `today`, `tomorrow`, `next_7_days` or `today_overdue`.
All restrictions combine with saved-view criteria, field filters and search.
Other modules reject an activity filter with `ValidationError.activityFilter`.

`ListQuery.includeActivitySummary` adds `ListResult.activitySummaries`, keyed only
by returned-page parent IDs with open activities, independently of field projection.
Without the flag this field is absent; non-parent modules return an empty map.
The earliest dated open activity wins; null dates come last; equal timestamps
(including all-null dates) prefer task, meeting, call. Returned summaries contain
`kind`, `activityId`, `date` and are detached from storage.

The pure `activityState(module, record, now)` and `activityDate(module, record)`
helpers are exported from `@crm/core/records/activities`, preserving the existing
root entry point's runtime export boundary and its unchanged assertions.
Tasks are open unless Status is Completed. Events are open only when End_DateTime
is strictly after now. Calls are open only for Outgoing_Call_Status Scheduled or
Overdue; missing/other values are closed. Dates come from Due_Date,
Start_DateTime and Call_Start_Time respectively. Unknown modules are closed and
have no activity date. These are CTO-approved temporary rules; reminders and
recurrence remain opaque and never execute.

Activities are read from registered Tasks/Events/Calls stores in the bound
organization. Unregistered modules are ignored. Parent links match both module
and opaque ID: either Who_Id or What_Id, using the shared activityParentIds helper.
Without Open Activity means no open activity; Without Any Activity means none
of either state; Activity Done means at least one closed activity. Overdue means
an open date before today's UTC midnight. Today and Tomorrow use half-open UTC
day intervals. Next 7 days includes tomorrow through today+7, excluding today+8.
Today + Overdue includes all open dates before tomorrow's midnight. Null dates
never match date predicates, but still count as activities and may be summarized.
This uses the same UTC day boundary as existing service date tokens.

Wire requests add `activity_filter` and `include_activity_summary` to the existing
POST restriction body. Bulk responses add `activity_summaries` with per-ID
`{kind, activity_id, date}`; requesting summaries preserves an empty 200 envelope
so its empty map survives transport. Existing requests and empty 204 responses
are unchanged. These additive wire fields are interim, pending observed evidence.

Open questions: the reference CRM's applied-filter timezone/day boundary and
multi-activity badge precedence/date selection remain unobserved. The UTC boundary
and task/meeting/call tie order require confirmation at the module board gate.

Deleting Leads, Contacts, Accounts or Deals cascades to all registered Tasks, Events and Calls linked by either Who_Id or What_Id (matching module and ID), after validating every parent; child locks are ignored temporarily, merge and conversion do not cascade, and restore is out of scope.

## Campaigns

`Campaigns` publishes the 21 exported fields, two layout sections, Type/Status
picklists and four saved views. Null view sorting uses the common default sort.
The source table contains only sanitized field/layout/view structure. Tag keeps
the common text policy; Connected_To__s keeps the common multi-module lookup
shape. Expected_Response and Num_sent are stored bigint strings, not computed
statistics. Parent_Campaign is a self lookup; list/count with Parent_Campaign
equal to a campaign ID returns its immediate children. Interim cycle protection
rejects self-parenting and descendant-parenting with ValidationError.

`Campaign_Members` is a hidden child module, like Contact_Roles, available through
the existing generic CRUD, list and count paths. Campaign is required and exactly
one of Lead or Contact must be populated. Composite uniqueness uses the same
lifecycle validation mechanism as Contact_Roles: a campaign/member pair cannot
repeat, including on update. Campaign, Lead and Contact deletion removes its
membership rows atomically. Filter Campaign plus nonempty Lead/Contact for the
campaign's members, or filter Lead/Contact for the member's campaigns; each row
contains Campaign, the member reference and Member_Status. Deals.Campaign_Source
resolves Campaigns; filtering it returns campaign deals. Deleting a campaign
uses the common dangling-reference read policy (null) for Deals and child
campaigns, without deleting those records.

Interim/open questions:

- Member_Status has no default. Its single provisional constant lists Planned,
  Invited, Sent, Received, Opened, Responded, Bounced and Opted Out; replace it
  when membership research confirms the real options (MEP-755).
- Confirm the provisional campaign ancestor-cycle validation against research.
- Lead conversion is not implemented in this service. Transferring memberships
  to the resulting Contact remains open; no conversion code is added here.
- Unread Campaigns retains the exported Common_Status criterion although that
  field is absent from public metadata, following existing saved-view policy.

## Campaign system filter (interim)

Leads and Contacts accept `campaignFilter: { campaignIds, memberStatuses? }` on
list/count/summarize. Choose one to five distinct non-empty campaign IDs and,
optionally, a non-empty subset of the shared interim `campaignMemberStatuses`
export from `@crm/core/records/campaigns`. A record matches membership in any
selected campaign, narrowed by the status of that same membership. This combines
with saved-view criteria, field filters, search and activity filters using AND.
Membership and campaign reads use the caller's tenant and ordinary visibility;
unknown or inaccessible IDs produce no matches. Other modules and malformed
filters raise `ValidationError.campaignFilter`. The existing wire bodies carry
`campaign_filter: { campaign_ids, member_statuses? }`; no new endpoint is added.

## Recycle Bin search queries

`RecycleBinQuery.deletedByContains` matches a case-insensitive substring of the
stored deletion actor. Existing `deletedBy` retains exact, case-sensitive equality;
when both are supplied, both must match. An empty substring matches every visible
actor. Search predicates combine with module/name filters before pagination and
`total`; tenant and role visibility remain authoritative.

`deletedOn: { date: "YYYY-MM-DD", time?: "HH:mm" }` matches an entire calendar day
or, with a 24-hour time, one minute. Intervals include their start and exclude the
next day/minute. Invalid calendar dates, malformed times and malformed query
values raise the existing `ValidationError`, even for an empty bin.

Open questions: `OrgContext` currently has no user/organization timezone, so this
query uses UTC (including when a deletion instant originated in another offset).
The timezone source and reference CRM day boundaries need confirmation. RB-17 and
RB-19 establish only `contains` and `is`; other operators remain unobserved and
are not added. Deletion actor display-name resolution is outside this query port.
