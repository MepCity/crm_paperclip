import { type Icon, Icons } from "@/components/ui/icon";
import { moduleCreatePath, moduleListDefaultPath, moduleTabPath } from "@/lib/crm-paths";
import { LEADS_MODULE } from "@/modules/leads/list-config";

/** Pinned-link icon accent tokens from the design system (`tokens.css`). */
export type NavLinkIconAccentToken = "--color-accent-blue";

const navLinkIconAccentClass: Record<NavLinkIconAccentToken, string> = {
  "--color-accent-blue": "text-accent-blue",
};

export function navLinkIconClassName(
  link: NavLink,
  options: { nested: boolean; active: boolean },
): string {
  const base = "size-(--size-rail-icon) shrink-0";
  if (link.iconAccentToken) {
    return `${base} ${navLinkIconAccentClass[link.iconAccentToken]}`;
  }
  if (options.nested && !options.active) {
    return `${base} text-rail-icon`;
  }
  return base;
}

export interface NavLink {
  id: string;
  label: string;
  icon: Icon;
  href: (orgSlug: string) => string;
  match: "exact" | "prefix";
  /** When set, prefix matching uses this root instead of `href`. */
  activePrefix?: (orgSlug: string) => string;
  /** Pinned-link icon accent; label colour rules are unchanged. */
  iconAccentToken?: NavLinkIconAccentToken;
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
    {
      id: "home",
      label: "Home",
      icon: Icons.home,
      href: (slug) => `/crm/${slug}`,
      match: "exact",
      iconAccentToken: "--color-accent-blue",
    },
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
  {
    id: "members",
    label: "Members",
    icon: Icons.users,
    href: (slug) => `/crm/${slug}/settings/members`,
    match: "exact",
  },
];

/**
 * One row of the top-bar `Create Records` menu. Rows carry no icon: the spec measures the same
 * plus glyph on every module row (record-detail.md › Global create menu › Module list). A module
 * joins the menu by adding a row here; its page path stays with the module's own routes.
 */
export interface CreateRecordEntry {
  id: string;
  label: string;
  path: (orgSlug: string) => string;
}

export const createRecordsNav: readonly CreateRecordEntry[] = [
  { id: "Leads", label: "Lead", path: (slug) => moduleCreatePath(slug, LEADS_MODULE) },
];

export function isNavLinkActive(link: NavLink, orgSlug: string, pathname: string): boolean {
  const href = link.href(orgSlug);
  const prefixRoot = link.activePrefix?.(orgSlug) ?? href;
  return (
    pathname === href ||
    (link.match === "prefix" && (pathname === prefixRoot || pathname.startsWith(`${prefixRoot}/`)))
  );
}
