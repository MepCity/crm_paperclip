import { describe, expect, it } from "vitest";
import { ForbiddenError } from "../errors";
import {
  administratorPermissions,
  type ProfilePermissions,
  parseStoredPermissions,
  profilePermissionsWriteSchema,
  standardPermissions,
} from "./catalogue";
import {
  assertCan,
  assertFieldUsable,
  buildAccessSnapshot,
  can,
  canOnRecord,
  childRecordLevel,
  fieldAccess,
  recordLevel,
  visibleOwnerIds,
} from "./evaluate";
import { assertGroupGraph, groupDepth, resolveGroupUsers } from "./groups";
import type { AccessData, AccessGroupMemberRow, AccessRoleRow } from "./types";

const ORG = "org";
// ceo -> manager -> rep ; ceo -> sales (sibling of manager)
const roles: AccessRoleRow[] = [
  { id: "ceo", name: "CEO", parentRoleId: null, shareWithPeers: true },
  { id: "manager", name: "Manager", parentRoleId: "ceo", shareWithPeers: false },
  { id: "rep", name: "Rep", parentRoleId: "manager", shareWithPeers: false },
  { id: "sales", name: "Sales", parentRoleId: "ceo", shareWithPeers: true },
];
const members = [
  { userId: "u-ceo", roleId: "ceo", profileId: "p" },
  { userId: "u-ceo2", roleId: "ceo", profileId: "p" },
  { userId: "u-manager", roleId: "manager", profileId: "p" },
  { userId: "u-manager2", roleId: "manager", profileId: "p" },
  { userId: "u-rep", roleId: "rep", profileId: "p" },
  { userId: "u-sales", roleId: "sales", profileId: "p" },
  { userId: "u-sales2", roleId: "sales", profileId: "p" },
];

function snap(
  userId: string,
  over: Partial<AccessData> & {
    permissions?: ProfilePermissions;
    kind?: "administrator" | "standard" | "custom";
  } = {},
) {
  return buildAccessSnapshot({
    orgId: ORG,
    userId,
    version: 1,
    profile: {
      id: "p",
      kind: over.kind ?? "standard",
      permissions: over.permissions ?? standardPermissions(),
    },
    fieldRows: [],
    roles,
    members,
    groupMembers: [],
    defaults: [],
    rules: [],
    ...over,
  });
}

describe("catalogue", () => {
  it("round-trips the system profiles and rejects unknown keys on write, drops them on read", () => {
    expect(profilePermissionsWriteSchema.safeParse(administratorPermissions()).success).toBe(true);
    expect(
      profilePermissionsWriteSchema.safeParse({ ...standardPermissions(), extra: 1 }).success,
    ).toBe(false);
    const read = parseStoredPermissions({ ...standardPermissions(), extra: 1 });
    expect("extra" in read).toBe(false);
  });
  it("Standard is Administrator minus admin.*", () => {
    const admin = administratorPermissions();
    const std = standardPermissions();
    expect({ ...std, admin: null }).toEqual({ ...admin, admin: null });
    expect(std.admin.userManagement).toBe(false);
    expect(std.admin.viewAllRecords).toEqual([]);
  });
});

describe("profile gate", () => {
  it("module actions need view", () => {
    const perms = standardPermissions();
    perms.modules.Leads = { view: false, create: true, edit: true, delete: true };
    perms.modules.Deals = { view: true, create: true, edit: false, delete: false };
    const s = snap("u-rep", { permissions: perms });
    expect(can(s, "Leads", "view")).toBe(false);
    expect(can(s, "Leads", "create")).toBe(false);
    expect(can(s, "Deals", "view")).toBe(true);
    expect(can(s, "Deals", "create")).toBe(true);
    expect(can(s, "Deals", "edit")).toBe(false);
    expect(can(s, "Unknown", "view")).toBe(false);
  });
  it("Administrator bypasses and denial throws permission_denied", () => {
    const admin = snap("u-ceo", { kind: "administrator", permissions: administratorPermissions() });
    expect(can(admin, "Anything", "delete")).toBe(true);
    const perms = standardPermissions();
    perms.modules.Leads.delete = false;
    const s = snap("u-rep", { permissions: perms });
    expect(() => assertCan(s, "Leads", "delete")).toThrowError(ForbiddenError);
    try {
      assertCan(s, "Leads", "delete");
    } catch (e) {
      expect((e as ForbiddenError).code).toBe("permission_denied");
    }
  });
});

