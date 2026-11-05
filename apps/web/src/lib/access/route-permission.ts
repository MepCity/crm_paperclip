/**
 * Permission declaration for every server entry point (ADR 0017 §7.1).
 *
 * An entry point is a route handler binding or a server action. Each declares
 * exactly one of:
 * - `{ module, action }`: the profile gate `can(snapshot, module, action)` runs
 *   before the handler;
 * - `{ public: reason }`: reachable without a session or organization;
 * - `{ memberOnly: reason }`: any organization member, no profile key needed.
 *
 * The registry test (`route-permission.registry.test.ts`) fails for any entry
 * point without a declaration.
 */
export type ModuleAction = "view" | "create" | "edit" | "delete";

export type RoutePermission =
  | { readonly module: string; readonly action: ModuleAction }
  | { readonly feature: string; readonly action: string }
  | { readonly admin: string }
  | { readonly public: string }
  | { readonly memberOnly: string };

/** The engine's profile gate; supplied by the access snapshot on `OrgContext`. */
export type ProfileGate = (permission: RoutePermission) => boolean;

export function isExemptPermission(
  permission: RoutePermission,
): permission is { public: string } | { memberOnly: string } {
  return "public" in permission || "memberOnly" in permission;
}

/**
 * Throws `ForbiddenError` (403 `permission_denied`) when the gate refuses.
 * Exempt declarations always pass; a missing gate means the engine is not
 * wired yet and only exempt declarations pass.
 */
export function enforceRoutePermission(
  permission: RoutePermission,
  gate: ProfileGate | undefined,
  deny: () => never,
): void {
  if (isExemptPermission(permission)) return;
  if (!gate || !gate(permission)) deny();
}
