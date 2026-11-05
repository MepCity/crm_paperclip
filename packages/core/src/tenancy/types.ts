import type { Database, schema } from "@crm/db";

export type OrgRole = "admin" | "member";
export type OrgContext = {
  orgId: string;
  orgSlug: string;
  orgName: string;
  userId: string;
  role: OrgRole;
  /** `access_versions.version` read with the membership row (ADR 0017 §5); null if not visible. */
  accessVersion?: number | null;
};
export type Organization = typeof schema.organizations.$inferSelect;
export type Invitation = {
  id: string;
  organizationId: string;
  email: string;
  role: OrgRole;
  expiresAt: Date;
  invitedBy: string;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};
export type Member = { userId: string; name: string; email: string; role: OrgRole; joinedAt: Date };
export type InvitationPreview = {
  organizationName: string;
  email: string;
  role: OrgRole;
  status: "pending" | "expired" | "revoked" | "accepted";
};
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
