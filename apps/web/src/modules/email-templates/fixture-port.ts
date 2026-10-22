import type { EmailTemplateFolder, EmailTemplateItem, EmailTemplatesPort } from "./port";

export const FIXTURE_TEMPLATE_FOLDERS: readonly EmailTemplateFolder[] = [
  { id: "all", name: "All Templates" },
  { id: "favorites", name: "Favorites" },
  { id: "associated", name: "Associated Templates" },
  { id: "created-by-me", name: "Created by me" },
  { id: "shared-with-me", name: "Shared with me" },
  { id: "public", name: "Public Email Templates" },
];

export const FIXTURE_TEMPLATE_MODULES: readonly string[] = [
  "All Modules",
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Tasks",
  "Meetings",
  "Calls",
];

const FIXTURE_TEMPLATES: readonly EmailTemplateItem[] = [
  {
    id: "tpl-1",
    name: "Big Deal Alert",
    description: "Big Deal Alert",
    module: "Deals",
    modifiedBy: { name: "Alex Morgan" },
    modifiedAt: "Jun 29",
    lastUsedAt: "Jul 09",
    isFavorite: false,
    folderIds: ["all", "associated", "public"],
  },
  {
    id: "tpl-2",
    name: "Lead Welcome Notice",
    description: "Welcome email sent to new incoming leads",
    module: "Leads",
    modifiedBy: { name: "Sam Lee" },
    modifiedAt: "Oct 12",
    lastUsedAt: "Oct 20",
    isFavorite: true,
    folderIds: ["all", "favorites", "created-by-me", "public"],
  },
  {
    id: "tpl-3",
    name: "Quarterly Review Invite",
    description: "Review meeting agenda and next quarter goals",
    module: "Accounts",
    modifiedBy: { name: "Casey Adams" },
    modifiedAt: "Oct 01",
    lastUsedAt: "Oct 18",
    isFavorite: false,
    folderIds: ["all", "shared-with-me", "public"],
  },
  {
    id: "tpl-4",
    name: "Contact Follow-up",
    description: "Follow-up message after initial consultation",
    module: "Contacts",
    modifiedBy: { name: "Jordan Blake" },
    modifiedAt: "Sep 28",
    lastUsedAt: null,
    isFavorite: true,
    folderIds: ["all", "favorites", "created-by-me"],
  },
  {
    id: "tpl-5",
    name: "Task Escalation Reminder",
    description: "Priority notice for overdue assignments",
    module: "Tasks",
    modifiedBy: { name: "Taylor Vance" },
    modifiedAt: "Aug 14",
    lastUsedAt: "Aug 22",
    isFavorite: false,
    folderIds: ["all", "associated"],
  },
];

export const fixtureEmailTemplatesPort: EmailTemplatesPort = {
  async listFolders() {
    return FIXTURE_TEMPLATE_FOLDERS;
  },
  async listModules() {
    return FIXTURE_TEMPLATE_MODULES;
  },
  async listTemplates() {
    return FIXTURE_TEMPLATES;
  },
};
