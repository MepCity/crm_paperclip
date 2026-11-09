"use client";

import { Building2, Database, MessagesSquare, Settings, ShieldCheck, Workflow } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useUiTranslations } from "@/i18n/client-provider";
import { useSettingsLabel } from "@/i18n/settings-labels";
import { useShellLabel } from "@/i18n/shell-labels";
import { usePermissions } from "@/lib/access";
import { isNavLinkActive, isNavLinkAllowed, settingsNavFor } from "./nav";

const itemClasses = "inline-flex rounded-md px-3 py-2 text-md";

export function SettingsNavigation({
  orgSlug,
  canManageAccess = true,
}: {
  orgSlug: string;
  canManageAccess?: boolean;
}) {
  const t = useUiTranslations();
  const copy = useSettingsLabel();
  const label = useShellLabel();
  const pathname = usePathname();
  const permissions = usePermissions();
  const activeLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (pathname && activeLinkRef.current) {
      activeLinkRef.current.scrollIntoView?.({ block: "center", behavior: "instant" });
    }
  }, [pathname]);

  const visibleLinks = settingsNavFor(canManageAccess).filter((link) =>
    isNavLinkAllowed(link, permissions),
  );
  return (
    <nav
      aria-label={t("shell.settingsNavigation")}
      className="flex shrink-0 flex-col gap-1 max-h-[calc(100vh-theme(spacing.utility-strip-height)-5rem)] overflow-y-auto pr-2"
    >
      <Link
        href={`/crm/${orgSlug}/settings`}
        className="mb-2 inline-flex items-center gap-2 rounded-md px-3 py-2 text-md font-semibold text-text-muted hover:bg-surface-hover hover:text-text"
      >
        <Icons.arrowLeft className="size-4 shrink-0" aria-hidden />
        <span>{t("shell.setupHome")}</span>
      </Link>
      {visibleLinks.map((link, index) => {
        const active = isNavLinkActive(link, orgSlug, pathname);
        const heading = link.group && link.group !== visibleLinks[index - 1]?.group;
        const Icon =
          (
            {
              General: Building2,
              Channels: MessagesSquare,
              "Data Administration": Database,
              Customization: Settings,
              Automation: Workflow,
              "Process Management": Workflow,
              "Users and Control": ShieldCheck,
            } as Record<string, typeof Building2>
          )[link.group ?? ""] ?? Settings;
        return [
          heading ? (
            <span
              key={`${link.group}-heading`}
              className="mt-3 flex items-center gap-2 px-3 pb-1 text-sm font-semibold text-text-muted"
            >
              <Icon className="size-5" aria-hidden="true" />
              {copy(link.group ?? "")}
            </span>
          ) : null,
          <Link
            key={link.id}
            ref={active ? activeLinkRef : undefined}
            href={link.href(orgSlug)}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? `${itemClasses} bg-primary-subtle font-semibold text-primary-hover`
                : `${itemClasses} text-text-muted data-hovered:bg-surface-hover`
            }
          >
            {label(link.id, link.label)}
          </Link>,
        ];
      })}
    </nav>
  );
}
