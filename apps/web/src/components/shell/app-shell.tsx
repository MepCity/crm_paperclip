"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
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
          Skip to content
        </Link>
        <aside
          aria-label="Navigation rail"
          id="navigation-rail"
          className={`${railVisible === null ? "hidden md:flex" : railVisible ? "flex" : "hidden"} absolute inset-y-0 bottom-(--size-utility-strip-height) left-0 z-30 w-(--size-rail-width) max-w-full shrink-0 flex-col bg-rail-surface md:static`}
        >
          <div className="relative flex h-(--size-topbar-height) shrink-0 items-start gap-2 pl-(--size-rail-header-inset) pr-(--size-rail-inset) pt-(--size-rail-header-top)">
            <div className="min-w-0 flex-1">
              <OrganizationSwitcher organizations={organizations} currentSlug={orgSlug} />
            </div>
            <Button
              ref={hideControl}
              variant="railIcon"
              size="compact"
              aria-label="Hide Menu"
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
              {railVisible !== true && (
                <Button
                  ref={showControl}
                  variant="icon"
                  size="compact"
                  aria-label="Show Menu"
                  aria-controls="navigation-rail"
                  aria-expanded={false}
                  onPress={() => toggleRail(true)}
                  className={`${railVisible === null ? "md:hidden" : ""} size-(--size-topbar-avatar) shrink-0`}
                >
                  <Icons.showMenu className="size-(--size-topbar-icon)" aria-hidden />
                </Button>
              )}
              <h1 className="truncate text-xl font-semibold text-text">{title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-(--size-topbar-control-gap)">
              <Link
                variant="icon"
                aria-label="Settings"
                href={`/o/${orgSlug}/settings`}
                className="size-(--size-topbar-control-pitch)"
              >
                <Icons.settings className="size-(--size-topbar-icon)" aria-hidden />
              </Link>
              <UserMenu user={user} />
            </div>
          </header>
          <main
            ref={mainContent}
            id="main-content"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-auto bg-surface outline-none"
          >
            {children}
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  );
}
