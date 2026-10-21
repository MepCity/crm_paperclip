import { type Icon, Icons } from "@/components/ui/icon";
import { moduleCreatePath, moduleListDefaultPath, moduleTabPath } from "@/lib/crm-paths";
import { getModuleScreens } from "@/modules/registry";

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
  /** Settings navigation heading shown above the first link of each group. */
  group?: string;
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
  /** Ungrouped top-level rows rendered below the groups (reference: Solutions, Cases). */
  links?: readonly NavLink[];
}

export interface NavConfig {
  links: readonly NavLink[];
  sections: readonly NavSection[];
}

/**
 * Full reference order of the ungrouped rows (cases.md KL-41–KL-51, solutions.md SL-41–SL-51).
 * A module joins by setting `navigation.group: "flat"` with one of these ids; unlisted ids follow.
 */
export const flatNavOrder: readonly string[] = [
  "price-books",
  "products",
  "quotes",
  "invoices",
  "sales-orders",
  "solutions",
  "social",
  "forecasts",
  "purchase-orders",
  "vendors",
  "salesinbox",
  "cases",
  "my-jobs",
  "services",
];

function moduleNavLinks(group: "sales" | "activities" | "flat"): NavLink[] {
  return getModuleScreens()
    .filter((definition) => (definition.navigation.group ?? "sales") === group)
    .map((definition) => ({
      id: definition.navigation.id,
      label: definition.pluralLabel,
      icon: definition.navigation.icon,
      href: (slug: string) => moduleListDefaultPath(slug, definition.tab),
      activePrefix: (slug: string) => moduleTabPath(slug, definition.tab),
      match: "prefix" as const,
    }));
}

function flatNavLinks(): NavLink[] {
  const rank = (id: string) => {
    const index = flatNavOrder.indexOf(id);
    return index === -1 ? flatNavOrder.length : index;
  };
  return moduleNavLinks("flat").sort((a, b) => rank(a.id) - rank(b.id));
}

/** Documents is not a record module (no list/detail engine); it closes the Sales group. */
const documentsLink: NavLink = {
  id: "documents",
  label: "Documents",
  icon: Icons.folder,
  href: (slug: string) => moduleTabPath(slug, "Documents"),
  activePrefix: (slug: string) => moduleTabPath(slug, "Documents"),
  match: "prefix",
};

function navGroup(group: "sales" | "activities", label: string): NavGroup {
  const links = moduleNavLinks(group);
  return {
    id: group,
    label,
    icon: Icons.folder,
    links: group === "sales" ? [...links, documentsLink] : links,
  };
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
      groups: [navGroup("sales", "Sales"), navGroup("activities", "Activities")],
      links: flatNavLinks(),
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
  {
    id: "import-history",
    label: "Import History",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/import-history`,
    match: "exact",
    group: "Data Administration",
  },
  {
    id: "export-history",
    label: "Export History",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/export-history`,
    match: "exact",
    group: "Data Administration",
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

export const createRecordsNav: readonly CreateRecordEntry[] = getModuleScreens().map(
  (definition) => ({
    id: definition.apiName,
    label: definition.singularLabel,
    path: (slug) => moduleCreatePath(slug, definition.tab),
  }),
);

export function isNavLinkActive(link: NavLink, orgSlug: string, pathname: string): boolean {
  const href = link.href(orgSlug);
  const prefixRoot = link.activePrefix?.(orgSlug) ?? href;
  return (
    pathname === href ||
    (link.match === "prefix" && (pathname === prefixRoot || pathname.startsWith(`${prefixRoot}/`)))
  );
}
