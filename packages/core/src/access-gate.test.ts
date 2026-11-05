import { describe, expect, it } from "vitest";
import { administratorPermissions, buildAccessSnapshot, standardPermissions } from "./access";
import { adminPermitted } from "./access-gate";
import type { OrgContext } from "./tenancy/types";

const ctx = (role: "admin" | "member"): OrgContext => ({
  orgId: "o",
  orgSlug: "o",
  orgName: "O",
  userId: "u",
  role,
});
const snapshot = (kind: "administrator" | "custom", automation: boolean) => {
  const permissions = kind === "administrator" ? administratorPermissions() : standardPermissions();
  permissions.admin.manageAutomation = automation;
  return buildAccessSnapshot({
    orgId: "o",
    userId: "u",
    version: 1,
    profile: { id: "p", kind, permissions },
    fieldRows: [],
    roles: [{ id: "r", name: "CEO", parentRoleId: null, shareWithPeers: false }],
    members: [{ userId: "u", roleId: "r", profileId: "p" }],
    groupMembers: [],
    defaults: [],
    rules: [],
  });
};

describe("adminPermitted", () => {
  it("passes administrators without a lookup and fails closed without a loader", async () => {
    expect(await adminPermitted(ctx("admin"), "manageAutomation")).toBe(true);
    expect(await adminPermitted(ctx("member"), "manageAutomation")).toBe(false);
  });
  it("follows the profile key for other members", async () => {
    const yes = async () => snapshot("custom", true);
    const no = async () => snapshot("custom", false);
    expect(await adminPermitted(ctx("member"), "manageAutomation", yes)).toBe(true);
    expect(await adminPermitted(ctx("member"), "manageAutomation", no)).toBe(false);
    expect(await adminPermitted(ctx("member"), "dataManagement", yes)).toBe(false);
  });
});
