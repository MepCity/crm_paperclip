import { listOrganizationsForUser } from "@crm/core";
import { getAccessSnapshot } from "@crm/core/access";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { FormatProvider } from "@/lib/format-context";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { PreferenceProvider } from "@/lib/preferences";
import { requireOrgContext, requireUser } from "@/lib/session";
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
  // Bind the invite action to the current org slug for client-side use in the chat panel.
  const boundInviteAction = createInvitationAction.bind(null, orgSlug);
  // `admin.userManagement` (ADR 0017 §7.3) may invite people.
  const access = await getAccessSnapshot(org);
  const canInvite =
    access.profileKind === "administrator" || access.permissions.admin.userManagement;
  const feedsFeature = access.permissions.features.feeds;
  const admin = access.profileKind === "administrator";
  return (
    <AppShell
      orgSlug={orgSlug}
      organizations={organizations.map((o) => ({ name: o.name, slug: o.slug }))}
      user={{ id: user.id, name: user.name, email: user.email }}
      inviteAction={boundInviteAction}
      canInvite={canInvite}
      feedsAccess={{ view: admin || feedsFeature.view, post: admin || feedsFeature.post }}
    >
      <PreferenceProvider orgSlug={orgSlug} userId={user.id}>
        <FormatProvider format={format}>{children}</FormatProvider>
      </PreferenceProvider>
    </AppShell>
  );
}
