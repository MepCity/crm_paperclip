import { type Icon, Icons } from "@/components/ui/icon";
import { moduleListDefaultPath, moduleTabPath } from "@/lib/crm-paths";
import { LEADS_MODULE } from "@/modules/leads/list-config";

export interface NavLink {
  id: string;
  label: string;
  icon: Icon;
  href: (orgSlug: string) => string;
  match: "exact" | "prefix";
  /** When set, prefix matching uses this root instead of `href`. */
  activePrefix?: (orgSlug: string) => string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: Icon;
  links: readonly NavLink[];
}

export interface NavSection {
  id: string;
  label: string;
  groups: readonly NavGroup[];
}

export interface NavConfig {
  links: readonly NavLink[];
  sections: readonly NavSection[];
}

export const shellNav: NavConfig = {
  links: [
    { id: "home", label: "Home", icon: Icons.home, href: (slug) => `/crm/${slug}`, match: "exact" },
  ],
  sections: [
    {
      id: "teamspace",
      label: "Teamspace",
      groups: [
        {
          id: "sales",
          label: "Sales",
          icon: Icons.folder,
          links: [
            {
              id: "leads",
              label: "Leads",
              icon: Icons.building,
              href: (slug) => moduleListDefaultPath(slug, LEADS_MODULE),
              activePrefix: (slug) => moduleTabPath(slug, LEADS_MODULE),
              match: "prefix",
            },
          ],
        },
      ],
    },
  ],
};

export const settingsNav: readonly NavLink[] = [
  {
    id: "general",
    label: "General",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings`,
    match: "exact",
  },
];

export function isNavLinkActive(link: NavLink, orgSlug: string, pathname: string): boolean {
  const href = link.href(orgSlug);
  const prefixRoot = link.activePrefix?.(orgSlug) ?? href;
  return (
    pathname === href ||
    (link.match === "prefix" && (pathname === prefixRoot || pathname.startsWith(`${prefixRoot}/`)))
  );
}
