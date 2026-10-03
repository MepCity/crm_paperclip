import { randomBytes } from "node:crypto";
import pg from "pg";
import { expect, inject, it } from "vitest";
import { runMigrations } from "./migrate";
import { dropDatabase, withDatabase } from "./testing";

it("applies tenancy after auth and skips both on a second run", async () => {
  const adminUrl = inject("crmAdminUrl");
  const name = `crm_tenancy_${randomBytes(5).toString("hex")}`;
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
    expect(first.applied).toEqual(["0000_cultured_doorman.sql", "0001_military_patriot.sql"]);
    expect(await runMigrations(url)).toEqual({ applied: [], skipped: first.applied });
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const columns = await client.query<{
        table_name: string;
        column_name: string;
        data_type: string;
      }>(
        `select table_name, column_name, data_type from information_schema.columns
         where table_name in ('organizations', 'memberships', 'invitations')`,
      );
      for (const table of ["organizations", "memberships", "invitations"]) {
        expect(columns.rows).toContainEqual({
          table_name: table,
          column_name: "created_at",
          data_type: "timestamp with time zone",
        });
      }
      for (const table of ["memberships", "invitations"]) {
        expect(columns.rows).toContainEqual({
          table_name: table,
          column_name: "organization_id",
          data_type: "uuid",
        });
      }
    } finally {
      await client.end();
    }
  } finally {
    await dropDatabase(adminUrl, name);
  }
});