describe("field access", () => {
  const rows = [
    { module: "Leads", field: "Phone", access: "read_only" as const },
    { module: "Leads", field: "Email", access: "hidden" as const },
    { module: "Leads", field: "Created_By", access: "hidden" as const },
  ];
  it("defaults to read_write, honours rows, never hides system fields, fixes Administrator", () => {
    const s = snap("u-rep", { fieldRows: rows });
    expect(fieldAccess(s, "Leads", "Company")).toBe("read_write");
    expect(fieldAccess(s, "Leads", "Phone")).toBe("read_only");
    expect(fieldAccess(s, "Leads", "Email")).toBe("hidden");
    expect(fieldAccess(s, "Leads", "Created_By")).toBe("read_only");
    expect(fieldAccess(s, "Contacts", "Email")).toBe("read_write");
    const admin = snap("u-ceo", { kind: "administrator", fieldRows: rows });
    expect(fieldAccess(admin, "Leads", "Email")).toBe("read_write");
  });
  it("hidden fields fail read and write, read_only fails write only, with field_forbidden", () => {
    const s = snap("u-rep", { fieldRows: rows });
    expect(() => assertFieldUsable(s, "Leads", "Email", "read")).toThrowError(ForbiddenError);
    expect(() => assertFieldUsable(s, "Leads", "Phone", "read")).not.toThrow();
    expect(() => assertFieldUsable(s, "Leads", "Phone", "write")).toThrowError(ForbiddenError);
    try {
      assertFieldUsable(s, "Leads", "Email", "write");
    } catch (e) {
      expect((e as ForbiddenError).code).toBe("field_forbidden");
    }
  });
});

describe("record level", () => {
  it("owner gets RWD, empty owner and others get the default (private = none)", () => {
    const s = snap("u-rep");
    expect(recordLevel(s, "Leads", "u-rep")).toBe("read_write_delete");
    expect(recordLevel(s, "Leads", "u-manager")).toBe("none");
    expect(recordLevel(s, "Leads", null)).toBe("none");
  });
  it("the four defaults", () => {
    const levels = {
      private: "none",
      public_read: "read",
      public_read_write: "read_write",
      public_read_write_delete: "read_write_delete",
    } as const;
    for (const [value, level] of Object.entries(levels)) {
      const s = snap("u-rep", {
        defaults: [{ module: "Leads", level: value as keyof typeof levels }],
      });
      expect(recordLevel(s, "Leads", "u-sales")).toBe(level);
      expect(recordLevel(s, "Leads", null)).toBe(level);
      expect(recordLevel(s, "Deals", "u-sales")).toBe("none");
    }
  });
  it("hierarchy grants upwards only: self, child, grandchild yes; parent, sibling no", () => {
    const manager = snap("u-manager");
    expect(recordLevel(manager, "Leads", "u-rep")).toBe("read_write_delete"); // child
    expect(recordLevel(manager, "Leads", "u-ceo")).toBe("none"); // parent
    expect(recordLevel(manager, "Leads", "u-sales")).toBe("none"); // sibling branch
    const ceo = snap("u-ceo");
    expect(recordLevel(ceo, "Leads", "u-rep")).toBe("read_write_delete"); // grandchild
    expect(recordLevel(ceo, "Leads", "u-manager")).toBe("read_write_delete");
    const rep = snap("u-rep");
    expect(recordLevel(rep, "Leads", "u-manager")).toBe("none");
  });
  it("peers only with share_with_peers", () => {
    // sales has share_with_peers true; manager has false
    expect(recordLevel(snap("u-sales"), "Leads", "u-sales2")).toBe("read_write_delete");
    expect(recordLevel(snap("u-manager"), "Leads", "u-manager2")).toBe("none");
    // the root role (peers true)
    expect(recordLevel(snap("u-ceo"), "Leads", "u-ceo2")).toBe("read_write_delete");
  });
  it("view-all and modify-all", () => {
    const perms = standardPermissions();
    perms.admin.viewAllRecords = ["Leads"];
    perms.admin.modifyAllRecords = ["Deals"];
    const s = snap("u-rep", { permissions: perms });
    expect(recordLevel(s, "Leads", "u-sales")).toBe("read");
    expect(recordLevel(s, "Deals", "u-sales")).toBe("read_write_delete");
    expect(recordLevel(s, "Contacts", "u-sales")).toBe("none");
  });
  it("Administrator is RWD everywhere", () => {
    const s = snap("u-rep", { kind: "administrator" });
    expect(recordLevel(s, "Leads", null)).toBe("read_write_delete");
  });
  it("profile AND level: neither alone grants", () => {
    const perms = standardPermissions();
    perms.modules.Leads.edit = false;
    const s = snap("u-manager", { permissions: perms });
    expect(canOnRecord(s, "Leads", "edit", "u-rep")).toBe(false); // level ok, profile no
    expect(canOnRecord(s, "Leads", "view", "u-rep")).toBe(true);
    expect(canOnRecord(s, "Leads", "view", "u-sales")).toBe(false); // profile ok, level no
  });
  it("child modules follow the parent; an author keeps RWD when the parent is readable", () => {
    expect(childRecordLevel("read", false)).toBe("read");
    expect(childRecordLevel("read", true)).toBe("read_write_delete");
    expect(childRecordLevel("none", true)).toBe("none");
  });
});

