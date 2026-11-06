import {
  type AccessSnapshot,
  CHILD_MODULES,
  can,
  isCatalogueModule,
  type ModuleAction,
  type ProfilePermissions,
} from "@crm/core/access";
import { ForbiddenError } from "@crm/core/errors";

/**
 * Permission declaration for every server entry point (ADR 0017 §7.1).
 *
 * An entry point is a route handler binding or a server action. Each declares
 * exactly one of the shapes below; `registry` tests fail for any entry point
 * without a declaration. Administrators pass every profile check.
 */
export type ModuleListKey =
  | "importModules"
  | "exportModules"
  | "massUpdate"
  | "massDelete"
  | "changeOwner"
  | "convert"
  | "findAndMerge";
export type FeatureKey = "reports" | "analytics" | "documents" | "notes" | "attachments" | "feeds";
export type AdminKey =
  | "userManagement"
  | "moduleCustomization"
  | "manageCurrencies"
  | "customizeHome"
  | "manageAutomation"
  | "manageTemplates"
  | "emailSettings"
  | "dataManagement"
  | "manageWebforms";
export type ToolKey = "manageViews" | "tags" | "recordTimeline";

/** `"$module"` means: the module named by the request (route param or `module` query). */
export const REQUEST_MODULE = "$module";

export type RoutePermission =
  | { readonly module: string; readonly action: ModuleAction }
  | { readonly moduleList: ModuleListKey; readonly module: string }
  | { readonly feature: FeatureKey; readonly action: string }
  | { readonly admin: AdminKey }
  | { readonly tool: ToolKey }
  | { readonly anyOf: readonly RoutePermission[] }
  | { readonly allOf: readonly RoutePermission[] }
  | { readonly public: string }
  | { readonly memberOnly: string };

export type PermissionRequest = {
  method?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
};
export type PermissionSpec = RoutePermission | ((request: PermissionRequest) => RoutePermission);

export function isExemptPermission(
  permission: RoutePermission,
): permission is { public: string } | { memberOnly: string } {
  return "public" in permission || "memberOnly" in permission;
}

/** Marks a handler outside `apiRoute` (auth endpoint, health probe) as intentionally exempt. */
export function exemptRoute<T>(_kind: "public" | "memberOnly", _reason: string, handler: T): T {
  return handler;
}

const deny = (): never => {
  throw new ForbiddenError(undefined, "permission_denied");
};

function requestModule(module: string, request: PermissionRequest): string {
  if (module !== REQUEST_MODULE) return module;
  const value = request.params?.module ?? request.query?.module;
  return typeof value === "string" && value !== "" ? value : "";
}

/** Case-insensitive match of a request module (`leads`) to its catalogue name (`Leads`). */
export function canonicalModule(value: string): string {
  const lower = value.toLowerCase();
  if (lower === "events") return "Meetings";
  const all = [
    ...CHILD_MODULES,
    "Leads",
    "Contacts",
    "Accounts",
    "Deals",
    "Tasks",
    "Meetings",
    "Calls",
    "Campaigns",
    "Cases",
    "Solutions",
    "Products",
    "Quotes",
    "Invoices",
  ];
  return all.find((name) => name.toLowerCase() === lower) ?? value;
}

function listAllows(snapshot: AccessSnapshot, key: ModuleListKey, module: string): boolean {
  const p = snapshot.permissions;
  const list: readonly string[] =
    key === "importModules"
      ? p.importModules
      : key === "exportModules"
        ? p.exportModules
        : key === "findAndMerge" ||
            key === "convert" ||
            key === "massUpdate" ||
            key === "massDelete" ||
            key === "changeOwner"
          ? p.tools[key]
          : [];
  return list.includes(module);
}

/** Pure evaluation of one declaration against a snapshot. */
export function permissionAllows(
  snapshot: AccessSnapshot,
  permission: RoutePermission,
  request: PermissionRequest = {},
): boolean {
  if (isExemptPermission(permission)) return true;
  const admin = snapshot.profileKind === "administrator";
  if ("anyOf" in permission)
    return permission.anyOf.some((p) => permissionAllows(snapshot, p, request));
  if ("allOf" in permission)
    return permission.allOf.every((p) => permissionAllows(snapshot, p, request));
  if (admin) return true;
  const perms: ProfilePermissions = snapshot.permissions;
  if ("admin" in permission) return perms.admin[permission.admin] === true;
  if ("tool" in permission) return perms.tools[permission.tool] === true;
  if ("feature" in permission) {
    const group = perms.features[permission.feature] as Record<string, boolean>;
    return group[permission.action] === true;
  }
  if (!("module" in permission)) return false;
  const module = canonicalModule(requestModule(permission.module, request));
  if ("moduleList" in permission) {
    return can(snapshot, module, "view") && listAllows(snapshot, permission.moduleList, module);
  }
  if (module === "Notes") {
    const f = perms.features.notes;
    return permission.action === "view" ? f.view : f[permission.action];
  }
  if (module === "Attachments") {
    const f = perms.features.attachments;
    return permission.action === "view"
      ? f.view
      : permission.action === "create"
        ? f.create
        : permission.action === "delete"
          ? f.delete
          : f.create;
  }
  if (!isCatalogueModule(module)) return false;
  return can(snapshot, module, permission.action);
}

export function resolveSpec(spec: PermissionSpec, request: PermissionRequest): RoutePermission {
  return typeof spec === "function" ? spec(request) : spec;
}

/** Throws `ForbiddenError` (403 `permission_denied`) when the profile refuses the declaration. */
export function assertRoutePermission(
  snapshot: AccessSnapshot,
  spec: PermissionSpec,
  request: PermissionRequest = {},
): void {
  if (!permissionAllows(snapshot, resolveSpec(spec, request), request)) deny();
}
