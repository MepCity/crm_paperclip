import { schema } from "@crm/db";
import { and, eq, sql } from "drizzle-orm";
import type { Transaction } from "../tenancy/types";
import {
  ADMINISTRATOR_NAME,
  administratorPermissions,
  MANAGER_ROLE_NAME,
  ROOT_ROLE_NAME,
  STANDARD_NAME,
  seedModuleDefaults,
  standardPermissions,
} from "./catalogue";

export type SeededAccess = {
  administratorProfileId: string;
  standardProfileId: string;
  rootRoleId: string;
  managerRoleId: string;
};

/** Adds 1 to the organisation's access version inside the caller's transaction. */
export async function bumpAccessVersion(tx: Transaction, orgId: string): Promise<void> {
  await tx
    .insert(schema.accessVersions)
    .values({ organizationId: orgId, version: 1 })
    .onConflictDoUpdate({
      target: schema.accessVersions.organizationId,
      set: { version: sql`${schema.accessVersions.version} + 1` },
    });
}

/** Seeds the system profiles, roles and module defaults of a new organisation (ADR 0017 §10). */
export async function seedOrganizationAccess(
  tx: Transaction,
  orgId: string,
): Promise<SeededAccess> {
  await tx.execute(sql`select set_config('app.org_id', ${orgId}, true)`);
  const [admin] = await tx
    .insert(schema.accessProfiles)
    .values({
      organizationId: orgId,
      name: ADMINISTRATOR_NAME,
      description: "Full access to every module and setting.",
      kind: "administrator",
      permissions: administratorPermissions(),
    })
    .returning({ id: schema.accessProfiles.id });
  const [standard] = await tx
    .insert(schema.accessProfiles)
    .values({
      organizationId: orgId,
      name: STANDARD_NAME,
      description: "All permissions except administrative privileges.",
      kind: "standard",
      permissions: standardPermissions(),
    })
    .returning({ id: schema.accessProfiles.id });
  const [root] = await tx
    .insert(schema.accessRoles)
    .values({
      organizationId: orgId,
      name: ROOT_ROLE_NAME,
      parentRoleId: null,
      shareWithPeers: true,
    })
    .returning({ id: schema.accessRoles.id });
  if (!admin || !standard || !root) throw new Error("Access seed returned no row");
  const [manager] = await tx
    .insert(schema.accessRoles)
    .values({
      organizationId: orgId,
      name: MANAGER_ROLE_NAME,
      parentRoleId: root.id,
      shareWithPeers: false,
    })
    .returning({ id: schema.accessRoles.id });
  if (!manager) throw new Error("Access seed returned no row");
  await tx
    .insert(schema.accessModuleDefaults)
    .values(seedModuleDefaults().map((d) => ({ organizationId: orgId, ...d })));
  await bumpAccessVersion(tx, orgId);
  return {
    administratorProfileId: admin.id,
    standardProfileId: standard.id,
    rootRoleId: root.id,
    managerRoleId: manager.id,
  };
}

export async function systemProfileId(
  tx: Transaction,
  orgId: string,
  kind: "administrator" | "standard",
): Promise<string> {
  const [row] = await tx
    .select({ id: schema.accessProfiles.id })
    .from(schema.accessProfiles)
    .where(
      and(eq(schema.accessProfiles.organizationId, orgId), eq(schema.accessProfiles.kind, kind)),
    );
  if (!row) throw new Error(`Missing ${kind} profile`);
  return row.id;
}

export async function rootRoleId(tx: Transaction, orgId: string): Promise<string> {
  const [row] = await tx
    .select({ id: schema.accessRoles.id })
    .from(schema.accessRoles)
    .where(
      and(
        eq(schema.accessRoles.organizationId, orgId),
        sql`${schema.accessRoles.parentRoleId} is null`,
      ),
    );
  if (!row) throw new Error("Missing root role");
  return row.id;
}
