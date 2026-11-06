import type { NavLink } from "@/components/shell/nav";
import { Icons } from "@/components/ui/icon";

/**
 * Access settings links (ADR 0017 §9). As in the reference, Groups is a tab of the Users page and
 * Data Sharing Settings a tab of "Roles and Sharing", so neither has its own menu entry.
 */
export const accessSettingsNav: readonly NavLink[] = [
  {
    id: "profiles",
    label: "Profiles",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/profiles`,
    activePrefix: (slug) => `/crm/${slug}/settings/profiles`,
    match: "prefix",
    group: "Users and Control",
    requiresUserManagement: true,
  },
  {
    id: "roles",
    label: "Roles and Sharing",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/roles`,
    activePrefix: (slug) => `/crm/${slug}/settings/roles`,
    alsoActive: (slug) => [`/crm/${slug}/settings/data-sharing`],
    match: "prefix",
    group: "Users and Control",
    requiresUserManagement: true,
  },
  {
    id: "field-permissions",
    label: "Field Permissions",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/field-permissions`,
    activePrefix: (slug) => `/crm/${slug}/settings/field-permissions`,
    match: "prefix",
    group: "Users and Control",
    requiresUserManagement: true,
  },
];
