import { describe, expect, it } from "vitest";
import { MEMBER_ROLES, type MemberRole, roleLabel } from "./roles";

describe("MEMBER_ROLES", () => {
  it("defines the expected list of member roles", () => {
    expect(MEMBER_ROLES).toEqual([
      { id: "admin", label: "Admin" },
      { id: "member", label: "Member" },
    ]);
  });

  it("contains unique ids and non-empty labels", () => {
    const ids = MEMBER_ROLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const role of MEMBER_ROLES) {
      expect(role.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("has exactly two roles in the prescribed order", () => {
    expect(MEMBER_ROLES).toHaveLength(2);
    expect(MEMBER_ROLES[0]?.id).toBe("admin");
    expect(MEMBER_ROLES[1]?.id).toBe("member");
  });
});

describe("roleLabel", () => {
  it("returns human-readable labels for standard member roles", () => {
    expect(roleLabel("admin")).toBe("Admin");
    expect(roleLabel("member")).toBe("Member");
  });

  it("falls back to the input string for unknown or custom roles", () => {
    expect(roleLabel("guest" as MemberRole)).toBe("guest");
    expect(roleLabel("superadmin" as MemberRole)).toBe("superadmin");
    expect(roleLabel("manager" as MemberRole)).toBe("manager");
  });

  it("handles empty and whitespace strings as unknown roles", () => {
    expect(roleLabel("" as MemberRole)).toBe("");
    expect(roleLabel("   " as MemberRole)).toBe("   ");
  });

  it("is case-sensitive and does not match uppercase variants", () => {
    expect(roleLabel("ADMIN" as MemberRole)).toBe("ADMIN");
    expect(roleLabel("Member" as MemberRole)).toBe("Member");
  });

  it("falls back to undefined or null when invoked with falsy non-string values", () => {
    expect(roleLabel(undefined as unknown as MemberRole)).toBeUndefined();
    expect(roleLabel(null as unknown as MemberRole)).toBeNull();
  });
});
