import { listOrganizationsForUser } from "@crm/core";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { FormatProvider } from "@/lib/format-context";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { PreferenceProvider } from "@/lib/preferences";
import { requireOrgContext, requireUser } from "@/lib/session";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  const user = await requireUser(`/crm/${orgSlug}`);
  const organizations = await listOrganizationsForUser(user.id);
  const format = await loadOrganizationFormat();
  return (
    <AppShell
      orgSlug={orgSlug}
      organizations={organizations.map((org) => ({ name: org.name, slug: org.slug }))}
      user={{ id: user.id, name: user.name, email: user.email }}
    >
      <PreferenceProvider orgSlug={orgSlug} userId={user.id}>
        <FormatProvider format={format}>{children}</FormatProvider>
      </PreferenceProvider>
    </AppShell>
  );
}
