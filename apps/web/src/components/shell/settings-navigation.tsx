"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/components/ui/link";
import { isNavLinkActive, settingsNav } from "./nav";

export function SettingsNavigation({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings navigation" className="flex shrink-0 flex-col gap-1">
      {settingsNav.map((link) => (
        <Link
          key={link.id}
          href={link.href(orgSlug)}
          aria-current={isNavLinkActive(link, orgSlug, pathname) ? "page" : undefined}
          className="inline-flex rounded-md bg-surface-hover px-3 py-2 text-md font-semibold text-text"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
