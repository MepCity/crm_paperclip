"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useUiTranslations } from "@/i18n/client-provider";
import { PreferenceProvider } from "@/lib/preferences";
import { CreateRecordsMenu } from "./create-records";
import { GlobalSearch } from "./global-search";
import { Navigation } from "./navigation";
import { OrganizationSwitcher, type ShellOrganization } from "./organization-switcher";
import { PageTitleContext } from "./page-title";
import { type ShellUser, UserMenu } from "./user-menu";

export function AppShell({
  orgSlug,
  organizations,
  user,
  children,
}: {
  orgSlug: string;
  organizations: readonly ShellOrganization[];
  user: ShellUser;
  children: ReactNode;
}) {
  const t = useUiTranslations();
  const pathname = usePathname();
  const isSettings =
    pathname === `/crm/${orgSlug}/settings` || pathname.startsWith(`/crm/${orgSlug}/settings/`);
  const isSettingsHome =
    pathname === `/crm/${orgSlug}/settings` || pathname === `/crm/${orgSlug}/settings/`;
  const [title, setTitle] = useState("Loading");
  const [railVisible, setRailVisible] = useState<boolean | null>(null);
  const mainContent = useRef<HTMLElement>(null);
  const showControl = useRef<HTMLButtonElement>(null);
  const hideControl = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 48rem)");
    const update = () => setRailVisible(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  function toggleRail(visible: boolean) {
    setRailVisible(visible);
    requestAnimationFrame(() => (visible ? hideControl : showControl).current?.focus());
  }
  return (
    <PageTitleContext.Provider value={setTitle}>
      <div className="flex h-dvh bg-surface pb-(--size-utility-strip-height)">
        <Link
          href="#main-content"
          onClick={(event) => {
            event.preventDefault();
            mainContent.current?.focus();
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:p-3 focus:text-text"
        >
          {t("shell.skip")}
        </Link>
        <aside
          aria-label={t("shell.rail")}
          id="navigation-rail"
          className={`${isSettings ? "hidden" : railVisible === null ? "hidden md:flex" : railVisible ? "flex" : "hidden"} absolute inset-y-0 bottom-(--size-utility-strip-height) left-0 z-30 w-(--size-rail-width) max-w-full shrink-0 flex-col bg-rail-surface md:static`}
        >
          <div className="relative flex h-(--size-topbar-height) shrink-0 items-start gap-2 pl-(--size-rail-header-inset) pr-(--size-rail-inset) pt-(--size-rail-header-top)">
            <div className="min-w-0 flex-1">
              <OrganizationSwitcher organizations={organizations} currentSlug={orgSlug} />
            </div>
            <Button
              ref={hideControl}
              variant="railIcon"
              size="compact"
              aria-label={t("shell.hideMenu")}
              aria-controls="navigation-rail"
              aria-expanded={true}
              onPress={() => toggleRail(false)}
              className="size-(--size-rail-product-selector-height) shrink-0"
            >
              <Icons.hideMenu className="size-(--size-topbar-icon)" aria-hidden />
            </Button>
          </div>
          <Navigation orgSlug={orgSlug} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative flex h-(--size-topbar-height) shrink-0 items-center justify-between gap-2 border-b border-topbar-border bg-topbar-surface px-(--size-topbar-title-inset)">
            <div className="flex min-w-0 items-center gap-2">
              {isSettings ? (
                <Link
                  variant="icon"
                  aria-label={isSettingsHome ? t("shell.backCrm") : t("shell.backSetup")}
                  href={isSettingsHome ? `/crm/${orgSlug}` : `/crm/${orgSlug}/settings`}
                  className="size-(--size-topbar-control-pitch) flex shrink-0 items-center justify-center rounded-full hover:bg-surface-hover"
                >
                  <Icons.arrowLeft className="size-(--size-topbar-icon)" aria-hidden />
                </Link>
              ) : (
                railVisible !== true && (
                  <Button
                    ref={showControl}
                    variant="icon"
                    size="compact"
                    aria-label={t("shell.showMenu")}
                    aria-controls="navigation-rail"
                    aria-expanded={false}
                    onPress={() => toggleRail(true)}
                    className={`${railVisible === null ? "md:hidden" : ""} size-(--size-topbar-avatar) shrink-0`}
                  >
                    <Icons.showMenu className="size-(--size-topbar-icon)" aria-hidden />
                  </Button>
                )
              )}
              <h1 className="truncate text-xl font-semibold text-text">{title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-(--size-topbar-control-gap)">
              <GlobalSearch key={`${orgSlug}:${user.id}`} orgSlug={orgSlug} userId={user.id} />
              <CreateRecordsMenu orgSlug={orgSlug} />
              <Button
                variant="icon"
                size="compact"
                aria-label={t("shell.assistant")}
                laterModule="P3"
                className="size-(--size-topbar-control-pitch)"
              >
                <Icons.sparkles className="size-(--size-topbar-icon)" aria-hidden />
              </Button>
              <Button
                variant="icon"
                size="compact"
                aria-label={t("shell.notifications")}
                laterModule="P3"
                className="size-(--size-topbar-control-pitch)"
              >
                <Icons.bell className="size-(--size-topbar-icon)" aria-hidden />
              </Button>
              <Link
                variant="icon"
                aria-label={t("shell.calendar")}
                href={`/crm/${orgSlug}/calendar`}
                className="size-(--size-topbar-control-pitch)"
              >
                <Icons.calendar className="size-(--size-topbar-icon)" aria-hidden />
              </Link>
              <Button
                variant="icon"
                size="compact"
                aria-label={t("shell.extensions")}
                laterModule="P3"
                className="size-(--size-topbar-control-pitch)"
              >
                <Icons.store className="size-(--size-topbar-icon)" aria-hidden />
              </Button>
              <Link
                variant="icon"
                aria-label={t("shell.settings")}
                href={`/crm/${orgSlug}/settings`}
                className={`size-(--size-topbar-control-pitch) ${isSettings ? "rounded-md bg-surface-hover font-semibold text-text" : ""}`}
              >
                <Icons.settings className="size-(--size-topbar-icon)" aria-hidden />
              </Link>
              <UserMenu user={user} />
              <Button
                variant="icon"
                size="compact"
                aria-label={t("shell.applications")}
                laterModule="P3"
                className="size-(--size-topbar-control-pitch)"
              >
                <Icons.applications className="size-(--size-topbar-icon)" aria-hidden />
              </Button>
            </div>
          </header>
          <main
            ref={mainContent}
            id="main-content"
            tabIndex={-1}
            className={`min-h-0 flex-1 overflow-auto outline-none ${isSettingsHome ? "bg-bg" : "bg-surface"}`}
          >
            <PreferenceProvider orgSlug={orgSlug} userId={user.id}>
              {children}
            </PreferenceProvider>
          </main>
        </div>
        <footer
          role="contentinfo"
          aria-label={t("shell.utilities")}
          className="fixed inset-x-0 bottom-0 z-40 flex h-(--size-utility-strip-height) items-center justify-between border-t border-border bg-surface px-3 text-text-muted shadow-sm"
          data-shell-utilities
        >
          <div className="flex h-full items-center gap-6">
            <Button variant="ghost" size="compact" laterModule="P3">
              <Icons.pin aria-hidden className="size-4" />
              {t("shell.pins")}
            </Button>
            <Button variant="ghost" size="compact" laterModule="P3">
              <Icons.messageSquare aria-hidden className="size-4" />
              {t("shell.chats")}
            </Button>
            <Button variant="ghost" size="compact" laterModule="P3">
              <Icons.users aria-hidden className="size-4" />
              {t("shell.people")}
            </Button>
          </div>
          <div className="flex h-full items-center gap-3">
            <Button
              variant="icon"
              size="compact"
              laterModule="P3"
              aria-label={t("shell.announcements")}
            >
              <Icons.megaphone aria-hidden className="size-4" />
            </Button>
            <Button
              variant="icon"
              size="compact"
              laterModule="P3"
              aria-label={t("shell.reminders")}
            >
              <Icons.clock aria-hidden className="size-4" />
            </Button>
            <Button
              variant="icon"
              size="compact"
              laterModule="P3"
              aria-label={t("shell.recentItems")}
            >
              <Icons.history aria-hidden className="size-4" />
            </Button>
            <Button
              variant="icon"
              size="compact"
              laterModule="P3"
              aria-label={t("shell.accessibility")}
            >
              <Icons.accessibility aria-hidden className="size-4" />
            </Button>
            <Button variant="primary" size="compact" laterModule="P3">
              <Icons.help aria-hidden className="size-4" />
              {t("shell.help")}
            </Button>
          </div>
        </footer>
      </div>
    </PageTitleContext.Provider>
  );
}
