"use client";

import { usePathname } from "next/navigation";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { isNavLinkActive, settingsNav } from "./nav";

const itemClasses = "inline-flex rounded-md px-3 py-2 text-md";

export function SettingsNavigation({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings navigation" className="flex shrink-0 flex-col gap-1">
      <Link
        href={`/crm/${orgSlug}/settings`}
        className="mb-2 inline-flex items-center gap-2 rounded-md px-3 py-2 text-md font-semibold text-text-muted hover:bg-surface-hover hover:text-text"
      >
        <Icons.arrowLeft className="size-4 shrink-0" aria-hidden />
        <span>Setup Home</span>
      </Link>
      {settingsNav.map((link, index) => {
        const active = isNavLinkActive(link, orgSlug, pathname);
        const heading = link.group && link.group !== settingsNav[index - 1]?.group;
        return [
          heading ? (
            <span
              key={`${link.group}-heading`}
              className="mt-3 px-3 pb-1 text-sm font-semibold text-text-muted"
            >
              {link.group}
            </span>
          ) : null,
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
          </Link>,
        ];
      })}
    </nav>
  );
}
