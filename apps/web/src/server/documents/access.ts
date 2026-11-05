import type { OrgContext } from "@crm/core";
import { getAccessSnapshot } from "@crm/core/access";

/** CRM capability step of ADR 0008 §2 (Addendum A). Re-evaluated on every read. */
export interface DocumentsAccessSource {
  /** true when the actor's profile has the Documents module enabled. */
  documentsEnabled(ctx: OrgContext): boolean | Promise<boolean>;
}

/** Profile source (ADR 0017 §7.3): `features.documents.view` of the actor's profile. */
export const documentsAccessSource: DocumentsAccessSource = {
  documentsEnabled: async (ctx) => {
    const snapshot = await getAccessSnapshot(ctx);
    return snapshot.profileKind === "administrator" || snapshot.permissions.features.documents.view;
  },
};

export async function canReadDocuments(ctx: OrgContext): Promise<boolean> {
  if (ctx.role !== "admin" && ctx.role !== "member") return false;
  return (await documentsAccessSource.documentsEnabled(ctx)) === true;
}
