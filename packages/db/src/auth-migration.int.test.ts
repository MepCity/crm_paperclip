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

describe("auth uniqueness constraints (0002)", () => {
  async function withMigratedDb<T>(work: (client: pg.Client) => Promise<T>): Promise<T> {
    const adminUrl = inject("crmAdminUrl");
    const name = `crm_auth_uniq_${randomBytes(5).toString("hex")}`;
    const admin = new pg.Client({ connectionString: adminUrl });
    await admin.connect();
    try {
      await admin.query(`create database ${admin.escapeIdentifier(name)}`);
    } finally {
      await admin.end();
    }
    const url = withDatabase(adminUrl, name);
    await runMigrations(url);
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      return await work(client);
    } finally {
      await client.end();
      await dropDatabase(adminUrl, name);
    }
  }

  async function insertUser(client: pg.Client, email: string): Promise<string> {
    const result = await client.query<{ id: string }>(
      `insert into users (name, email) values ('Test User', $1) returning id`,
      [email],
    );
    return result.rows[0]?.id ?? "";
  }

  it("rejects a second account with the same provider_id and account_id", async () => {
    await withMigratedDb(async (client) => {
      const userA = await insertUser(client, `a-${randomBytes(4).toString("hex")}@example.test`);
      const userB = await insertUser(client, `b-${randomBytes(4).toString("hex")}@example.test`);
      const providerId = "credential";
      const accountId = `acct-${randomBytes(4).toString("hex")}`;
      await client.query(
        `insert into accounts (account_id, provider_id, user_id) values ($1, $2, $3)`,
        [accountId, providerId, userA],
      );
      await expect(
        client.query(
          `insert into accounts (account_id, provider_id, user_id) values ($1, $2, $3)`,
          [accountId, providerId, userB],
        ),
      ).rejects.toMatchObject({ code: "23505" });
    });
  });

  it("allows the same account_id for a different provider_id", async () => {
    await withMigratedDb(async (client) => {
      const userA = await insertUser(client, `a-${randomBytes(4).toString("hex")}@example.test`);
      const userB = await insertUser(client, `b-${randomBytes(4).toString("hex")}@example.test`);
      const accountId = `shared-${randomBytes(4).toString("hex")}`;
      await client.query(
        `insert into accounts (account_id, provider_id, user_id) values ($1, 'google', $2)`,
        [accountId, userA],
      );
      await client.query(
        `insert into accounts (account_id, provider_id, user_id) values ($1, 'github', $2)`,
        [accountId, userB],
      );
      const rows = await client.query(
        `select count(*)::int as count from accounts where account_id = $1`,
        [accountId],
      );
      expect(rows.rows[0]?.count).toBe(2);
    });
  });

  it("rejects a second user when email differs only by letter case", async () => {
    await withMigratedDb(async (client) => {
      const local = `case-${randomBytes(4).toString("hex")}`;
      await insertUser(client, `${local}@example.test`);
      await expect(insertUser(client, `${local.toUpperCase()}@example.test`)).rejects.toMatchObject(
        {
          code: "23514",
        },
      );
    });
  });

  it("rejects a user row when email contains uppercase letters", async () => {
    await withMigratedDb(async (client) => {
      const local = `upper-${randomBytes(4).toString("hex")}`;
      await expect(insertUser(client, `${local.toUpperCase()}@example.test`)).rejects.toMatchObject(
        { code: "23514" },
      );
    });
  });

  it("defines users_email_unique on the plain email column without lower()", async () => {
    await withMigratedDb(async (client) => {
      const rows = await client.query<{ indexdef: string }>(
        `select indexdef from pg_indexes where indexname = 'users_email_unique'`,
      );
      expect(rows.rows).toHaveLength(1);
      const def = rows.rows[0]?.indexdef ?? "";
      expect(def.toLowerCase()).toContain("unique");
      expect(def.toLowerCase()).not.toContain("lower(");
      expect(def).toMatch(/\(email\)/i);
    });
  });
});
