import { schema } from "@crm/db";
import type { SessionUser } from "../auth";
import type { Transaction } from "./types";

/** Shared onboarding write, also used by the temporary local admin seed. */
export async function insertOrganization(
  tx: Transaction,
  user: SessionUser,
  values: { name: string; slug: string },
) {
  const [org] = await tx.insert(schema.organizations).values(values).returning();
  if (!org) throw new Error("Organization insert returned no row");
  await tx
    .insert(schema.memberships)
    .values({ organizationId: org.id, userId: user.id, role: "admin" });
  return org;
}
