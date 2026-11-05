import type { ReactNode } from "react";
import { canManageAccess } from "@/server/access/page-gate";
import { SettingsLayoutClient } from "./layout-client";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <SettingsLayoutClient orgSlug={orgSlug} canManageAccess={await canManageAccess(orgSlug)}>
      {children}
    </SettingsLayoutClient>
  );
}
