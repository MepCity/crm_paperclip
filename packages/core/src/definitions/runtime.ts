import { createDb } from "@crm/db";
import { createPostgresDefinitionRepository } from "@crm/db/definitions";
import { createTenantDatabase } from "@crm/db/tenancy";
import type { CustomizationPort } from "../customization/types";
import { fixtureCustomizationPort } from "../records/fixture/metadata-projection";
import { createDefinitionPorts } from "./service";

let shared: Promise<ReturnType<typeof createPostgresDefinitionRepository>> | undefined;

/** Dedicated restricted connection; never fall back to the identity/owner pool. */
export async function getPersistentDefinitionPorts(
  customization: Pick<CustomizationPort, "readEffective"> = fixtureCustomizationPort(),
) {
  shared ??= (async () => {
    const url = process.env.CRM_DATABASE_URL;
    if (!url) throw new Error("CRM persistence is unavailable");
    const db = createDb(url);
    try {
      const tenant = await createTenantDatabase(db.$client, []);
      return createPostgresDefinitionRepository(tenant);
    } catch (error) {
      await db.$client.end();
      throw error;
    }
  })().catch((error) => {
    shared = undefined;
    throw error;
  });
  return createDefinitionPorts({
    repository: await shared,
    customization,
    // Until report-manage permissions exist, only admins may write reports.
    canManageReports: async () => false,
  });
}
