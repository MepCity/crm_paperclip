import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runMigrations } from "./migrate";

let dir: string;
const url = () => process.env.DATABASE_URL ?? "";

async function query<T extends pg.QueryResultRow>(text: string): Promise<T[]> {
  const client = new pg.Client({ connectionString: url() });
  await client.connect();
  try {
    return (await client.query<T>(text)).rows;
  } finally {
    await client.end();
  }
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "crm-migrations-"));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("runMigrations", () => {
  it("does nothing for an empty or missing folder", async () => {
    expect(await runMigrations(url(), dir)).toEqual({ applied: [], skipped: [] });
    expect(await runMigrations(url(), join(dir, "missing"))).toEqual({ applied: [], skipped: [] });
  });

  it("applies a fixture migration once and skips it on the second run", async () => {
    await writeFile(
      join(dir, "0001_fixture.sql"),
      "create table fixture_a (id int primary key);\n--> statement-breakpoint\ninsert into fixture_a values (1);\n",
    );

    const first = await runMigrations(url(), dir);
    expect(first.applied).toEqual(["0001_fixture.sql"]);
    expect(await query("select id from fixture_a")).toEqual([{ id: 1 }]);

    const second = await runMigrations(url(), dir);
    expect(second).toEqual({ applied: [], skipped: ["0001_fixture.sql"] });
    expect(await query("select id from fixture_a")).toEqual([{ id: 1 }]);
  });

  it("applies new files in name order and rolls back a failing one", async () => {
    await writeFile(
      join(dir, "0003_bad.sql"),
      "create table fixture_c (id int);\nselect nope();\n",
    );
    await writeFile(join(dir, "0002_next.sql"), "create table fixture_b (id int);\n");

    await expect(runMigrations(url(), dir)).rejects.toThrow(/0003_bad\.sql failed/);
    expect(await query("select to_regclass('fixture_b') as t")).toEqual([{ t: "fixture_b" }]);
    expect(await query("select to_regclass('fixture_c') as t")).toEqual([{ t: null }]);
    await rm(join(dir, "0003_bad.sql"));
  });

  it("refuses to run when an applied migration was edited", async () => {
    await writeFile(join(dir, "0001_fixture.sql"), "select 1;\n");
    await expect(runMigrations(url(), dir)).rejects.toThrow(/edited after it was applied/);
  });
});
