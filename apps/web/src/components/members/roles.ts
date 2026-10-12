export const MEMBER_ROLES = [
  { id: "admin", label: "Admin" },
  { id: "member", label: "Member" },
] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number]["id"];

export function roleLabel(role: MemberRole): string {
  return MEMBER_ROLES.find((item) => item.id === role)?.label ?? role;
}
