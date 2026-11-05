import {
  administratorPermissions,
  buildAccessSnapshot,
  type ProfilePermissions,
} from "@crm/core/access";
import { describe, expect, it } from "vitest";
import { OPERATION_PERMISSIONS, TAGS_BIN_PERMISSIONS } from "@/lib/api/route-permissions";
import { isExemptPermission, type PermissionSpec, permissionAllows } from "./route-permission";

/** A profile that grants nothing at all (every list empty, every flag false). */
function emptyPermissions(): ProfilePermissions {
  const admin = administratorPermissions();
  const falsify = (value: unknown): unknown =>
    typeof value === "boolean"
      ? false
      : Array.isArray(value)
        ? []
        : value && typeof value === "object"
          ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, falsify(v)]))
          : value;
  return { ...(falsify(admin) as ProfilePermissions), schemaVersion: admin.schemaVersion };
}

function snapshot(kind: "administrator" | "custom", permissions: ProfilePermissions) {
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
}

/** Generated route matrix (ADR 0017 §11.4): admin allowed, empty profile denied (403). */
describe("generated route matrix", () => {
  const admin = snapshot("administrator", administratorPermissions());
  const nobody = snapshot("custom", emptyPermissions());
  const entries = [
    ...Object.entries(OPERATION_PERMISSIONS),
    ...Object.entries(TAGS_BIN_PERMISSIONS),
  ] as [string, PermissionSpec][];

  it.each(entries)("%s", (_name, spec) => {
    const request = { params: { module: "leads" }, query: { module: "Leads" }, method: "GET" };
    const permission = typeof spec === "function" ? spec(request) : spec;
    expect(permissionAllows(admin, permission, request)).toBe(true);
    // Exempt entries (memberOnly/public) pass the profile gate by design; every other
    // entry point must refuse a profile that grants nothing.
    expect(permissionAllows(nobody, permission, request)).toBe(isExemptPermission(permission));
  });
});