describe("sharing rules and groups", () => {
  const rule = (over: Record<string, unknown>) => ({
    id: "r",
    module: "Leads",
    sourceKind: "role" as const,
    sourceId: "sales",
    targetKind: "role" as const,
    targetId: "rep",
    level: "read" as const,
    ...over,
  });
  it("role -> role: target viewers get the level on source owners, only in that module", () => {
    const s = snap("u-rep", { rules: [rule({})] });
    expect(recordLevel(s, "Leads", "u-sales")).toBe("read");
    expect(recordLevel(s, "Leads", "u-sales2")).toBe("read");
    expect(recordLevel(s, "Deals", "u-sales")).toBe("none");
    expect(recordLevel(snap("u-manager2"), "Leads", "u-sales")).toBe("none");
  });
  it("role_and_subordinates source and target", () => {
    const s = snap("u-rep", {
      rules: [
        rule({
          sourceKind: "role_and_subordinates",
          sourceId: "manager",
          targetKind: "role_and_subordinates",
          targetId: "manager",
        }),
      ],
    });
    expect(recordLevel(s, "Leads", "u-manager2")).toBe("read");
    expect(recordLevel(s, "Leads", "u-sales")).toBe("none");
  });
  it("not inherited by the managers of a subordinate (O1)", () => {
    const rules = [rule({})];
    expect(recordLevel(snap("u-rep", { rules }), "Leads", "u-sales")).toBe("read");
    expect(recordLevel(snap("u-manager", { rules }), "Leads", "u-sales")).toBe("none");
  });
  it("combines by maximum with hierarchy", () => {
    const rules = [rule({ sourceId: "rep", targetId: "manager", level: "read" })];
    expect(recordLevel(snap("u-manager", { rules }), "Leads", "u-rep")).toBe("read_write_delete");
    const low = [
      rule({ sourceId: "sales", targetId: "manager", level: "read" }),
      rule({ id: "r2", sourceId: "sales", targetId: "manager", level: "read_write" }),
    ];
    expect(recordLevel(snap("u-manager", { rules: low }), "Leads", "u-sales")).toBe("read_write");
  });
  const gm = (groupId: string, kind: AccessGroupMemberRow["kind"], memberId: string) => ({
    groupId,
    kind,
    memberId,
  });
  it("group source and target resolve users, roles, subroles and nested groups", () => {
    const groupMembers = [
      gm("g1", "user", "u-sales"),
      gm("g1", "group", "g2"),
      gm("g2", "role", "sales"),
      gm("g3", "role_and_subordinates", "manager"),
    ];
    const s = snap("u-rep", {
      groupMembers,
      rules: [rule({ sourceKind: "group", sourceId: "g1", targetKind: "group", targetId: "g3" })],
    });
    expect(recordLevel(s, "Leads", "u-sales")).toBe("read");
    expect(recordLevel(s, "Leads", "u-sales2")).toBe("read");
    expect(recordLevel(s, "Leads", "u-manager")).toBe("none");
  });
  it("resolution survives a stored cycle and rejects new cycles and depth > 5", () => {
    const usersByRole = new Map([["sales", ["u-sales"]]]);
    const cyc = [gm("a", "group", "b"), gm("b", "group", "a"), gm("b", "role", "sales")];
    expect([...resolveGroupUsers("a", cyc, roles, usersByRole)]).toEqual(["u-sales"]);
    expect(() => assertGroupGraph(cyc)).toThrow();
    expect(() => assertGroupGraph([gm("a", "group", "a")])).toThrow();
    const chain = (n: number) =>
      Array.from({ length: n - 1 }, (_, i) => gm(`g${i}`, "group", `g${i + 1}`));
    expect(groupDepth("g0", chain(5))).toBe(5);
    expect(() => assertGroupGraph(chain(5))).not.toThrow();
    expect(() => assertGroupGraph(chain(6))).toThrow();
  });
});

describe("visibleOwnerIds (query predicate input)", () => {
  it("returns everything for admin, view-all and sufficient defaults; otherwise the owner set", () => {
    expect(visibleOwnerIds(snap("u-rep", { kind: "administrator" }), "Leads")).toEqual({
      all: true,
    });
    const perms = standardPermissions();
    perms.admin.viewAllRecords = ["Leads"];
    expect(visibleOwnerIds(snap("u-rep", { permissions: perms }), "Leads")).toEqual({ all: true });
    expect(visibleOwnerIds(snap("u-rep", { permissions: perms }), "Leads", "edit")).toEqual({
      all: false,
      owners: ["u-rep"],
    });
    const open = snap("u-rep", { defaults: [{ module: "Leads", level: "public_read" }] });
    expect(visibleOwnerIds(open, "Leads")).toEqual({ all: true });
    expect(visibleOwnerIds(open, "Leads", "edit")).toEqual({ all: false, owners: ["u-rep"] });
    const mgr = visibleOwnerIds(snap("u-manager"), "Leads");
    expect(mgr).toMatchObject({ all: false });
    if (!mgr.all) expect(new Set(mgr.owners)).toEqual(new Set(["u-manager", "u-rep"]));
  });
});
