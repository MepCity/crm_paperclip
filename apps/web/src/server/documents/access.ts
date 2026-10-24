import type { OrgContext } from "@crm/core";

/** CRM capability step of ADR 0008 §2 (Addendum A). Re-evaluated on every read. */
export interface DocumentsAccessSource {
  /** true when the actor's profile has the Documents module enabled. */
  documentsEnabled(ctx: OrgContext): boolean | Promise<boolean>;
}

/** Interim source: no profile store yet, every organization member is enabled. */
export const documentsAccessSource: DocumentsAccessSource = {
  documentsEnabled: () => true,
};

export async function canReadDocuments(ctx: OrgContext): Promise<boolean> {
  if (ctx.role === "admin") return true;
  if (ctx.role !== "member") return false;
  return (await documentsAccessSource.documentsEnabled(ctx)) === true;
}
