# ADR 0001 — Technology stack, repository layout and application skeleton

- Status: Accepted
- Date: 2026-10-03
- Decider: CTO
- Issue: MEP-14

Amended by ADR 0004 (2026-10-04): the organization pages live under `/crm/[orgSlug]/…` instead of `/o/[orgSlug]/…` (§2, §3), and the thin REST layer of §5.6 is built from Module 1 on.

## Context

We are rebuilding the reference CRM setup we use as an internal tool, with an agent team.

Constraints that shape the architecture:

- Internal use, small team. The app must start locally with one command and must not depend on a paid external service.
- Later phases change the data model at runtime: custom fields and modules, layouts, picklists (Phase 3), workflow rules (Phase 4), reports (Phase 5), REST API and webhooks (Phase 6). The Phase 3 exit criterion is that our reference CRM customization can be recreated **without code changes**.
- The data model follows `~/Desktop/mepcity-research/metadata/`. The export landed on `main` while this ADR was being written (42 modules, about 1,050 fields, 27 field types) and is not audited yet. CRM module tables are out of scope here and are designed in ADR 0002.
- A first look at the export shows core modules close to reference CRM's defaults: no custom modules and a single custom field. Runtime extensibility is therefore required by the roadmap (Phase 3) more than by today's setup. ADR 0002 must weigh that.
- Every issue is built in its own git worktree, often by several agents on one machine. Dev servers and test runs in different worktrees must not interfere.
- Docker is installed on the team machine but its daemon is not running, so agents cannot rely on it.

## Decision

### 1. Stack

| Concern | Choice |
| --- | --- |
| Language / runtime | TypeScript (strict), Node.js 24 LTS |
| Monorepo | pnpm workspaces (pnpm via Corepack), no task runner |
| Web framework | Next.js 16 (App Router), React 19 |
| Database | PostgreSQL 18, the only infrastructure dependency |
| Data access | Drizzle ORM + drizzle-kit, `pg` driver |
| Authentication | Better Auth, identity only (see §4) |
| Validation | Zod 4 at every boundary |
| UI | Tailwind CSS 4, our own design tokens and components |
| Tests | Vitest (unit, integration), Playwright (end to end) |
| Lint / format | Biome |

Exact versions are pinned in `pnpm-lock.yaml`. The scaffold uses the latest stable releases that work together (on 2026-10-03: Next.js 16.3, React 19.3, TypeScript 7.0, Drizzle ORM 0.45, Better Auth 1.7, Vitest 5.0, Playwright 1.63, pnpm 12.8).

### 2. Repository layout

```
apps/
  web/                Next.js app: routes, server actions, route handlers, UI
    src/app/          (auth) pages, /o/[orgSlug]/… shell, /api/…
    src/components/   design-system primitives and app components
    e2e/              Playwright specs
packages/
  core/               domain services (auth, tenancy; later metadata, records, automation, reports)
  db/                 Drizzle schema, SQL migrations, client, local-Postgres and test-database helpers
scripts/              dev and test orchestration
docs/adr/             decisions
research/, tools/     research inputs and tooling; not part of the pnpm workspace
```

Rules:

- Dependency direction is `apps/web → packages/core → packages/db`. `apps/web` does not depend on `@crm/db` and contains no business logic or SQL.
- Services in `@crm/core` take and return plain data plus an explicit context. They never see framework objects (requests, cookies), so the same service serves the UI, the REST API, imports and automation.
- Internal packages are consumed as TypeScript source (no build step).
- A background worker (`apps/worker`) is added in Phase 4. It will use a PostgreSQL-backed job queue, not Redis.

### 3. Organization model and tenant isolation

