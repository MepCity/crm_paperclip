import { type Icon, Icons } from "@/components/ui/icon";

export interface NavLink {
  id: string;
  label: string;
  icon: Icon;
  href: (orgSlug: string) => string;
  match: "exact" | "prefix";
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
  sections: [],
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
  { id: "Leads", label: "Lead", path: (slug) => `/crm/${slug}/tab/Leads/create` },
];

export function isNavLinkActive(link: NavLink, orgSlug: string, pathname: string): boolean {
  const href = link.href(orgSlug);
  return pathname === href || (link.match === "prefix" && pathname.startsWith(`${href}/`));
}
