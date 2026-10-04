# Record service port

The type-only `@crm/core/records` entry point defines the record service used by
Leads screens. A service factory binds an `OrgContext` once. Service methods take
module API names and opaque record identifiers, never organization identifiers.
`contract.ts` imports only the context type. Client components can import its
types without loading authentication, a database, or a server implementation.

The signatures follow the MEP-68 contract. Metadata expresses fields, ordered
picklist display/stored values, and layout sections with their ordered field API
names. List responses carry page information and `moreRecords`; total counts use
a separate method. Updates are partial. A view's criteria and extra filters are
combined using `and`.

Field values are JSON-compatible domain values: strings for text-like fields,
timestamps, opaque single-module references, image references, and long integers;
finite numbers for integer/decimal/currency fields; booleans for checkbox fields;
`{ module, id }` for connected-module references; and `null` for empty fields.
Long integers use strings to avoid precision loss. Adapters must validate values
against each field's data type. These representations do not specify HTTP payloads
or physical storage. The only observed comparator is `is`.

## Deliberately excluded

The port makes no storage, identity-generation, authorization, event-processing,
or HTTP design decision. No database schema, migration, dependency, route, or
screen is introduced by this preparatory change.

## Current delivery status

The type boundary is implemented and tested. The fixture adapter, reusable
behavioral contract suite, and application service entry point are pending a
specification clarification. They must not fabricate missing reference behavior.
This branch is not ready for screen integration or implementation approval.

Inputs used: `research/specs/leads-fields-and-layout.md`, the list specification
on `origin/mep/MEP-17`, `research/specs/app-shell.md`, ADR 0001, the existing context
and error types. No research metadata, captures, or live reference CRM was read.

## Screen usage after the adapter lands

A server component or route handler will obtain its already-authorized
`OrgContext`, call `getRecordService(ctx)` from the application library, and use
`getModule`, `listViews`, `list`, and `count` to render the screen. A client imports
`RecordData`, `ListQuery`, and other types from `@crm/core/records`. The application
library will be the only adapter selection point; it is not implemented yet.

## Adapter verification after clarification

The future `describeRecordServiceContract(name, makeService)` suite will accept
an organization-bound factory, exercise public methods only, and run against both
the fixture and future persistent adapter. It must test metadata, pagination,
queries, mutations, errors, system fields, tenant isolation, and detached return
values. It must not assume an adapter's internal collection or insertion order.

## Specification blockers

- Country and State have 248 and 3954 options respectively, but neither list is
  published in the permitted field spec. The fourth Unsubscribed Mode value is
  intentionally withheld. A full picklist metadata fixture cannot be reproduced
  or validated from these inputs alone. Do not read the underlying export.
- The list spec names eleven system views but does not publish the criteria for
  them. It confirms columns for the default and one unnamed second system view;
  column sets for the other system views are unknown. A name is not evidence of
  its predicate. The three custom views have category-based status criteria.
- Module-local search scope, applied sort behavior, null ordering, and the exact
  sortable menu are explicitly unverified. The fixture needs an approved policy
  or additional spec evidence rather than an undocumented parity claim.
- All 56 Leads fields have `unique: false`, and duplicate email is explicitly
  allowed. A Leads-only factory cannot demonstrate a genuine uniqueness
  rejection without changing metadata or inventing another module. The requested
  uniqueness test needs a clarified adapter-independent test setup.

## Open points for ADR 0002

- Preserve this domain port for every storage option; adapters must detach returned
  objects and isolate all operations using their bound context.
- Preserve opaque IDs and lossless long integer strings across implementations.
- Define how category-based criteria are represented and evaluated without losing
  the distinction between stored Lead Status values and record categories.
- Keep search scope, null ordering, and supported sort/filter eligibility as
  explicit observable semantics once researched or approved.
- Resolve the uniqueness contract test setup without making the Leads seed unique
  or extending the authorized module scope.

No extra comparator, inferred system-view predicate, global picklist option,
email/phone syntax rule, or default sort has been introduced.
