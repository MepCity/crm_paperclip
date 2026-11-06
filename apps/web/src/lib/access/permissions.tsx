"use client";

import type { ClientPermissions } from "@crm/core/access";
import { createContext, type ReactNode, useContext } from "react";

export type { ClientPermissions };

const PermissionsContext = createContext<ClientPermissions | null>(null);

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: ClientPermissions | null;
  children: ReactNode;
}) {
  return <PermissionsContext.Provider value={permissions}>{children}</PermissionsContext.Provider>;
}

/** Raw payload; `null` outside a provider (isolated component tests, demos): nothing is gated. */
export function usePermissions(): ClientPermissions | null {
  return useContext(PermissionsContext);
}

type ModuleFlag = keyof ClientPermissions["modules"][string];

/** Module-level flag. Outside a provider, or for a module the payload does not list, allowed. */
export function useModulePermission(module: string | undefined, flag: ModuleFlag): boolean {
  const permissions = usePermissions();
  if (!permissions || !module) return true;
  const entry = permissions.modules[module];
  return entry ? entry[flag] : true;
}

/** Record-level access returned by the server as `$access`. Absent = no extra restriction. */
export type RecordAccess = "read" | "read_write" | "read_write_delete";

export function recordAllows(access: RecordAccess | undefined, need: "edit" | "delete"): boolean {
  if (!access) return true;
  if (need === "edit") return access !== "read";
  return access === "read_write_delete";
}

/** profile ∧ `$access` for edit and delete style controls. */
export function useRecordPermission(
  module: string | undefined,
  flag: "edit" | "delete",
  access: RecordAccess | undefined,
): boolean {
  return useModulePermission(module, flag) && recordAllows(access, flag);
}

export function useAdminPermission(key: keyof ClientPermissions["admin"]): boolean {
  const permissions = usePermissions();
  return permissions ? permissions.admin[key] : true;
}

export function useToolPermission(key: keyof ClientPermissions["tools"]): boolean {
  const permissions = usePermissions();
  return permissions ? permissions.tools[key] : true;
}
