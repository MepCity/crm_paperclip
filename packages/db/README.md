# Local PostgreSQL tooling

`could not create shared memory segment: No space left on device` can mean the
Darwin SysV identifier table is full, even with `shared_memory_type=mmap`.
Each PostgreSQL cluster holds a 56-byte marker. Clean shutdown releases it;
SIGKILL can leave it behind. Shared signal shutdown waits for startup and
`stop()` before exiting with 129 (SIGHUP), 130 (SIGINT), or 143 (SIGTERM).

Run `pnpm ipc:sweep` for a **dry run** showing the kernel limit, occupied/free
identifiers and each row's decision. Board decision 2026-10-10 (MEP-265):
`startLocalPostgres` automatically applies this same sweep at most once per call,
only after a Darwin shared memory exhaustion failure and before the retry wait.
If any identifier is removed, the next attempt starts immediately; otherwise
normal 5-second and 15-second waits remain. The maximum stays three attempts.
Every sweep line is forwarded through `onLog` with an `[ipc-sweep]` prefix,
separate from server error output. Sweep failures do not replace the startup error.
No cleanup runs on ordinary startup, shutdown, or a schedule.
`pnpm ipc:sweep --apply` explicitly removes eligible rows after a fresh recheck.
Manual `--apply` against the real table is reserved for the board; agents do not
run it. Tests inject the command runner and never remove real machine segments.
`kern.sysv.shmmni` remains 32; agents never run `sudo` or `sysctl -w`.

All conditions must hold: current owner, zero attachments, exactly 56 bytes,
creator confirmed dead by ESRCH, and minimum age five minutes. Unknown process
state, foreign owners and malformed tables are protected. Darwin reports CTIME
as a time of day; the parser uses its most recent occurrence as a conservative
minimum age. This can retain older markers. Other platforms exit successfully
with an unsupported message. No kernel settings or privileges are changed.

# Tenant persistence foundation (ADR 0012)

This package adds no domain tables. New non-record adapters use
`createTenantDatabase(pool, tableContracts)` from `@crm/db/tenancy` at startup.
The pool must connect as `crm_app`; repositories receive only `OrgTransaction`
inside `database.withOrg(authenticatedOrgContext, callback)`. Resolve that context
from authenticated membership in core; a request organization ID is insufficient.
Keep explicit organization predicates in repository queries as well as RLS.
The legacy identity/tenancy service and its transaction wrapper remain separate.

Each transaction checks out one connection, begins, sets `app.org_id` locally,
and expires its handle before commit or rollback. A prior session setting can
reappear afterwards; every new transaction overrides it. Do not use raw pools
in CRM repositories. Arbitrary SQL can forge this setting: it is defense against
missing predicates, not an authorization credential or SQL injection boundary.

Cluster administrators provision `crm_owner`, `crm_app`, and `crm_auth` separately
(`provisionRuntimeRoles` is available for disposable/local clusters). Existing
roles are never silently repaired. Production credentials must be configured
outside source control. `DATABASE_URL` is the restricted CRM runtime URL;
`DATABASE_MIGRATION_URL` is the maintenance URL. New persistence deployments call
`runOwnerMigrations` from `@crm/db/migrate`, which refuses other/elevated roles.
Provision database ownership and schema CREATE/USAGE for `crm_owner` beforehand.
The low-level `runMigrations` stays available for the existing identity bootstrap
and disposable test fixtures; it is not a runtime entry point. Local dev's
embedded-cluster administrator is used for provisioning/bootstrap only; new CRM
adapters must use a separately configured restricted pool and cannot use it.
The authentication connection remains separate; no auth/domain grants are added.

A migration must create each adapter table with non-null UUID organization keys,
tenant-leading primary/unique keys and composite tenant foreign keys, owned by
`crm_owner`. Enable RLS with one canonical ALL policy for `crm_app`, both USING
and WITH CHECK `organization_id = (select public.current_org_id())`. Do not FORCE
RLS (ADR 0012). Declare exact per-table runtime grants in both the migration and
adapter contract. No default domain grants are installed. Startup rejects
missing/unsafe registered tables, unregistered tenant tables, unsafe policies,
ownership, inherited roles, unexpected grants and credential access. This first
slice intentionally accepts table-level grants only; reviewed display-column,
worker claim and connector boundaries need their own contracts before use.

Migrations are forward-only: retain numeric prefixes/journal entries, use new
lower snake case descriptive suffixes, and never rename/edit applied files or
use schema push. Recovery uses a reviewed compensating forward migration;
destructive changes also require a restore plan. The foundation migration adds
the stable invoker-rights `current_org_id()` helper, owned by `crm_owner`, and
revokes the default PUBLIC database TEMP grant so runtime cannot create temporary
tables. Test clones reapply this database ACL because PostgreSQL does not clone it.
Tests provision roles in their disposable cluster and create probe tables only
inside worker clones; they never use a development database.
