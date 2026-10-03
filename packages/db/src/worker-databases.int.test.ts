import pg from "pg";
import { afterAll, describe, expect, inject, it } from "vitest";
import { createWorkerDatabase, withDatabase } from "./testing";

async function withClient<T>(url: string, work: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

async function scalar(url: string, text: string): Promise<unknown> {
  return withClient(url, async (client) => {
    const row = (await client.query(text)).rows[0] as Record<string, unknown>;
    return Object.values(row)[0];
  });
}

describe("worker databases", () => {
  const created: Awaited<ReturnType<typeof createWorkerDatabase>>[] = [];

  afterAll(async () => {
    await Promise.all(created.map((db) => db.drop()));
  });

  it("points DATABASE_URL at a clone, not the template or the admin database", async () => {
    const name = await scalar(process.env.DATABASE_URL ?? "", "select current_database()");
    expect(name).toMatch(/^crm_test_/);
  });

  it("gives clones for different workers separate data", async () => {
    const adminUrl = inject("crmAdminUrl");
    const a = await createWorkerDatabase(adminUrl, "a");
    const b = await createWorkerDatabase(adminUrl, "b");
    created.push(a, b);
    expect(a.name).not.toBe(b.name);

    await withClient(a.url, (client) => client.query("create table only_in_a (id int)"));
    expect(await scalar(a.url, "select to_regclass('only_in_a')")).toBe("only_in_a");
    expect(await scalar(b.url, "select to_regclass('only_in_a')")).toBeNull();
  });

  it("clones the migrated template", async () => {
    const adminUrl = inject("crmAdminUrl");
    const db = await createWorkerDatabase(adminUrl, "template");
    created.push(db);
    expect(await scalar(db.url, "select to_regclass('crm_migrations')")).toBe("crm_migrations");
    expect(db.url).toBe(withDatabase(adminUrl, db.name));
  });
});
