import { listOrganizationsForUser } from "@crm/core";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
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
  const user = await requireUser(`/o/${orgSlug}`);
  const organizations = await listOrganizationsForUser(user.id);
  return (
    <AppShell
      orgSlug={orgSlug}
      organizations={organizations.map((org) => ({ name: org.name, slug: org.slug }))}
      user={{ name: user.name, email: user.email }}
    >
      {children}
    </AppShell>
  );
}
