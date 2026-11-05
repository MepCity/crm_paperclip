import { randomBytes } from "node:crypto";
import { copyFile, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { expect, inject, it } from "vitest";
import { defaultMigrationsDir, runOwnerMigrations } from "./migrate";
import { dropDatabase, withDatabase } from "./testing";

const MIGRATION = "0008_access_control.sql";

it("backfills profiles, roles, defaults, members and owner on an existing organisation", async () => {
  const adminUrl = inject("crmAdminUrl");
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  const name = `crm_access_${randomBytes(6).toString("hex")}`;
  const dir = await mkdtemp(join(tmpdir(), "crm-access-migrations-"));
  try {
    await admin.query("alter role crm_owner password 'test-owner'");
    await admin.query(`create database ${admin.escapeIdentifier(name)} owner crm_owner`);
    const owner = new URL(withDatabase(adminUrl, name));
    owner.username = "crm_owner";
    owner.password = "test-owner";
    for (const file of (await readdir(defaultMigrationsDir)).filter(
      (f) => f.endsWith(".sql") && f < MIGRATION,
    )) {
      await copyFile(join(defaultMigrationsDir, file), join(dir, file));
    }
    await runOwnerMigrations(owner.toString(), dir);

    const db = new pg.Client({ connectionString: withDatabase(adminUrl, name) });
    await db.connect();
    try {
      const user = async (n: string) =>
        (
          await db.query("insert into users (name, email) values ($1, $2) returning id", [
            n,
            `${n}@example.test`,
          ])
        ).rows[0].id as string;
      const first = await user("first");
      const second = await user("second");
      const third = await user("third");
      const org = (
        await db.query("insert into organizations (name, slug) values ('A', 'a') returning id")
      ).rows[0].id as string;
      const empty = (
        await db.query("insert into organizations (name, slug) values ('B', 'b') returning id")
      ).rows[0].id as string;
      // The member joined before the admin's row was created: owner is the earliest admin.
      await db.query(
        "insert into memberships (organization_id, user_id, role, created_at) values ($1,$2,'member','2026-01-01'), ($1,$3,'admin','2026-01-02'), ($1,$4,'admin','2026-01-03')",
        [org, first, second, third],
      );

      await copyFile(join(defaultMigrationsDir, MIGRATION), join(dir, MIGRATION));
      await runOwnerMigrations(owner.toString(), dir);

      const profiles = (
        await db.query(
          "select kind, name from access_profiles where organization_id = $1 order by kind",
          [org],
        )
      ).rows;
      expect(profiles).toEqual([
        { kind: "administrator", name: "Administrator" },
        { kind: "standard", name: "Standard" },
      ]);
      const roles = (
        await db.query(
          "select r.name, p.name as parent, r.share_with_peers from access_roles r left join access_roles p on p.organization_id = r.organization_id and p.id = r.parent_role_id where r.organization_id = $1 order by r.name",
          [org],
        )
      ).rows;
      expect(roles).toEqual([
        { name: "CEO", parent: null, share_with_peers: true },
        { name: "Manager", parent: "CEO", share_with_peers: false },
      ]);
      const defaults = (
        await db.query(
          "select module, level from access_module_defaults where organization_id = $1",
          [org],
        )
      ).rows;
      expect(defaults).toHaveLength(13);
      expect(defaults.find((d) => d.module === "Products")?.level).toBe("public_read");
      expect(defaults.filter((d) => d.level === "private")).toHaveLength(12);
      const assigned = (
        await db.query(
          "select m.user_id, p.kind, r.name as role, ms.role as legacy from member_access m join access_profiles p on p.organization_id = m.organization_id and p.id = m.profile_id join access_roles r on r.organization_id = m.organization_id and r.id = m.role_id join memberships ms on ms.organization_id = m.organization_id and ms.user_id = m.user_id where m.organization_id = $1",
          [org],
        )
      ).rows;
      expect(assigned).toHaveLength(3);
      for (const row of assigned) {
        expect(row).toMatchObject({ kind: "administrator", role: "CEO", legacy: "admin" });
      }
      expect(
        (await db.query("select owner_user_id from organizations where id = $1", [org])).rows[0]
          .owner_user_id,
      ).toBe(first);
      expect(
        (await db.query("select version from access_versions where organization_id = $1", [org]))
          .rows[0].version,
      ).toBe("1");
      // An organisation without members still gets profiles, roles and a version row.
      expect(
        (
          await db.query(
            "select count(*)::int as n from access_profiles where organization_id = $1",
            [empty],
          )
        ).rows[0].n,
      ).toBe(2);
      expect(
        (await db.query("select owner_user_id from organizations where id = $1", [empty])).rows[0]
          .owner_user_id,
      ).toBeNull();
      // The seeded JSON documents are exactly the catalogue defaults.
      const { administratorPermissions, standardPermissions } = await import(
        "../../core/src/access/catalogue"
      );
      const stored = (
        await db.query("select kind, permissions from access_profiles where organization_id = $1", [
          org,
        ])
      ).rows;
      expect(stored.find((r) => r.kind === "administrator")?.permissions).toEqual(
        administratorPermissions(),
      );
      expect(stored.find((r) => r.kind === "standard")?.permissions).toEqual(standardPermissions());
    } finally {
      await db.end();
    }
  } finally {
    await admin.end();
    await rm(dir, { recursive: true, force: true });
    await dropDatabase(adminUrl, name);
  }
}, 120_000);
