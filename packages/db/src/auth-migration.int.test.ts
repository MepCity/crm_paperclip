import { randomBytes } from "node:crypto";
import pg from "pg";
import { describe, expect, inject, it } from "vitest";
import { runMigrations } from "./migrate";
import { dropDatabase, withDatabase } from "./testing";

describe("initial auth migration", () => {
  it("applies to an empty database once and creates UUID and timezone-aware columns", async () => {
    const adminUrl = inject("crmAdminUrl");
    const name = `crm_migration_${randomBytes(5).toString("hex")}`;
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    try {
      await admin.query(`create database ${admin.escapeIdentifier(name)}`);
    } finally {
      await admin.end();
    }
    const url = withDatabase(adminUrl, name);
    try {
      const first = await runMigrations(url);
      expect(first.applied).toContain("0000_cultured_doorman.sql");
      expect((await runMigrations(url)).skipped).toEqual(first.applied);
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        const result = await client.query<{
          table_name: string;
          column_name: string;
          data_type: string;
        }>(
          `select table_name, column_name, data_type from information_schema.columns
           where table_name in ('users', 'sessions', 'accounts', 'verifications')
             and column_name in ('id', 'created_at', 'updated_at', 'expires_at')`,
        );
        for (const table of ["users", "sessions", "accounts", "verifications"]) {
          expect(result.rows).toContainEqual({
            table_name: table,
            column_name: "id",
            data_type: "uuid",
          });
          expect(result.rows).toContainEqual({
            table_name: table,
            column_name: "created_at",
            data_type: "timestamp with time zone",
          });
        }
      } finally {
        await client.end();
      }
    } finally {
      await dropDatabase(adminUrl, name);
    }
  });
});
