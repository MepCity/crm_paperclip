"use client";

import { usePathname } from "next/navigation";
import { Disclosure } from "@/components/ui/disclosure";
import { Link } from "@/components/ui/link";
import { isNavLinkActive, type NavConfig, type NavLink, shellNav } from "./nav";

function NavigationLink({
  link,
  orgSlug,
  pathname,
  nested = false,
}: {
  link: NavLink;
  orgSlug: string;
  pathname: string;
  nested?: boolean;
}) {
  const IconComponent = link.icon;
  const active = isNavLinkActive(link, orgSlug, pathname);
  return (
    <Link
      href={link.href(orgSlug)}
      variant={nested ? "railNested" : "rail"}
      aria-current={active ? "page" : undefined}
    >
      <span className={nested ? "ml-(--size-rail-nested-icon-offset) inline-flex" : "inline-flex"}>
        <IconComponent
          className={`size-(--size-rail-icon) shrink-0 ${nested && !active ? "text-rail-icon" : ""}`}
          aria-hidden
        />
      </span>
      <span>{link.label}</span>
    </Link>
  );
}

export function Navigation({
  orgSlug,
  config = shellNav,
}: {
  orgSlug: string;
  config?: NavConfig;
}) {
  const pathname = usePathname();
  const sections = config.sections
    .map((section) => ({
      ...section,
      groups: section.groups.filter((group) => group.links.length > 0),
    }))
    .filter((section) => section.groups.length > 0);
  return (
    <nav aria-label="Main navigation" className="flex-1 overflow-y-auto">
      <div
        className={`${sections.length ? "min-h-(--size-rail-pinned-region)" : ""} flex flex-col gap-(--size-rail-row-gap) px-(--size-rail-inset) pt-(--size-rail-nav-start)`}
      >
        {config.links.map((link) => (
          <NavigationLink key={link.id} link={link} orgSlug={orgSlug} pathname={pathname} />
        ))}
      </div>
      {sections.map((section) => (
        <section
          key={section.id}
          aria-label={section.label}
          className="border-t border-rail-border pt-(--size-rail-teamspace-top)"
        >
          <div className="ml-(--size-rail-selector-inset) flex h-(--size-rail-selector-height) items-center text-base font-semibold text-rail-text">
            {section.label}
          </div>
          <div className="mt-(--size-rail-teamspace-group-gap) px-(--size-rail-inset)">
            {section.groups.map((group) => (
              <Disclosure
                key={group.id}
                label={group.label}
                icon={group.icon}
                variant="rail"
                defaultExpanded
              >
                <div className="flex flex-col gap-(--size-rail-nested-row-gap) pt-(--size-rail-nested-row-gap)">
                  {group.links.map((link) => (
                    <NavigationLink
                      key={link.id}
                      link={link}
                      orgSlug={orgSlug}
                      pathname={pathname}
                      nested
                    />
                  ))}
                </div>
              </Disclosure>
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}
