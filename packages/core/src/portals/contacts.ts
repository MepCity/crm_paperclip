import type { InMemorySchemaCoordinator } from "../customization/coordinator";
import { NotFoundError } from "../errors";
import { createFixtureRecordService } from "../records/fixture";
import { systemOrgContext } from "../tenancy";

export interface PortalContact {
  id: string;
  email: string | null;
  name: string;
}

/** Reads a Contact that exists and is not in the recycle bin; null otherwise. */
export type PortalContactReader = (
  orgId: string,
  contactId: string,
) => Promise<PortalContact | null>;

/**
 * The reader must open the organisation's record store with the same schema coordinator as
 * member services: a store first opened without it refuses a later schema-bound service.
 */
export function createFixtureContactReader(
  schema?: InMemorySchemaCoordinator,
): PortalContactReader {
  return (orgId, contactId) => readContact(orgId, contactId, schema);
}

export const fixtureContactReader: PortalContactReader = createFixtureContactReader();

async function readContact(
  orgId: string,
  contactId: string,
  schema: InMemorySchemaCoordinator | undefined,
): Promise<PortalContact | null> {
  try {
    // System read (ADR 0017 §4.8) used only to prove the identity's own linked Contact.
    const record = await createFixtureRecordService(systemOrgContext(orgId), {
      system: true,
      ...(schema ? { schema } : {}),
    }).get("Contacts", contactId);
    const email = typeof record.fields.Email === "string" ? record.fields.Email.trim() : "";
    const full = record.fields.Full_Name;
    const name =
      typeof full === "string" && full.trim()
        ? full.trim()
        : [record.fields.First_Name, record.fields.Last_Name]
            .filter((v): v is string => typeof v === "string" && v.trim() !== "")
            .join(" ");
    return { id: record.id, email: email || null, name };
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}
