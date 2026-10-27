# Configuration definition stores

`createDefinitionPorts` is the authorization and validation boundary. Resolve
`OrgContext` from authenticated membership on the server, provide effective
customization metadata and a server-owned report-manage permission resolver.
Never derive the tenant or permission callback from request data.

The Postgres repository is exported from `@crm/db/definitions`. Construct its
`TenantDatabase` with `createTenantDatabase` using the restricted `crm_app`
pool and the complete table contracts of any additional installed adapters.
The tenancy guard always checks the three installed definition tables. Only
expose the returned authorized ports; the repository is an internal capability.
All table names come from a fixed adapter allowlist and all values are bound.

- `reports.create(ctx, input, { idempotencyKey })` and
  `reports.update(ctx, { id, ...input }, { expectedRevision })` require admin
  or the server-resolved report-manage permission. List/get expose definitions,
  never report results. RecordService remains responsible for permission-scoped
  report execution; this family has no execution method.
- `automation.createAssignmentShell(ctx, input, { idempotencyKey })` requires
  admin. `AssignmentDefinitionPort` extends the existing read-only AutomationPort
  without enabling writes on legacy synthetic workflow readers. Its assignment
  list/get read the same persisted shells. Workflow definitions are outside this
  adapter. Assignment pagination scopes its cursor to tenant, actor, module and
  kind. Shells are permanently inactive, empty and without fallback.
- `organizationAddresses.add(ctx, input, { idempotencyKey })` and list require
  admin. Addresses normalize to lowercase, remain unverified and grant no send
  capability. There is no provider integration or background work.

Keys are unique per tenant and family. After checking authorization and the key,
retries read the existing row before revalidating current metadata. Concurrent
inserts use the unique key and a fresh read-committed snapshot after conflict.
An update increments the revision with one conditional UPDATE; stale revisions
return conflict. A foreign-tenant id returns not_found. Unique names are scoped
to module and tenant; address uniqueness is scoped to tenant.

Each mutation changes one row in one family. Its only write lock is that row
(or the corresponding unique-index insert arbitration); it never acquires a
second family lock, calls a provider, or holds a transaction over metadata I/O.
Report validation uses a fresh effective customization snapshot. Only active
fields are accepted. Scalar equality/text/numeric comparisons, emptiness and
bounded boolean criteria groups are supported. Unsupported criteria variants,
grouping, aggregate properties and unknown payload properties return validation;
they are never silently discarded. Metadata is configuration validation, not
record or field-level read authorization.

`memory.ts` is an unexported unit-test twin. It is never the product store.
The shared contract runs against it and against real restricted-role Postgres.
Web write wiring belongs to the dependent UI implementation; this package does
not replace existing UI fixtures or introduce HTTP routes.
