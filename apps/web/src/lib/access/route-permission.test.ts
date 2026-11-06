import {
  administratorPermissions,
  buildAccessSnapshot,
  standardPermissions,
} from "@crm/core/access";
import { describe, expect, it } from "vitest";
import { permissionAllows, REQUEST_MODULE } from "./route-permission";

function snapshot(kind: "administrator" | "standard") {
  return buildAccessSnapshot({
    orgId: "o",
    userId: "u",
    version: 1,
    profile: {
      id: "p",
      kind,
      permissions: kind === "administrator" ? administratorPermissions() : standardPermissions(),
    },
    fieldRows: [],
    roles: [{ id: "r", name: "CEO", parentRoleId: null, shareWithPeers: false }],
    members: [{ userId: "u", roleId: "r", profileId: "p" }],
    groupMembers: [],
    defaults: [],
    rules: [],
  });
}

describe("feeds feature permission", () => {
  it("is refused (403 path) without features.feeds.view and allowed with it", () => {
    const perms = standardPermissions();
    perms.features.feeds = { view: false, post: false };
    const denied = buildAccessSnapshot({
      orgId: "o",
      userId: "u",
      version: 1,
      profile: { id: "p", kind: "standard", permissions: perms },
      fieldRows: [],
      roles: [{ id: "r", name: "CEO", parentRoleId: null, shareWithPeers: false }],
      members: [{ userId: "u", roleId: "r", profileId: "p" }],
      groupMembers: [],
      defaults: [],
      rules: [],
    });
    expect(permissionAllows(denied, { feature: "feeds", action: "view" })).toBe(false);
    expect(permissionAllows(denied, { feature: "feeds", action: "post" })).toBe(false);
    expect(permissionAllows(snapshot("standard"), { feature: "feeds", action: "post" })).toBe(true);
  });
});

describe("permissionAllows", () => {
  const std = snapshot("standard");
  const admin = snapshot("administrator");
  it("exempt declarations always pass", () => {
    expect(permissionAllows(std, { public: "x" })).toBe(true);
    expect(permissionAllows(std, { memberOnly: "x" })).toBe(true);
  });
  it("administrators pass everything, standard users lack admin keys", () => {
    expect(permissionAllows(admin, { admin: "userManagement" })).toBe(true);
    expect(permissionAllows(std, { admin: "userManagement" })).toBe(false);
    expect(permissionAllows(std, { admin: "moduleCustomization" })).toBe(false);
  });
  it("resolves the request module case-insensitively", () => {
    const req = { params: { module: "leads" } };
    expect(permissionAllows(std, { module: REQUEST_MODULE, action: "view" }, req)).toBe(true);
    expect(
      permissionAllows(
        std,
        { module: REQUEST_MODULE, action: "view" },
        { params: { module: "Nope" } },
      ),
    ).toBe(false);
  });
  it("combines allOf", () => {
    expect(
      permissionAllows(std, {
        allOf: [{ module: "Leads", action: "view" }, { admin: "dataManagement" }],
      }),
    ).toBe(false);
  });
});
