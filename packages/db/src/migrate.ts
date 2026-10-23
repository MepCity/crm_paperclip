import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

export const defaultMigrationsDir = fileURLToPath(new URL("../migrations", import.meta.url));

const MIGRATIONS_TABLE = "crm_migrations";
const LOCK_KEY = 7_302_911_001;

export type MigrationResult = { applied: string[]; skipped: string[] };

/**
 * Applies the `*.sql` files of `dir` in file-name order, each in its own transaction.
 * Forward-only: an applied file whose contents changed is an error. An empty or missing
 * directory is fine. Concurrent runs against one database are serialised by an advisory lock.
 */
export async function runMigrations(
  connection: string,
  dir: string = defaultMigrationsDir,
): Promise<MigrationResult> {
  const files = existsSync(dir)
    ? (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort()
    : [];

  const client = new pg.Client({ connectionString: connection });
  await client.connect();
  try {
    await client.query("select pg_advisory_lock($1)", [LOCK_KEY]);
    await client.query(
      `create table if not exists ${MIGRATIONS_TABLE} (
         name text primary key,
         hash text not null,
         applied_at timestamptz not null default now()
       )`,
    );
    const done = new Map<string, string>(
      (
        await client.query<{ name: string; hash: string }>(
          `select name, hash from ${MIGRATIONS_TABLE}`,
        )
      ).rows.map((row) => [row.name, row.hash]),
    );

    const result: MigrationResult = { applied: [], skipped: [] };
    for (const file of files) {
      const contents = await readFile(`${dir}/${file}`, "utf8");
      const hash = createHash("sha256").update(contents).digest("hex");
      const previous = done.get(file);
      if (previous !== undefined) {
        if (previous !== hash) {
          throw new Error(`migration ${file} was edited after it was applied; add a new migration`);
        }
        result.skipped.push(file);
        continue;
      }
      try {
        await client.query("begin");
        await client.query(contents);
        await client.query(`insert into ${MIGRATIONS_TABLE} (name, hash) values ($1, $2)`, [
          file,
          hash,
        ]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw new Error(
          `migration ${file} failed: ${error instanceof Error ? error.message : error}`,
        );
      }
      result.applied.push(file);
    }
    return result;
  } finally {
    await client.end();
  }
}

/** New persistence deployments use the dedicated maintenance URL, never DATABASE_URL. */
export async function runOwnerMigrations(
  connection: string = process.env.DATABASE_MIGRATION_URL ?? "",
  dir: string = defaultMigrationsDir,
): Promise<MigrationResult> {
  if (!connection) throw new Error("DATABASE_MIGRATION_URL is required");
  const client = new pg.Client({ connectionString: connection });
  await client.connect();
  try {
    const role = await client.query(`select current_user = 'crm_owner' as owner,
      rolsuper or rolbypassrls as elevated from pg_roles where rolname=current_user`);
    if (!role.rows[0]?.owner || role.rows[0]?.elevated) {
      throw new Error("Migrations require the restricted crm_owner connection");
    }
  } finally {
    await client.end();
  }
  return runMigrations(connection, dir);
}
