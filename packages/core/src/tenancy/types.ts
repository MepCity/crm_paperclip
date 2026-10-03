import type { Database, schema } from "@crm/db";

export type OrgRole = "admin" | "member";
export type OrgContext = {
  orgId: string;
  orgSlug: string;
  orgName: string;
  userId: string;
  role: OrgRole;
};
export type Organization = typeof schema.organizations.$inferSelect;
export type Invitation = typeof schema.invitations.$inferSelect;
export type Member = { userId: string; name: string; email: string; role: OrgRole; joinedAt: Date };
export type InvitationPreview = {
  organizationName: string;
  email: string;
  role: OrgRole;
  status: "pending" | "expired" | "revoked" | "accepted";
};
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
