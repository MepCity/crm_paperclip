import { schema } from "@crm/db";
import { seedOrganizationAccess } from "../access/seed";
import type { SessionUser } from "../auth";
import type { Transaction } from "./types";

/** Shared onboarding write, also used by the temporary local admin seed. */
export async function insertOrganization(
  tx: Transaction,
  user: SessionUser,
  values: { name: string; slug: string },
) {
  const [org] = await tx
    .insert(schema.organizations)
    .values({ ...values, ownerUserId: user.id })
    .returning();
  if (!org) throw new Error("Organization insert returned no row");
  await tx
    .insert(schema.memberships)
    .values({ organizationId: org.id, userId: user.id, role: "admin" });
  const seeded = await seedOrganizationAccess(tx, org.id);
  await tx.insert(schema.memberAccess).values({
    organizationId: org.id,
    userId: user.id,
    profileId: seeded.administratorProfileId,
    roleId: seeded.rootRoleId,
  });
  return org;
}
