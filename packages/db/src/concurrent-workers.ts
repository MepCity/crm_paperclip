import pg from "pg";
import { expect, inject } from "vitest";

async function withAdmin<T>(work: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: inject("crmAdminUrl") });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/**
 * Registers this test file's database, waits for the other concurrently running file to do the
 * same and asserts the two differ. Returns false (and asserts nothing) when no peer shows up,
 * e.g. when only one of the two files is run.
 */
export async function expectDistinctFromPeer(file: string): Promise<boolean> {
  const mine = await withAdmin(async (client) => {
    const own = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await own.connect();
    const name = (await own.query<{ n: string }>("select current_database() as n")).rows[0]?.n;
    await own.end();

    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(42)");
    await client.query(
      "create table if not exists worker_registry (file text primary key, db text not null)",
    );
    await client.query("commit");
    await client.query(
      "insert into worker_registry (file, db) values ($1, $2) on conflict (file) do update set db = $2",
      [file, name],
    );
    return name;
  });

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const rows = await withAdmin(
      async (client) => (await client.query<{ db: string }>("select db from worker_registry")).rows,
    );
    if (rows.length >= 2) {
      const databases = new Set(rows.map((row) => row.db));
      expect(databases.size).toBe(rows.length);
      expect(databases.has(mine ?? "")).toBe(true);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}