- `organizations` (name, unique `slug`), `memberships` (organization, user, role; unique per pair), `invitations` (organization, email, role, hashed token, expiry).
- A user can belong to several organizations. The organization is part of the URL (`/o/{orgSlug}/…`), not hidden session state.
- Creating an organization makes the creator its `admin`. An organization always keeps at least one admin.
- Roles are a placeholder: `admin` (manage members and settings) and `member`. reference CRM-style roles and profiles replace this after the metadata export is audited (separate ADR).
- Adding a second user: an admin creates an invitation and shares the link; the invitee signs up or signs in and accepts. No email delivery is needed.

Isolation rules:

1. Every organization-owned table has `organization_id uuid not null` and indexes that lead with it.
2. Organization-scoped services accept an `OrgContext` (`orgId`, `userId`, `role`). The only way to obtain one is `requireOrgContext(orgSlug)`, which checks the session and the membership. Non-members get "not found", not "forbidden".
3. Every organization-scoped service ships with an integration test showing that a user of another organization cannot read or change the data.
4. CRM data tables additionally get PostgreSQL row-level security keyed on a per-transaction setting. This lands with the first CRM table (ADR 0002). The skeleton already routes organization-scoped database work through one wrapper so call sites do not change.

Conventions: primary keys are UUIDv7 (`uuidv7()` is native in PostgreSQL 18); timestamps are `timestamptz` in UTC.

### 4. Authentication

- Better Auth provides identity only: email and password sign-up, sign-in, sign-out, and database-backed sessions in an `httpOnly`, `SameSite=Lax` cookie. The cookie is `Secure` whenever the app's public URL (`APP_URL`) is HTTPS, so the production build still works over plain HTTP on localhost. Sessions are revocable; no JWT sessions.
- Its tables (`users`, `sessions`, `accounts`, `verifications`) live in our Drizzle schema and are migrated like every other table.
- Organizations, memberships and permissions are our own tables and code. We do not use Better Auth's organization plugin, because the permission model has to become reference CRM's roles, profiles and sharing rules.
- The rest of the code calls `@crm/core` (`getSession`, `requireUser`, `requireOrgContext`), never the library directly.
- Not in the skeleton: email verification, password reset, invite-only sign-up, rate limiting, API keys. They need email delivery or belong to later phases.

### 5. Designing for runtime extensibility

These rules are binding from the first CRM issue. The physical storage of records is decided in ADR 0002, after the metadata export is audited.

1. **Metadata is data.** Modules, fields, picklists, layouts, related lists and views are organization-scoped rows. Standard modules are seeded from `~/Desktop/mepcity-research/metadata/`; custom ones are created at runtime in the same tables. No module gets hand-written tables, forms or list screens.
2. **One write path.** Every record change goes through one service: validate against metadata, authorize, write, append a domain event — in one transaction. Server actions, REST handlers, CSV import and workflow actions all call it.
3. **Events before automation.** Domain events in an outbox table are the trigger source for workflow rules, notifications, the audit trail and webhooks.
4. **Queries are compiled.** List views, filters, search and reports compile criteria plus metadata into parameterized SQL. User input never reaches SQL as text.
5. **PostgreSQL covers the infrastructure:** JSONB with GIN and expression indexes for flexible fields, full-text search, row-level security, the job queue, and `LISTEN/NOTIFY` for live updates. ADR 0002 §8 replaces the GIN and expression indexes with typed index slots and defers the search index.
6. **The REST API is a thin layer** over the same services, with routes derived from module API names.

### 6. Test strategy

| Level | Tool | Scope |
| --- | --- | --- |
| Unit | Vitest, `*.test.ts` | Pure logic, no database |
| Integration | Vitest, `*.int.test.ts` | Services against real PostgreSQL, including tenant-isolation tests |
| End to end | Playwright (Chromium), `apps/web/e2e` | Smoke paths against a production build |

- One database engine everywhere. A test run starts its own throwaway PostgreSQL, applies the migrations to a template database and clones it per Vitest worker. Tests never touch the dev database, and parallel runs in other worktrees cannot collide.
- The end-to-end run builds the app and serves it on a free port against its own throwaway database.
- There is no hosted CI. The gate is `pnpm verify`, run by QA on the issue branch and by the CTO on `main` after each merge.

