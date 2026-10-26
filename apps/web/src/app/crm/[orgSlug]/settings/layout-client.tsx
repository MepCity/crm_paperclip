"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SettingsNavigation } from "@/components/shell/settings-navigation";

export function SettingsLayoutClient({
  orgSlug,
  children,
}: {
  orgSlug: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isSetupHome =
    pathname === `/crm/${orgSlug}/settings` || pathname === `/crm/${orgSlug}/settings/`;
  const isModuleDetail = /^\/crm\/[^/]+\/settings\/modules\/[^/]+/.test(pathname);

  if (isSetupHome) {
    return <div className="min-h-full bg-bg px-6 py-6 md:px-10 lg:px-14">{children}</div>;
  }

  if (isModuleDetail) {
    return <div className="min-h-full p-6">{children}</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:flex-row">
      <SettingsNavigation orgSlug={orgSlug} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
