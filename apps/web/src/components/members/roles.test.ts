import { describe, expect, test } from "vitest";
import type { InvitationActionState } from "./invitation-state";
import { MEMBER_ROLES, type MemberRole, roleLabel } from "./roles";

describe("roles", () => {
  test("MEMBER_ROLES exports the complete list of member roles", () => {
    expect(MEMBER_ROLES).toEqual([
      { id: "admin", label: "Admin" },
      { id: "member", label: "Member" },
    ]);
    expect(MEMBER_ROLES).toHaveLength(2);
  });

  test("roleLabel maps each MemberRole to its human-readable label", () => {
    expect(roleLabel("admin")).toBe("Admin");
    expect(roleLabel("member")).toBe("Member");
  });

  test("roleLabel falls back to role string if role is unknown", () => {
    const unknownRole = "custom" as unknown as MemberRole;
    expect(roleLabel(unknownRole)).toBe("custom");
  });

  test("MemberRole type covers all member role identifiers", () => {
    const adminRole: MemberRole = "admin";
    const memberRole: MemberRole = "member";
    const roles: MemberRole[] = [adminRole, memberRole];
    expect(roles).toEqual(MEMBER_ROLES.map((r) => r.id));
  });
});

describe("invitation-state", () => {
  test("InvitationActionState supports the complete list of invitation status values", () => {
    const idleState: InvitationActionState = { status: "idle" };
    const successState: InvitationActionState = {
      status: "success",
      inviteUrl: "https://crm.example.test/invite/token-123",
    };
    const errorState: InvitationActionState = {
      status: "error",
      message: "The invitation could not be sent.",
      fieldErrors: { email: ["Invalid email address"] },
    };

    const statusList: InvitationActionState["status"][] = [
      idleState.status,
      successState.status,
      errorState.status,
    ];

    expect(statusList).toEqual(["idle", "success", "error"]);
    expect(idleState).toEqual({ status: "idle" });
    expect(successState).toEqual({
      status: "success",
      inviteUrl: "https://crm.example.test/invite/token-123",
    });
    expect(errorState).toEqual({
      status: "error",
      message: "The invitation could not be sent.",
      fieldErrors: { email: ["Invalid email address"] },
    });
  });
});
