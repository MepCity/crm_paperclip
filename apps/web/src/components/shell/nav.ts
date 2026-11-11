import type { ClientPermissions } from "@crm/core/access";
import { type Icon, Icons } from "@/components/ui/icon";
import { english } from "@/i18n/catalogs";
import { moduleCreatePath, moduleListDefaultPath, moduleTabPath } from "@/lib/crm-paths";
import { shellPageTitle } from "@/lib/shell-page-title";
import { FEEDS_LABEL } from "@/modules/feeds/feeds-labels";
import { getModuleScreens } from "@/modules/registry";
import { accessSettingsNav } from "@/modules/settings-access/nav";

/** Pinned-link icon accent tokens from the design system (`tokens.css`). */
export type NavLinkIconAccentToken =
  | "--color-accent-blue"
  | "--color-accent-orange"
  | "--color-accent-purple"
  | "--color-accent-red";

const navLinkIconAccentClass: Record<NavLinkIconAccentToken, string> = {
  "--color-accent-blue": "text-accent-blue",
  "--color-accent-orange": "text-accent-orange",
  "--color-accent-purple": "text-accent-purple",
  "--color-accent-red": "text-danger",
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
  /** Extra page roots (with their sub-paths) that also mark the link active, e.g. tab pages. */
  alsoActive?: (orgSlug: string) => readonly string[];
  /** Pinned-link icon accent; label colour rules are unchanged. */
  iconAccentToken?: NavLinkIconAccentToken;
  /** Settings navigation heading shown above the first link of each group. */
  group?: string;
  /** Module API name; the link is hidden when the profile cannot view the module. */
  module?: string;
  /** Feature area with a `view` flag; hidden when the profile cannot view it. */
  feature?: "reports" | "analytics" | "documents" | "cadences" | "journeys";
  /** Settings link shown only to viewers with `admin.userManagement`. */
  requiresUserManagement?: boolean;
}

/** Settings links hidden without this administrator permission (ADR 0017 §8). */
const settingsAdminKey: Readonly<Record<string, keyof ClientPermissions["admin"]>> = {
  members: "userManagement",
  currencies: "manageCurrencies",
  "modules-and-fields": "moduleCustomization",
  "workflow-rules": "manageAutomation",
  "assignment-rules": "manageAutomation",
  email: "emailSettings",
  webforms: "manageWebforms",
};

/** Hidden, not disabled: a link without permission is not rendered. No payload = everything shown. */
export function isNavLinkAllowed(link: NavLink, permissions: ClientPermissions | null): boolean {
  if (!permissions) return true;
  if (link.module && permissions.modules[link.module]?.view === false) return false;
  const adminKey = settingsAdminKey[link.id];
  if (adminKey && link.group && !permissions.admin[adminKey]) return false;
  if (
    link.feature &&
    !permissions.features[link.feature]?.view &&
    (link.feature !== "journeys" || !permissions.admin.manageJourneys)
  ) {
    return false;
  }
  return true;
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
  "feeds",
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
      module: definition.apiName,
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
  const entries: NavLink[] = [
    ...moduleNavLinks("flat"),
    {
      id: "social",
      label: "Social",
      icon: Icons.messageSquare,
      href: (slug) => moduleTabPath(slug, "Social"),
      activePrefix: (slug) => moduleTabPath(slug, "Social"),
      match: "prefix",
    },
    {
      id: "my-jobs",
      label: shellPageTitle.myJobs,
      icon: Icons.briefcase,
      href: (slug) => moduleTabPath(slug, "Approvals"),
      activePrefix: (slug) => moduleTabPath(slug, "Approvals"),
      match: "prefix",
    },
    {
      id: "feeds",
      label: FEEDS_LABEL,
      icon: Icons.newspaper,
      href: (slug) => moduleTabPath(slug, "Feeds"),
      activePrefix: (slug) => moduleTabPath(slug, "Feeds"),
      match: "prefix",
    },
  ];
  return entries.sort((a, b) => rank(a.id) - rank(b.id));
}

/** Documents is not a record module (no list/detail engine); it sits after Deals in the Sales group. */
const documentsLink: NavLink = {
  id: "documents",
  feature: "documents",
  label: "Documents",
  icon: Icons.folder,
  href: (slug: string) => moduleTabPath(slug, "Documents"),
  activePrefix: (slug: string) => moduleTabPath(slug, "Documents"),
  match: "prefix",
};

function withDocumentsAfterDeals(links: NavLink[]): NavLink[] {
  const dealsIndex = links.findIndex((link) => link.id === "deals");
  if (dealsIndex === -1) return [...links, documentsLink];
  return [...links.slice(0, dealsIndex + 1), documentsLink, ...links.slice(dealsIndex + 1)];
}