### 7. Running locally

Prerequisite: Node.js 24 with Corepack enabled. No Docker, no system PostgreSQL.

| Command | What it does |
| --- | --- |
| `pnpm install` | Installs dependencies, including PostgreSQL binaries (`embedded-postgres`) |
| `pnpm dev` | Starts local PostgreSQL (data in `.data/`, git-ignored), applies migrations, starts the app |
| `pnpm test` | Unit, integration and end-to-end tests |
| `pnpm check` | Biome and type check |
| `pnpm verify` | `check` + `test`; the merge gate |

- If `DATABASE_URL` is set, it is used instead of the embedded server (any PostgreSQL 18).
- `APP_URL` is the app's public URL. `pnpm dev` and the end-to-end run set it from the port they pick; a deployment sets it explicitly.
- Migrations are generated SQL files committed in `packages/db/migrations`. They are forward-only; an applied migration is never edited; `drizzle-kit push` is not used.
- Local secrets are generated into a git-ignored `.env.local` on first run. `.env.example` documents every variable.

Verified on the team machine: embedded PostgreSQL 18.4 initialises a cluster in about 5 s, starts in under 0.1 s and clones a template database in about 50 ms.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| SPA plus a separate API server (Vite with Fastify, Hono or NestJS) | Two apps to run and keep typed in sync. We keep the boundary in `packages/core` instead. |
| Rails, Django or Laravel | Strong CRUD tooling, but one language across UI, API and worker suits a metadata-driven model with shared types. |
| Forking an open-source CRM (Twenty, EspoCRM, SuiteCRM) | The experiment is whether the team can build it; reference CRM parity would mean fighting another product's model. |
| Prisma, Kysely, raw SQL | Prisma's generated client is a poor fit for queries compiled from metadata. Kysely has no schema or migration tooling. Drizzle gives schema as code, generated SQL migrations and a `sql` escape hatch. |
| SQLite or PGlite | SQLite has no row-level security and weaker JSON indexing. PGlite allows a single connection, so no worker process beside the web app. |
| PostgreSQL through Docker Compose | Needs a running Docker daemon, which agents do not have. Still possible through `DATABASE_URL`. |
| Hosted auth (Clerk, Auth0, WorkOS) | Paid or external; breaks one-command local start. |
| Hand-written auth | Security-sensitive code we would have to maintain and review ourselves. |
| Better Auth organization plugin | Would tie membership and permissions to a library model we must outgrow. |
| Schema or database per organization | Runtime DDL per tenant and migrations multiplied by tenants, for a deployment with very few organizations. |
| Turborepo or Nx; ESLint with Prettier | Not needed at this size; Biome is one tool. |
| Pre-styled UI kits (MUI, Ant Design) | We use our own design system. |

## Consequences

- No paid service and no account anywhere in the stack.
- Agents and the board can run and test the app with Node.js alone.
- `embedded-postgres` is a community package with pre-release version numbers. It is a local convenience only; any PostgreSQL 18 works through `DATABASE_URL`.
- Better Auth is a dependency on a security-critical path. It is confined to one module in `@crm/core` so it can be replaced.
- A metadata-driven model moves validation and typing from the database into the service layer and makes reporting queries harder. ADR 0002 must validate this against the real export and a realistic data volume.
- Next.js is confined to `apps/web`; services stay portable.

## Deferred decisions

| Decision | When |
| --- | --- |
| Record storage, row-level security policies, runtime database role | Decided in ADR 0002 |
| Roles, profiles and sharing rules | Separate ADR, after the permission screens are researched |
| Headless component primitives; UI language and localization | Decided in ADR 0003 |
| Job queue library; worker process | Phase 4 |
| File storage for attachments | Phase 2 |
| Email delivery provider (may cost money; needs board approval) | Phase 6 |
| Deployment topology for the internal instance | Before first use outside localhost |
