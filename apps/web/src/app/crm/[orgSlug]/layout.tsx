import { listOrganizationsForUser } from "@crm/core";
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
  // Admin role (and above) may invite people.
  const canInvite = org.role === "admin";
  return (
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
  );
}
