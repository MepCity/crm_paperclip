import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { ensureDatabase, startLocalPostgres } from "./local-postgres";
import { defaultMigrationsDir, runMigrations } from "./migrate";

export const TEMPLATE_DATABASE = "crm_template";

const MAX_IDENTIFIER_LENGTH = 63;

/** Builds a valid, lower-case PostgreSQL database name for one test worker. */
export function testDatabaseName(workerId: string | number, suffix: string): string {
  const clean = (value: string | number) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  const name = `crm_test_${clean(workerId) || "0"}_${clean(suffix) || "x"}`;
  return name.slice(0, MAX_IDENTIFIER_LENGTH);
}

/** Returns `url` with its database replaced by `database`. */
export function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${encodeURIComponent(database)}`;
  return parsed.toString();
}

export type TestPostgres = {
  /** Connection string for the `postgres` maintenance database. */
  adminUrl: string;
  stop(): Promise<void>;
};

/** Starts a throwaway PostgreSQL in a temporary directory on a free port. */
export async function startTestPostgres(): Promise<TestPostgres> {
  const dataDir = await mkdtemp(join(tmpdir(), "crm-pg-"));
  let server: Awaited<ReturnType<typeof startLocalPostgres>>;
  try {
    server = await startLocalPostgres({
      dataDir,
      settings: { fsync: "off", synchronous_commit: "off", full_page_writes: "off" },
    });
  } catch (error) {
    await rm(dataDir, { recursive: true, force: true });
    throw error;
  }
  return {
    adminUrl: server.urlFor("postgres"),
    async stop() {
      try {
        await server.stop();
      } finally {
        await rm(dataDir, { recursive: true, force: true });
      }
    },
  };
}

/** Creates the template database and applies the migrations to it. */
export async function createTemplateDatabase(
  adminUrl: string,
  migrationsDir: string = defaultMigrationsDir,
): Promise<void> {
  await ensureDatabase(adminUrl, TEMPLATE_DATABASE);
  await runMigrations(withDatabase(adminUrl, TEMPLATE_DATABASE), migrationsDir);
}

async function withAdmin<T>(adminUrl: string, work: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/** Clones the template into a new database and returns its connection string. */
export async function cloneTemplateDatabase(adminUrl: string, name: string): Promise<string> {
  await withAdmin(adminUrl, (client) =>
    client.query(
      `create database ${client.escapeIdentifier(name)} template ${client.escapeIdentifier(TEMPLATE_DATABASE)}`,
    ),
  );
  return withDatabase(adminUrl, name);
}

export async function dropDatabase(adminUrl: string, name: string): Promise<void> {
  await withAdmin(adminUrl, (client) =>
    client.query(`drop database if exists ${client.escapeIdentifier(name)} with (force)`),
  );
}

/** A fresh, uniquely named clone for the given worker. */
export async function createWorkerDatabase(
  adminUrl: string,
  workerId: string | number,
): Promise<{ name: string; url: string; drop(): Promise<void> }> {
  const name = testDatabaseName(workerId, randomBytes(4).toString("hex"));
  const url = await cloneTemplateDatabase(adminUrl, name);
  return { name, url, drop: () => dropDatabase(adminUrl, name) };
}
