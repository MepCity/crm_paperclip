import type { NavLink } from "@/components/shell/nav";
import { Icons } from "@/components/ui/icon";

/** Access settings links (ADR 0017 §9). */
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
    label: "Roles",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/roles`,
    activePrefix: (slug) => `/crm/${slug}/settings/roles`,
    match: "prefix",
    group: "Users and Control",
    requiresUserManagement: true,
  },
  {
    id: "groups",
    label: "Groups",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/groups`,
    activePrefix: (slug) => `/crm/${slug}/settings/groups`,
    match: "prefix",
    group: "Users and Control",
    requiresUserManagement: true,
  },
  {
    id: "data-sharing",
    label: "Data Sharing",
    icon: Icons.settings,
    href: (slug) => `/crm/${slug}/settings/data-sharing`,
    activePrefix: (slug) => `/crm/${slug}/settings/data-sharing`,
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
