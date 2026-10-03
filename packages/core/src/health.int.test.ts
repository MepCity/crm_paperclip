import { closeDb, createDb, type Database } from "@crm/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkHealth } from "./health";

let db: Database;

beforeAll(() => {
  db = createDb(process.env.DATABASE_URL ?? "");
});

afterAll(() => closeDb(db));

describe("checkHealth", () => {
  it("reports ok and PostgreSQL 18", async () => {
    const report = await checkHealth(db);
    expect(report.status).toBe("ok");
    expect(report.postgresMajor).toBe(18);
    expect(report.postgresVersion).toMatch(/^18\./);
  });

  it("rejects when the database is unreachable", async () => {
    const broken = createDb("postgres://postgres:postgres@127.0.0.1:1/none");
    try {
      await expect(checkHealth(broken)).rejects.toThrow();
    } finally {
      await closeDb(broken);
    }
  });
});
