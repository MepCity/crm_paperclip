import { getAccessSnapshot } from "@crm/core/access";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import type { AdminKey, FeatureKey } from "./route-permission";

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

/**
 * Server-side `view` gate of a feature page (Reports, Analytics; ADR 0017 §7.3): the navigation
 * hides the link, and a guessed URL renders the denied state instead of the data.
 */
export async function canViewFeature(
  ctx: Awaited<ReturnType<typeof requireOrgContext>>,
  feature: Extract<FeatureKey, "reports" | "analytics" | "cadences" | "journeys">,
): Promise<boolean> {
  const snapshot = await getAccessSnapshot(ctx);
  return snapshot.profileKind === "administrator" || snapshot.permissions.features[feature].view;
}

export async function requireFeatureView(
  orgSlug: string,
  feature: Extract<FeatureKey, "reports" | "analytics" | "cadences" | "journeys">,
) {
  const ctx = await requireOrgContext(orgSlug);
  const allowed = await canViewFeature(ctx, feature);
  if (!allowed) notFound();
  return ctx;
}
