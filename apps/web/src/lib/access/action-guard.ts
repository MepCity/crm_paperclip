import type { OrgContext } from "@crm/core";
import { getAccessSnapshot } from "@crm/core/access";
import { assertRoutePermission, type RoutePermission } from "./route-permission";

/** Profile gate for a server action (ADR 0017 §7.1): throws 403 `permission_denied`. */
export async function requireActionPermission(
  ctx: OrgContext,
  permission: RoutePermission,
): Promise<void> {
  assertRoutePermission(await getAccessSnapshot(ctx), permission);
}

/** Marks a server action that needs no profile key (session-only or pre-organization flow). */
export function declareActionExempt(_kind: "public" | "memberOnly", _reason: string): void {}
