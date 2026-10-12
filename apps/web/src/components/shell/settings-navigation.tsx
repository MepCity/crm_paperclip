"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/components/ui/link";
import { isNavLinkActive, settingsNav } from "./nav";

const itemClasses = "inline-flex rounded-md px-3 py-2 text-md";

export function SettingsNavigation({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings navigation" className="flex shrink-0 flex-col gap-1">
      {settingsNav.map((link) => {
        const active = isNavLinkActive(link, orgSlug, pathname);
        return (
          <Link
            key={link.id}
            href={link.href(orgSlug)}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? `${itemClasses} bg-surface-hover font-semibold text-text`
                : `${itemClasses} text-text-muted data-hovered:bg-surface-hover`
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
