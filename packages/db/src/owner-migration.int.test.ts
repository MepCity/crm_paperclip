import { randomBytes } from "node:crypto";
import pg from "pg";
import { expect, inject, it } from "vitest";
import { runOwnerMigrations } from "./migrate";
import { dropDatabase, withDatabase } from "./testing";

it("migrates as the non-superuser owner and refuses runtime/admin URLs", async () => {
  const adminUrl = inject("crmAdminUrl");
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  const name = `crm_owner_${randomBytes(6).toString("hex")}`;
  try {
    await admin.query("alter role crm_owner password 'test-owner'");
    await admin.query(`create database ${admin.escapeIdentifier(name)} owner crm_owner`);
    const owner = new URL(withDatabase(adminUrl, name));
    owner.username = "crm_owner";
    owner.password = "test-owner";
    const first = await runOwnerMigrations(owner.toString());
    expect(first.applied).toContain("0004_tenant_context_foundation.sql");
    expect((await runOwnerMigrations(owner.toString())).skipped).toEqual(first.applied);
    await expect(runOwnerMigrations(withDatabase(adminUrl, name))).rejects.toThrow(
      "restricted crm_owner",
    );
    const runtime = new URL(owner);
    runtime.username = "crm_auth";
    runtime.password = "test-auth";
    await admin.query("alter role crm_auth password 'test-auth'");
    await expect(runOwnerMigrations(runtime.toString())).rejects.toThrow("restricted crm_owner");
  } finally {
    await admin.end();
    await dropDatabase(adminUrl, name);
  }
});
