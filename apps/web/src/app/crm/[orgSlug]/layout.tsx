import { listOrganizationsForUser } from "@crm/core";
import { getAccessSnapshot, isCatalogueModule, toClientPermissions } from "@crm/core/access";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PermissionsProvider } from "@/lib/access";
import { FormatProvider } from "@/lib/format-context";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { PreferenceProvider } from "@/lib/preferences";
import { requireOrgContext, requireUser } from "@/lib/session";
import { getModuleScreens } from "@/modules/registry";
import { createInvitationAction } from "./settings/members/actions";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await requireOrgContext(orgSlug);
  const user = await requireUser(`/crm/${orgSlug}`);
  const organizations = await listOrganizationsForUser(user.id);
  const format = await loadOrganizationFormat();
  // ADR 0017 §8: one payload per navigation, built from the cached access snapshot.
  const snapshot = await getAccessSnapshot(org);
  const permissions = toClientPermissions(
    snapshot,
    getModuleScreens()
      .map((screen) => screen.apiName)
      .filter(isCatalogueModule),
  );
  // Bind the invite action to the current org slug for client-side use in the chat panel.
  const boundInviteAction = createInvitationAction.bind(null, orgSlug);
  // Admin role (and above) may invite people.
  const canInvite = org.role === "admin";
  return (
    <PermissionsProvider permissions={permissions}>
      <AppShell
        orgSlug={orgSlug}
        organizations={organizations.map((o) => ({ name: o.name, slug: o.slug }))}
        user={{ id: user.id, name: user.name, email: user.email }}
        inviteAction={boundInviteAction}
        canInvite={canInvite}
      >
        <PreferenceProvider orgSlug={orgSlug} userId={user.id}>
          <FormatProvider format={format}>{children}</FormatProvider>
        </PreferenceProvider>
      </AppShell>
    </PermissionsProvider>
  );
}
