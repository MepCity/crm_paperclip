import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "../database";
import { ConflictError, ForbiddenError, ValidationError } from "../errors";
import { acceptInvitation, createInvitation, requireOrgContext } from "../tenancy";
import {
  addAccessTestMember,
  createStandardManagerUser,
  createTestOrganization,
  createTestUser,
} from "../testing";
import * as admin from "./admin";
import { OWNED_MODULES } from "./catalogue";
import { getAccessSnapshot } from "./context";
import { canOnRecord } from "./evaluate";

const first = async <T>(p: Promise<T[]>): Promise<T> => {
  const [row] = await p;
  if (!row) throw new Error("expected a row");
  return row;
};

async function setup() {
  const { org, ctx, admin: owner } = await createTestOrganization();
  const profiles = await admin.listProfiles(ctx);
  const roles = await admin.listRoles(ctx);
  const byName = (list: { name: string; id: string }[], n: string) => {
    const hit = list.find((x) => x.name === n);
    if (!hit) throw new Error(n);
    return hit.id;
  };
  return {
    org,
    ctx,
    owner,
    administratorId: byName(profiles, "Administrator"),
    standardId: byName(profiles, "Standard"),
    ceoId: byName(roles, "CEO"),
    managerId: byName(roles, "Manager"),
  };
}

const version = async (orgId: string) =>
  (
    await first(
      getDb()
        .select({ v: schema.accessVersions.version })
        .from(schema.accessVersions)
        .where(eq(schema.accessVersions.organizationId, orgId)),
    )
  ).v;

