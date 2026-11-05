import { getAccessSnapshot } from "@crm/core/access";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import type { AdminKey } from "./route-permission";

/**
 * Server-side gate of a settings section (ADR 0017 §7.3): the same `admin.*` key that hides the
 * navigation entry also denies the page. Returns the organization context like
 * `requireOrgContext`.
 */
export async function requireSettingsOrg(orgSlug: string, key: AdminKey) {
  const ctx = await requireOrgContext(orgSlug);
  const snapshot = await getAccessSnapshot(ctx);
  if (snapshot.profileKind !== "administrator" && !snapshot.permissions.admin[key]) notFound();
  return ctx;
}
