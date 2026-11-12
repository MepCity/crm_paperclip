import type { AccessSnapshot } from "./access/types";
import type { OrgContext } from "./tenancy/types";

/** Boolean administrator keys of a profile (`admin.*`, ADR 0017 §3). */
export type AdminPermissionKey =
  | "userManagement"
  | "moduleCustomization"
  | "manageCurrencies"
  | "customizeHome"
  | "manageAutomation"
  | "manageTemplates"
  | "emailSettings"
  | "dataManagement"
  | "manageWebforms"
  | "manageJourneys"
  | "manageIntegrations"
  | "managePortals";

export type AccessLoader = (ctx: OrgContext) => Promise<AccessSnapshot>;

/**
 * Profile gate for administrator-level services (ADR 0017 §7.3). The membership role is kept
 * in sync with the Administrator profile, so `admin` passes without a lookup; any other member
 * passes only when `load` resolves a profile that grants `key`. Without a loader it fails closed.
 */
export async function adminPermitted(
  ctx: OrgContext,
  key: AdminPermissionKey,
  load?: AccessLoader,
): Promise<boolean> {
  if (ctx.role === "admin") return true;
  if (!load) return false;
  const snapshot = await load(ctx);
  return snapshot.profileKind === "administrator" || snapshot.permissions.admin[key] === true;
}
