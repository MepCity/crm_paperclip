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
    { id: "home", label: "Home", icon: Icons.home, href: (slug) => `/o/${slug}`, match: "exact" },
  ],
  sections: [],
};

export const settingsNav: readonly NavLink[] = [
  {
    id: "general",
    label: "General",
    icon: Icons.settings,
    href: (slug) => `/o/${slug}/settings`,
    match: "exact",
  },
];

export function isNavLinkActive(link: NavLink, orgSlug: string, pathname: string): boolean {
  const href = link.href(orgSlug);
  return pathname === href || (link.match === "prefix" && pathname.startsWith(`${href}/`));
}