describe("organisation seeding", () => {
  it("seeds profiles, roles, defaults, owner and version 1; creator is Administrator in CEO", async () => {
    const s = await setup();
    expect((await admin.listProfiles(s.ctx)).map((p) => [p.name, p.kind, p.memberCount])).toEqual([
      ["Administrator", "administrator", 1],
      ["Standard", "standard", 0],
    ]);
    const roles = await admin.listRoles(s.ctx);
    expect(roles.map((r) => [r.name, r.parentRoleId === null])).toEqual([
      ["CEO", true],
      ["Manager", false],
    ]);
    const defaults = await admin.getModuleDefaults(s.ctx);
    expect(defaults).toHaveLength(OWNED_MODULES.length);
    expect(defaults.find((d) => d.module === "Products")?.level).toBe("public_read");
    expect(defaults.find((d) => d.module === "Leads")?.level).toBe("private");
    const [org] = await getDb()
      .select({ owner: schema.organizations.ownerUserId })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, s.org.id));
    expect(org?.owner).toBe(s.ctx.userId);
    expect(await version(s.org.id)).toBe(1);
    expect(s.ctx.accessVersion).toBe(1);
    const snapshot = await getAccessSnapshot(s.ctx);
    expect(snapshot.profileKind).toBe("administrator");
    expect(canOnRecord(snapshot, "Leads", "delete", "someone-else")).toBe(true);
  });

  it("legacy invited members get Standard in the root role unless a profile/role is chosen", async () => {
    const s = await setup();
    const legacy = createTestUser();
    const user = (await legacy).user;
    const { token } = await createInvitation(s.ctx, { email: user.email, role: "member" });
    await acceptInvitation(user, { token });
    const ctx = await requireOrgContext((await legacy).headers, s.ctx.orgSlug);
    const snap = await getAccessSnapshot(ctx);
    expect([snap.profileKind, snap.roleId]).toEqual(["standard", s.ceoId]);

    const picked = await createTestUser();
    const { token: t2 } = await createInvitation(s.ctx, {
      email: picked.user.email,
      role: "member",
      profileId: s.administratorId,
      roleId: s.managerId,
    });
    await acceptInvitation(picked.user, { token: t2 });
    const snap2 = await getAccessSnapshot(await requireOrgContext(picked.headers, s.ctx.orgSlug));
    expect([snap2.profileKind, snap2.roleId]).toEqual(["administrator", s.managerId]);
    await expect(
      createInvitation(s.ctx, {
        email: "x@example.test",
        role: "member",
        profileId: crypto.randomUUID(),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("the e2e fixture user is Standard in Manager and cannot manage access", async () => {
    const s = await setup();
    const fixture = await createStandardManagerUser(s.ctx.orgSlug);
    expect(fixture.email).toContain("@");
    const member = await addAccessTestMember(s.ctx);
    const snap = await getAccessSnapshot(member.ctx);
    expect([snap.profileKind, snap.roleId]).toEqual(["standard", s.managerId]);
    await expect(admin.listProfiles(member.ctx)).rejects.toMatchObject({
      code: "permission_denied",
    });
    await expect(admin.createGroup(member.ctx, { name: "x" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    // A custom profile granting userManagement opens the gate.
    const clone = await admin.cloneProfile(s.ctx, {
      sourceProfileId: s.standardId,
      name: "Delegate",
    });
    const perms = {
      ...clone.permissions,
      admin: { ...clone.permissions.admin, userManagement: true },
    };
    await admin.updateProfile(s.ctx, { profileId: clone.id, permissions: perms });
    await admin.setMemberAccess(s.ctx, { userId: member.user.id, profileId: clone.id });
    const refreshed = await requireOrgContext(member.headers, s.ctx.orgSlug);
    await expect(admin.listProfiles(refreshed)).resolves.toHaveLength(3);
  });
});

describe("versioning and caching", () => {
  it("every admin write bumps the version in the same transaction, reads do not", async () => {
    const s = await setup();
    await admin.listProfiles(s.ctx);
    expect(await version(s.org.id)).toBe(1);
    await admin.cloneProfile(s.ctx, { sourceProfileId: s.standardId, name: "Sales" });
    expect(await version(s.org.id)).toBe(2);
    await admin.createGroup(s.ctx, { name: "G" });
    expect(await version(s.org.id)).toBe(3);
    // A failed write rolls the bump back.
    await expect(admin.createGroup(s.ctx, { name: "G" })).rejects.toBeInstanceOf(ValidationError);
    expect(await version(s.org.id)).toBe(3);
  });

  it("a new request after a write sees a new version and a new snapshot", async () => {
    const s = await setup();
    const member = await addAccessTestMember(s.ctx);
    const before = await getAccessSnapshot(member.ctx);
    const clone = await admin.cloneProfile(s.ctx, {
      sourceProfileId: s.standardId,
      name: "NoLeads",
    });
    const perms = structuredClone(clone.permissions);
    perms.modules.Leads.view = false;
    await admin.updateProfile(s.ctx, { profileId: clone.id, permissions: perms });
    await admin.setMemberAccess(s.ctx, { userId: member.user.id, profileId: clone.id });
    const ctx = await requireOrgContext(member.headers, s.ctx.orgSlug);
    expect(ctx.accessVersion).toBeGreaterThan(before.version);
    const after = await getAccessSnapshot(ctx);
    expect(after.permissions.modules.Leads.view).toBe(false);
    // Same version: cache hit returns the identical object.
    expect(await getAccessSnapshot(ctx)).toBe(after);
  });
});

describe("profiles", () => {
  it("clones, edits custom profiles, protects system profiles, deletes with replacement", async () => {
    const s = await setup();
    const clone = await admin.cloneProfile(s.ctx, {
      sourceProfileId: s.administratorId,
      name: "Ops",
      description: "d",
    });
    expect(clone.kind).toBe("custom");
    await expect(
      admin.cloneProfile(s.ctx, { sourceProfileId: s.standardId, name: "ops" }),
    ).rejects.toMatchObject({ fieldErrors: { name: expect.any(Array) } });
    await expect(
      admin.updateProfile(s.ctx, { profileId: s.administratorId, name: "X" }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      admin.updateProfile(s.ctx, { profileId: s.standardId, name: "X" }),
    ).rejects.toBeInstanceOf(ConflictError);

    // Standard: modules/features editable, admin section is not.
    const std = await admin.getProfile(s.ctx, s.standardId);
    const ok = structuredClone(std.permissions);
    ok.modules.Deals.delete = false;
    await expect(
      admin.updateProfile(s.ctx, { profileId: s.standardId, permissions: ok }),
    ).resolves.toBeTruthy();
    const bad = structuredClone(std.permissions);
    bad.admin.userManagement = true;
    await expect(
      admin.updateProfile(s.ctx, { profileId: s.standardId, permissions: bad }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      admin.updateProfile(s.ctx, {
        profileId: clone.id,
        permissions: { ...clone.permissions, extra: 1 },
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(admin.deleteProfile(s.ctx, { profileId: s.standardId })).rejects.toBeInstanceOf(
      ConflictError,
    );
    const member = await addAccessTestMember(s.ctx, { profile: clone.id });
    await expect(admin.deleteProfile(s.ctx, { profileId: clone.id })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await admin.deleteProfile(s.ctx, { profileId: clone.id, replacementProfileId: s.standardId });
    const snap = await getAccessSnapshot(await requireOrgContext(member.headers, s.ctx.orgSlug));
    expect(snap.profileKind).toBe("standard");
    const [row] = await getDb()
      .select({ role: schema.memberships.role })
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, member.user.id));
    expect(row?.role).toBe("member");
  });

  it("field permissions: put, get, replace, required and system field rules, administrator fixed", async () => {
    const s = await setup();
    const clone = await admin.cloneProfile(s.ctx, { sourceProfileId: s.standardId, name: "F" });
    await admin.putFieldPermissions(s.ctx, {
      profileId: clone.id,
      module: "Leads",
      fields: [
        { field: "Phone", access: "read_only" },
        { field: "Email", access: "hidden" },
      ],
    });
    expect(
      await admin.getFieldPermissions(s.ctx, { profileId: clone.id, module: "Leads" }),
    ).toEqual([
      { field: "Email", access: "hidden" },
      { field: "Phone", access: "read_only" },
    ]);
    await expect(
      admin.putFieldPermissions(
        s.ctx,
        {
          profileId: clone.id,
          module: "Leads",
          fields: [{ field: "Last_Name", access: "hidden" }],
        },
        () => ["Last_Name"],
      ),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      admin.putFieldPermissions(s.ctx, {
        profileId: clone.id,
        module: "Leads",
        fields: [{ field: "Created_By", access: "hidden" }],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      admin.putFieldPermissions(s.ctx, {
        profileId: s.administratorId,
        module: "Leads",
        fields: [],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      admin.putFieldPermissions(s.ctx, { profileId: clone.id, module: "Nope", fields: [] }),
    ).rejects.toBeInstanceOf(ValidationError);
    // The failed requests did not change anything; the clone of a profile carries its rows.
    const copy = await admin.cloneProfile(s.ctx, { sourceProfileId: clone.id, name: "F2" });
    expect(
      await admin.getFieldPermissions(s.ctx, { profileId: copy.id, module: "Leads" }),
    ).toHaveLength(2);
    await admin.putFieldPermissions(s.ctx, { profileId: clone.id, module: "Leads", fields: [] });
    expect(
      await admin.getFieldPermissions(s.ctx, { profileId: clone.id, module: "Leads" }),
    ).toEqual([]);
    // Deleting a profile removes its field rows (cascade).
    await admin.deleteProfile(s.ctx, { profileId: copy.id });
    const rows = await getDb()
      .select()
      .from(schema.accessFieldPermissions)
      .where(eq(schema.accessFieldPermissions.profileId, copy.id));
    expect(rows).toEqual([]);
  });
});

describe("roles", () => {
  it("creates under a parent, rejects cycles, protects the root, deletes with transfer", async () => {
    const s = await setup();
    const a = await admin.createRole(s.ctx, { name: "A", parentRoleId: s.managerId });
    const b = await admin.createRole(s.ctx, { name: "B", parentRoleId: a.id });
    await expect(
      admin.createRole(s.ctx, { name: "a", parentRoleId: s.ceoId }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      admin.updateRole(s.ctx, { roleId: a.id, parentRoleId: b.id }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      admin.updateRole(s.ctx, { roleId: s.ceoId, parentRoleId: a.id }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      admin.deleteRole(s.ctx, { roleId: s.ceoId, transferRoleId: s.managerId }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      admin.deleteRole(s.ctx, { roleId: a.id, transferRoleId: b.id }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      admin.deleteRole(s.ctx, { roleId: a.id, transferRoleId: a.id }),
    ).rejects.toBeInstanceOf(ValidationError);

    const member = await addAccessTestMember(s.ctx, { role: "A" });
    const group = await admin.createGroup(s.ctx, {
      name: "Ga",
      members: [{ kind: "role", id: a.id }],
    });
    const rule = await admin.createSharingRule(s.ctx, {
      module: "Leads",
      name: "r",
      sourceKind: "role",
      sourceId: a.id,
      targetKind: "role_and_subordinates",
      targetId: a.id,
      level: "read",
    });
    await admin.deleteRole(s.ctx, { roleId: a.id, transferRoleId: s.managerId });
    const roles = await admin.listRoles(s.ctx);
    expect(roles.find((r) => r.id === b.id)?.parentRoleId).toBe(s.managerId);
    expect(
      (await getAccessSnapshot(await requireOrgContext(member.headers, s.ctx.orgSlug))).roleId,
    ).toBe(s.managerId);
    expect((await admin.getGroup(s.ctx, group.id)).members).toEqual([
      { kind: "role", id: s.managerId },
    ]);
    const rules = await admin.listSharingRules(s.ctx, "Leads");
    expect(rules.find((r) => r.id === rule.id)).toMatchObject({
      sourceId: s.managerId,
      targetId: s.managerId,
    });
  });
});

describe("groups, defaults, rules, assignment", () => {
  it("groups reject cycles, self membership, depth over 5, unknown members and in-use deletion", async () => {
    const s = await setup();
    const g = async (n: string) => admin.createGroup(s.ctx, { name: n });
    const [g0, g1, g2, g3, g4, g5] = [
      await g("g0"),
      await g("g1"),
      await g("g2"),
      await g("g3"),
      await g("g4"),
      await g("g5"),
    ] as [
      Awaited<ReturnType<typeof g>>,
      Awaited<ReturnType<typeof g>>,
      Awaited<ReturnType<typeof g>>,
      Awaited<ReturnType<typeof g>>,
      Awaited<ReturnType<typeof g>>,
      Awaited<ReturnType<typeof g>>,
    ];
    const nest = (parent: { id: string }, child: { id: string }) =>
      admin.updateGroup(s.ctx, { groupId: parent.id, members: [{ kind: "group", id: child.id }] });
    await nest(g0, g1);
    await nest(g1, g2);
    await nest(g2, g3);
    await nest(g3, g4);
    await expect(nest(g4, g0)).rejects.toBeInstanceOf(ValidationError); // cycle
    await expect(nest(g0, g0)).rejects.toBeInstanceOf(ValidationError); // self
    await expect(nest(g4, g5)).rejects.toBeInstanceOf(ValidationError); // depth 6
    await expect(
      admin.updateGroup(s.ctx, {
        groupId: g5.id,
        members: [{ kind: "user", id: crypto.randomUUID() }],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(admin.deleteGroup(s.ctx, { groupId: g1.id })).rejects.toBeInstanceOf(
      ConflictError,
    );
    await admin.deleteGroup(s.ctx, { groupId: g5.id });
  });

  it("module defaults and sharing rules (limit 50 per module)", async () => {
    const s = await setup();
    await admin.putModuleDefaults(s.ctx, {
      defaults: [{ module: "Leads", level: "public_read_write" }],
    });
    expect((await admin.getModuleDefaults(s.ctx)).find((d) => d.module === "Leads")?.level).toBe(
      "public_read_write",
    );
    await expect(
      admin.putModuleDefaults(s.ctx, { defaults: [{ module: "Nope", level: "private" }] }),
    ).rejects.toBeInstanceOf(ValidationError);
    const base = {
      module: "Deals",
      sourceKind: "role",
      sourceId: s.managerId,
      targetKind: "role",
      targetId: s.ceoId,
      level: "read",
    } as const;
    for (let i = 0; i < 50; i++) await admin.createSharingRule(s.ctx, { ...base, name: `r${i}` });
    await expect(admin.createSharingRule(s.ctx, { ...base, name: "over" })).rejects.toMatchObject({
      reason: "limit",
    });
    await expect(
      admin.createSharingRule(s.ctx, {
        ...base,
        module: "Leads",
        name: "x",
        sourceId: crypto.randomUUID(),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    const rules = await admin.listSharingRules(s.ctx, "Deals");
    const target = rules[0];
    if (!target) throw new Error("rule");
    await expect(
      admin.updateSharingRule(s.ctx, target.id, { ...base, module: "Leads", name: "m" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(
      (
        await admin.updateSharingRule(s.ctx, target.id, {
          ...base,
          name: "renamed",
          level: "read_write",
        })
      ).level,
    ).toBe("read_write");
    await admin.deleteSharingRule(s.ctx, target.id);
    expect(await admin.listSharingRules(s.ctx, "Deals")).toHaveLength(49);
  });

  it("owner immutability and lockout guard", async () => {
    const s = await setup();
    const second = await addAccessTestMember(s.ctx, { profile: "administrator", role: "Manager" });
    await expect(
      admin.setMemberAccess(second.ctx, { userId: s.ctx.userId, profileId: s.standardId }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      admin.setMemberAccess(s.ctx, { userId: s.ctx.userId, roleId: s.managerId }),
    ).rejects.toBeInstanceOf(ConflictError);
    const row = await admin.setMemberAccess(s.ctx, {
      userId: second.user.id,
      profileId: s.standardId,
      roleId: s.ceoId,
    });
    expect([row.profileId, row.roleId, row.isOwner]).toEqual([s.standardId, s.ceoId, false]);
    const [ms] = await getDb()
      .select({ role: schema.memberships.role })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.organizationId, s.org.id),
          eq(schema.memberships.userId, second.user.id),
        ),
      );
    expect(ms?.role).toBe("member");
    // Without an owner the last Administrator cannot be demoted.
    await getDb()
      .update(schema.organizations)
      .set({ ownerUserId: null })
      .where(eq(schema.organizations.id, s.org.id));
    await expect(
      admin.setMemberAccess(s.ctx, { userId: s.ctx.userId, profileId: s.standardId }),
    ).rejects.toMatchObject({ message: "An organization must have an Administrator." });
    expect(
      (await admin.listMemberAccess(s.ctx)).find((m) => m.userId === s.ctx.userId)?.profileId,
    ).toBe(s.administratorId);
  });
});

describe("database constraints and RLS", () => {
  it("one root role, one system profile per kind, restrict on in-use rows", async () => {
    const s = await setup();
    const db = getDb();
    await expect(
      db
        .insert(schema.accessRoles)
        .values({ organizationId: s.org.id, name: "Second root", parentRoleId: null }),
    ).rejects.toThrow();
    await expect(
      db.insert(schema.accessProfiles).values({
        organizationId: s.org.id,
        name: "Another admin",
        kind: "administrator",
        permissions: {},
      }),
    ).rejects.toThrow();
    await expect(
      db.delete(schema.accessProfiles).where(eq(schema.accessProfiles.id, s.administratorId)),
    ).rejects.toThrow();
    await expect(
      db.delete(schema.accessRoles).where(eq(schema.accessRoles.id, s.ceoId)),
    ).rejects.toThrow();
    await expect(
      db
        .insert(schema.accessRoles)
        .values({ organizationId: s.org.id, name: "ceo", parentRoleId: s.ceoId }),
    ).rejects.toThrow(); // case-insensitive unique name
    // Removing a member cascades its assignment.
    const member = await addAccessTestMember(s.ctx);
    await db.delete(schema.memberships).where(eq(schema.memberships.userId, member.user.id));
    expect(
      await db
        .select()
        .from(schema.memberAccess)
        .where(eq(schema.memberAccess.userId, member.user.id)),
    ).toEqual([]);
  });

  describe("as crm_app", () => {
    let pool: pg.Pool;
    let owner: pg.Client;
    beforeAll(async () => {
      owner = new pg.Client({ connectionString: process.env.DATABASE_URL });
      await owner.connect();
      await owner.query("alter role crm_app password 'test-runtime'");
      const url = new URL(process.env.DATABASE_URL ?? "");
      url.username = "crm_app";
      url.password = "test-runtime";
      pool = new pg.Pool({ connectionString: url.toString(), max: 2 });
    });
    afterAll(async () => {
      await pool?.end();
      await owner?.end();
    });
    const TABLES = [
      "access_profiles",
      "access_field_permissions",
      "access_roles",
      "access_groups",
      "access_group_members",
      "access_module_defaults",
      "access_sharing_rules",
      "member_access",
      "access_versions",
    ];
    const asOrg = async <T>(
      orgId: string | null,
      run: (c: pg.PoolClient) => Promise<T>,
    ): Promise<T> => {
      const client = await pool.connect();
      try {
        await client.query("begin");
        if (orgId) await client.query("select set_config('app.org_id', $1, true)", [orgId]);
        const out = await run(client);
        await client.query("rollback");
        return out;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    };

    it("sees nothing without a tenant context and only its own tenant with one", async () => {
      const a = await setup();
      const b = await setup();
      for (const t of [a, b]) {
        await admin.createGroup(t.ctx, {
          name: "Group",
          members: [{ kind: "user", id: t.ctx.userId }],
        });
        await admin.putFieldPermissions(t.ctx, {
          profileId: t.standardId,
          module: "Leads",
          fields: [{ field: "Phone", access: "hidden" }],
        });
        await admin.createSharingRule(t.ctx, {
          module: "Leads",
          name: "r",
          sourceKind: "role",
          sourceId: t.managerId,
          targetKind: "role",
          targetId: t.ceoId,
          level: "read",
        });
      }
      for (const table of TABLES) {
        expect(
          await asOrg(null, async (c) => (await c.query(`select 1 from ${table}`)).rowCount),
        ).toBe(0);
        const rows = await asOrg(
          a.org.id,
          async (c) => (await c.query(`select distinct organization_id from ${table}`)).rows,
        );
        expect(rows).toEqual([{ organization_id: a.org.id }]);
        const other = await asOrg(
          b.org.id,
          async (c) => (await c.query(`select distinct organization_id from ${table}`)).rows,
        );
        expect(other).toEqual([{ organization_id: b.org.id }]);
      }
    });

    it("cannot write another tenant's rows (WITH CHECK), nor update or delete them", async () => {
      const a = await setup();
      const b = await setup();
      await expect(
        asOrg(a.org.id, (c) =>
          c.query("insert into access_groups (organization_id, name) values ($1, 'leak')", [
            b.org.id,
          ]),
        ),
      ).rejects.toThrow();
      await expect(
        asOrg(null, (c) =>
          c.query(
            "insert into access_module_defaults (organization_id, module, level) values ($1, 'X', 'private')",
            [a.org.id],
          ),
        ),
      ).rejects.toThrow();
      const updated = await asOrg(a.org.id, (c) =>
        c.query("update access_profiles set description = 'x' where organization_id = $1", [
          b.org.id,
        ]),
      );
      expect(updated.rowCount).toBe(0);
      const deleted = await asOrg(a.org.id, (c) =>
        c.query(
          "delete from access_roles where organization_id = $1 and parent_role_id is not null",
          [b.org.id],
        ),
      );
      expect(deleted.rowCount).toBe(0);
      // The runtime role has no DDL and no TRUNCATE on the access tables.
      await expect(asOrg(a.org.id, (c) => c.query("truncate access_profiles"))).rejects.toThrow();
    });
  });
});
