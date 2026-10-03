# MepCity CRM

Internal CRM, built as an experiment to reach feature parity with our reference CRM setup. Decisions are in
[`docs/adr/`](docs/adr/), module specs in [`research/specs/`](research/specs/).

## Requirements

- Node.js 24 or newer
- Corepack (ships with Node.js): `corepack enable`

No Docker and no system PostgreSQL are needed. `pnpm install` downloads PostgreSQL 18 binaries
(`embedded-postgres`), and the first end-to-end run downloads Chromium for Playwright.

## Setup and run

```sh
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` starts a local PostgreSQL (data in `.data/postgres`, git-ignored) on a free port, applies the
migrations, starts the app and prints the addresses. The app listens on port 3000, or on the next free port
when 3000 is taken; set `PORT` to choose one. Ctrl+C stops the app and PostgreSQL. The first run writes a
git-ignored `.env.local` with generated secrets.

To use your own PostgreSQL 18 instead, set `DATABASE_URL` (see `.env.example`).

Without a global pnpm, prefix every command with `corepack`, for example `corepack pnpm dev`.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Local PostgreSQL + migrations + app |
| `pnpm test` | Unit, integration and end-to-end tests |
| `pnpm test:unit` | Vitest, `*.test.ts`, no database |
| `pnpm test:int` | Vitest, `*.int.test.ts`, real PostgreSQL |
| `pnpm test:e2e` | Playwright (Chromium) against a production build |
| `pnpm check` | Biome and type check |
| `pnpm verify` | `check` + `test`; the merge gate |

Tests never touch the dev database. Integration tests start a throwaway PostgreSQL, migrate a template
database and clone it for every test file. End-to-end tests build the app and serve it on a free port
against their own throwaway database, so they can run while `pnpm dev` is running, also from another
worktree.

## Layout

```
apps/web/        Next.js app (routes, UI); e2e/ holds the Playwright specs
packages/core/   domain services; the only package apps/web depends on
packages/db/     Drizzle client, SQL migrations, local-PostgreSQL and test-database helpers
scripts/         dev and e2e orchestration
docs/adr/        architecture decisions
research/        reference CRM research inputs (not part of the workspace)
tools/           research tooling (not part of the workspace)
```

Dependency direction: `apps/web -> packages/core -> packages/db`.

## Migrations

SQL files in `packages/db/migrations`, applied in file-name order by `pnpm dev`, and by the tests. They are
forward-only: an applied file is never edited (the runner refuses a changed file). Generate them from the
Drizzle schema with `pnpm --filter @crm/db db:generate`.

## Notes

- `pnpm` build scripts are allowed only for `esbuild` and the `@embedded-postgres/*` binaries
  (`allowBuilds` in `pnpm-workspace.yaml`).
