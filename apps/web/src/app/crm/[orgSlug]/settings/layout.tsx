import type { ReactNode } from "react";
import { SettingsLayoutClient } from "./layout-client";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return <SettingsLayoutClient orgSlug={orgSlug}>{children}</SettingsLayoutClient>;
}