function navGroup(group: "sales" | "activities", label: string): NavGroup {
  const links = moduleNavLinks(group);
  return {
    id: group,
    label,
    icon: Icons.folder,
    links: group === "sales" ? withDocumentsAfterDeals(links) : links,
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
    {
      id: "workqueue",
      label: "Workqueue",
      icon: Icons.task,
      href: (slug) => `/crm/${slug}/workqueue`,
      match: "exact",
      iconAccentToken: "--color-accent-orange",
    },
    {
      id: "reports",
      feature: "reports",
      label: "Reports",
      icon: Icons.file,
      href: (slug) => moduleTabPath(slug, "Reports"),
      match: "prefix",
      iconAccentToken: "--color-accent-red",
    },
    {
      id: "analytics",
      feature: "analytics",
      label: "Analytics",
      icon: Icons.barChart,
      href: (slug) => moduleTabPath(slug, "Dashboards"),
      match: "prefix",
      iconAccentToken: "--color-accent-purple",
    },
  ],
  sections: [
    {
      id: "teamspace",
      label: "Teamspace",
      groups: [
        navGroup("sales", "Sales"),
        navGroup("activities", "Activities"),
        {
          id: "integrations",
          label: "Integrations",
          icon: Icons.folder,
          links: [
            {
              id: "visits",
              label: "Visits",
              icon: Icons.activity,
              href: (slug) => moduleTabPath(slug, "Visits"),
              activePrefix: (slug) => moduleTabPath(slug, "Visits"),
              match: "prefix",
            },
          ],
        },
      ],
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
    group: "General",
  },
  {
    id: "users",
    label: english.shell.users,
    icon: Icons.users,
    href: (slug) => `/crm/${slug}/settings/users`,
    alsoActive: (slug) => [`/crm/${slug}/settings/groups`, `/crm/${slug}/settings/activate-users`],
    match: "prefix",
    group: "General",
  },
  {
    id: "personal-settings",
    label: "Personal Settings",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/personal-settings`,
    match: "exact",
    group: "General",
  },
  {
    id: "company-details",
    label: "Company Details",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/company-details`,
    match: "exact",
    group: "General",
  },
  {
    id: "currencies",
    label: "Currencies",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/currencies`,
    match: "exact",
    group: "General",
  },
  {
    id: "calendar-booking",
    label: "Calendar Booking",
    icon: Icons.calendar,
    href: (slug) => `/crm/${slug}/settings/calendar-booking`,
    match: "exact",
    group: "General",
  },
  {
    id: "email",
    label: "Email",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/email-configuration`,
    activePrefix: (slug) => `/crm/${slug}/settings/email-configuration`,
    match: "prefix",
    group: "Channels",
  },
  {
    id: "webforms",
    label: english.shell.webforms,
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/webforms`,
    activePrefix: (slug) => `/crm/${slug}/settings/webforms`,
    match: "prefix",
    group: "Channels",
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
  {
    id: "modules-and-fields",
    label: "Modules and Fields",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/modules`,
    match: "exact",
    group: "Customization",
  },
  {
    id: "workflow-rules",
    label: "Workflow Rules",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/workflow-rules`,
    activePrefix: (slug) => `/crm/${slug}/settings/workflow-rules`,
    match: "prefix",
    group: "Automation",
  },
  {
    id: "assignment-rules",
    label: "Assignment Rules",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/assignment-rules`,
    match: "exact",
    group: "Automation",
  },
  {
    id: "cadences",
    label: english.shell.cadences,
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/cadences`,
    activePrefix: (slug) => `/crm/${slug}/settings/cadences`,
    match: "prefix",
    group: "Automation",
    feature: "cadences",
  },
  {
    id: "approval-processes",
    label: english.shell["approval-processes"],
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/approval-processes`,
    activePrefix: (slug) => `/crm/${slug}/settings/approval-processes`,
    match: "prefix",
    group: "Process Management",
  },
  {
    id: "review-processes",
    label: english.shell["review-processes"],
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/review-processes`,
    activePrefix: (slug) => `/crm/${slug}/settings/review-processes`,
    match: "prefix",
    group: "Process Management",
  },
  {
    id: "commandcenter",
    label: english.shell.commandcenter,
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/commandcenter/journey-builder`,
    activePrefix: (slug) => `/crm/${slug}/settings/commandcenter`,
    match: "prefix",
    group: "Process Management",
    feature: "journeys",
  },
];

export { accessSettingsNav } from "@/modules/settings-access/nav";

/** The settings navigation for a viewer: access links only with `admin.userManagement`. */
export function settingsNavFor(canManageAccess: boolean): readonly NavLink[] {
  if (!canManageAccess) return settingsNav;
  const at = settingsNav.findIndex((link) => link.group !== "General");
  return [...settingsNav.slice(0, at), ...accessSettingsNav, ...settingsNav.slice(at)];
}

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
  const under = (root: string) => pathname === root || pathname.startsWith(`${root}/`);
  return (
    pathname === href ||
    (link.match === "prefix" && under(prefixRoot)) ||
    (link.alsoActive?.(orgSlug).some(under) ?? false)
  );
}

/** A copy of the navigation without the link `id` (permission gating of rail entries). */
export function navWithoutLink(config: NavConfig, id: string): NavConfig {
  const keep = (links: readonly NavLink[]) => links.filter((link) => link.id !== id);
  return {
    links: keep(config.links),
    sections: config.sections.map((section) => ({
      ...section,
      groups: section.groups.map((group) => ({ ...group, links: keep(group.links) })),
      ...(section.links ? { links: keep(section.links) } : {}),
    })),
  };
}
