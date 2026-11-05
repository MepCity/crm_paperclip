import {
  REQUEST_MODULE as M,
  type PermissionSpec,
  type RoutePermission,
} from "@/lib/access/route-permission";

/**
 * Permission declarations of every wire operation (ADR 0017 §7.1), keyed by
 * `"<METHOD> <path template>"`. `operationRoute` and `transferRoute` look their
 * operation up here and refuse to bind an undeclared one.
 */
const record = (action: "view" | "create" | "edit" | "delete"): RoutePermission => ({
  module: M,
  action,
});
const tool = (
  moduleList: "massUpdate" | "massDelete" | "changeOwner" | "convert" | "findAndMerge",
  action: "view" | "create" | "edit" | "delete",
): RoutePermission => ({ allOf: [{ moduleList, module: M }, record(action)] });
const transfer = (
  moduleList: "importModules" | "exportModules",
  action?: "create",
): RoutePermission =>
  action ? { allOf: [{ moduleList, module: M }, record(action)] } : { moduleList, module: M };
const customize: RoutePermission = { admin: "moduleCustomization" };
const manageViews: RoutePermission = { tool: "manageViews" };

export const OPERATION_PERMISSIONS: Record<string, PermissionSpec> = {
  "POST /crm/v2.2/actions/search": {
    memberOnly: "Cross-module search; the record access policy filters candidates per module.",
  },
  "POST /crm/v2.2/{module}/actions/duplicate_groups": record("view"),
  "POST /crm/v2.2/{module}/actions/merge": tool("findAndMerge", "edit"),
  "POST /crm/v2.2/{module}/{recordId}/actions/convert": {
    allOf: [
      { moduleList: "convert", module: M },
      { module: "Leads", action: "edit" },
    ],
  },
  "POST /crm/v2.2/{module}/actions/deduplicate": tool("findAndMerge", "edit"),
  "GET /crm/v2.2/org/currencies": { memberOnly: "Currency list is read by every record form." },
  "GET /crm/v2.2/settings/modules/{module}": {
    memberOnly: "Module metadata drives every screen; hidden fields are dropped by the policy.",
  },
  "PATCH /crm/v2.2/settings/modules/{module}": customize,
  "GET /crm/v2.2/settings/fields": {
    memberOnly: "Field metadata drives every screen; hidden fields are dropped by the policy.",
  },
  "POST /crm/v2.2/settings/fields": customize,
  "PATCH /crm/v2.2/settings/fields": customize,
  "DELETE /crm/v2.2/settings/fields": customize,
  "GET /crm/v2.1/settings/layouts": { memberOnly: "Layouts drive every record form." },
  "PATCH /crm/v2.1/settings/layouts": customize,
  "GET /crm/v9/settings/custom_views": {
    memberOnly: "Views are listed per module in every list screen.",
  },
  "POST /crm/v9/settings/custom_views": manageViews,
  "GET /crm/v9/settings/custom_views/{viewId}": { memberOnly: "View definition read." },
  "PATCH /crm/v9/settings/custom_views/{viewId}": manageViews,
  "DELETE /crm/v9/settings/custom_views/{viewId}": manageViews,
  "GET /crm/v9/settings/kanban_views": { memberOnly: "Kanban view list read." },
  "GET /crm/v9/settings/kanban_views/{viewId}": { memberOnly: "Kanban view definition read." },
  "POST /crm/v9/settings/kanban_views": manageViews,
  "PUT /crm/v9/settings/kanban_views/{viewId}": manageViews,
  "POST /crm/v2.2/{module}/bulk": record("view"),
  "POST /crm/v2.2/{module}/actions/grouped_counts": record("view"),
  "POST /crm/v2.2/{module}/actions/count": record("view"),
  "GET /crm/v2.2/{module}/{recordId}": record("view"),
  "GET /crm/v9/users": {
    memberOnly: "User picker; onlyListSubordinates is applied in the user list.",
  },
  "POST /crm/v2.2/{module}": record("create"),
  "PUT /crm/v2.2/{module}/{recordId}": record("edit"),
  "DELETE /crm/v2.2/{module}/{recordId}": record("delete"),
  "POST /crm/v2.2/{module}/actions/mass_delete": tool("massDelete", "delete"),
  "POST /crm/v2.2/{module}/actions/mass_update": tool("massUpdate", "edit"),
  "POST /crm/v2.2/{module}/actions/change_owner": tool("changeOwner", "edit"),
  // Transfer operations.
  "POST /crm/v2.2/{module}/actions/import_preview": transfer("importModules", "create"),
  "POST /crm/v2.2/{module}/actions/import": transfer("importModules", "create"),
  "GET /crm/v2.2/{module}/actions/import_sample": transfer("importModules"),
  "POST /crm/v2.2/{module}/actions/export": transfer("exportModules"),
  "GET /crm/v9/settings/imports": {
    memberOnly: "Import history; the service scopes it to the actor.",
  },
  "GET /crm/v9/settings/imports/{importId}": {
    memberOnly: "Import detail; the service scopes it to the actor.",
  },
  "POST /crm/v9/settings/imports/{importId}/actions/undo": {
    memberOnly: "Undo of the actor's own import; the service checks ownership.",
  },
  "GET /crm/v9/settings/exports": {
    memberOnly: "Export history; the service scopes it to the actor.",
  },
  "GET /crm/v9/settings/exports/{exportId}/download": {
    memberOnly: "Download of the actor's own export; the service checks ownership.",
  },
};

export function operationPermission(method: string, path: string): PermissionSpec {
  const spec = OPERATION_PERMISSIONS[`${method} ${path}`];
  if (!spec) throw new Error(`Operation ${method} ${path} has no declared permission.`);
  return spec;
}

/** Tag and recycle-bin routes. */
export const TAGS_BIN_PERMISSIONS: Record<string, PermissionSpec> = {
  tags: record("view"),
  create: customize,
  update: customize,
  delete: customize,
  add: { allOf: [{ tool: "tags" }, record("edit")] },
  remove: { allOf: [{ tool: "tags" }, record("edit")] },
  bin: {
    memberOnly: "Lists the entries the actor deleted; the service widens it with dataManagement.",
  },
  restore: { memberOnly: "The service checks delete on the original module and the deleter." },
  purge: { admin: "dataManagement" },
  empty: { admin: "dataManagement" },
};
