import type { ReactNode } from "react";
import { SettingsNavigation } from "@/components/shell/settings-navigation";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <div className="flex flex-col gap-6 p-6 md:flex-row">
      <SettingsNavigation orgSlug={orgSlug} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
