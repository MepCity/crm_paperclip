import { z } from "zod";

/**
 * Single list of permission keys (ADR 0017 §3). Only features this CRM ships;
 * a toggle that controls nothing is worse than a missing row. When a feature ships,
 * its keys are added here in the same change.
 */
export const SCHEMA_VERSION = 1 as const;

/** Record modules with an `Owner`, in the order the settings screens list them. */
export const OWNED_MODULES = [
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Tasks",
  "Meetings",
  "Calls",
  "Campaigns",
  "Cases",
  "Solutions",
  "Products",
  "Quotes",
  "Invoices",
] as const;
/** Modules whose access follows their parent record (ADR 0017 §4.3 item 5). */
export const CHILD_MODULES = ["Notes", "Attachments"] as const;
export type ModuleApiName = (typeof OWNED_MODULES)[number];
export const MODULE_API_NAMES: readonly string[] = OWNED_MODULES;

export function isCatalogueModule(value: string): value is ModuleApiName {
  return (MODULE_API_NAMES as readonly string[]).includes(value);
}

/** Never hidden for any profile (ADR 0017 §4.2). */
export const MANAGED_SYSTEM_FIELDS: readonly string[] = [
  "id",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
];

const moduleName = z.enum(OWNED_MODULES);
const moduleList = z.array(moduleName).refine((l) => new Set(l).size === l.length, "duplicate");

const moduleActions = z.object({
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});

const reportsFeature = z.object({
  view: z.boolean(),
  manage: z.boolean(),
  schedule: z.boolean(),
  export: z.boolean(),
});
const analyticsFeature = z.object({ view: z.boolean(), manage: z.boolean(), export: z.boolean() });
const documentsFeature = z.object({
  view: z.boolean(),
  createTeamFolder: z.boolean(),
  associateTeamFolder: z.boolean(),
  editTeamFolder: z.boolean(),
});
const crudFeature = z.object({
  view: z.boolean(),
  create: z.boolean(),
  edit: z.boolean(),
  delete: z.boolean(),
});
const feedsFeature = z.object({ view: z.boolean(), post: z.boolean() });
const attachmentsFeature = z.object({
  view: z.boolean(),
  create: z.boolean(),
  delete: z.boolean(),
});

export const profilePermissionsSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  modules: z.object(
    Object.fromEntries(OWNED_MODULES.map((m) => [m, moduleActions])) as Record<
      ModuleApiName,
      typeof moduleActions
    >,
  ),
  features: z.object({
    reports: reportsFeature,
    analytics: analyticsFeature,
    documents: documentsFeature,
    notes: crudFeature,
    attachments: attachmentsFeature,
    // Profiles stored before Feeds shipped have no key: both default to allowed.
    feeds: feedsFeature.default({ view: true, post: true }),
  }),
  importModules: moduleList,
  exportModules: moduleList,
  email: z.object({ send: moduleList, mass: moduleList, delete: moduleList }),
  tools: z.object({
    massUpdate: moduleList,
    massDelete: moduleList,
    changeOwner: moduleList,
    massTransfer: moduleList,
    convert: moduleList,
    share: moduleList,
    printView: moduleList,
    findAndMerge: moduleList,
    manageViews: z.boolean(),
    tags: z.boolean(),
    recordTimeline: z.boolean(),
    onlyListSubordinates: z.boolean(),
  }),
  admin: z.object({
    userManagement: z.boolean(),
    moduleCustomization: z.boolean(),
    manageCurrencies: z.boolean(),
    customizeHome: z.boolean(),
    manageAutomation: z.boolean(),
    manageTemplates: z.boolean(),
    emailSettings: z.boolean(),
    dataManagement: z.boolean(),
    viewAllRecords: moduleList,
    modifyAllRecords: moduleList,
  }),
});

export type ProfilePermissions = z.infer<typeof profilePermissionsSchema>;

/** Strict schema for writes: unknown keys are rejected. */
export const profilePermissionsWriteSchema = profilePermissionsSchema.strict();

/** Read path: unknown keys are dropped (zod objects strip by default). */
export function parseStoredPermissions(value: unknown): ProfilePermissions {
  return profilePermissionsSchema.parse(value);
}

const all = (): ModuleApiName[] => [...OWNED_MODULES];

/** Administrator: every key true, every module listed. Not editable. */
export function administratorPermissions(): ProfilePermissions {
  const full = { view: true, create: true, edit: true, delete: true };
  return {
    schemaVersion: SCHEMA_VERSION,
    modules: Object.fromEntries(OWNED_MODULES.map((m) => [m, { ...full }])) as Record<
      ModuleApiName,
      typeof full
    >,
    features: {
      reports: { view: true, manage: true, schedule: true, export: true },
      analytics: { view: true, manage: true, export: true },
      documents: {
        view: true,
        createTeamFolder: true,
        associateTeamFolder: true,
        editTeamFolder: true,
      },
      notes: { ...full },
      attachments: { view: true, create: true, delete: true },
      feeds: { view: true, post: true },
    },
    importModules: all(),
    exportModules: all(),
    email: { send: all(), mass: all(), delete: all() },
    tools: {
      massUpdate: all(),
      massDelete: all(),
      changeOwner: all(),
      massTransfer: all(),
      convert: ["Leads"],
      share: all(),
      printView: all(),
      findAndMerge: all(),
      manageViews: true,
      tags: true,
      recordTimeline: true,
      onlyListSubordinates: false,
    },
    admin: {
      userManagement: true,
      moduleCustomization: true,
      manageCurrencies: true,
      customizeHome: true,
      manageAutomation: true,
      manageTemplates: true,
      emailSettings: true,
      dataManagement: true,
      viewAllRecords: all(),
      modifyAllRecords: all(),
    },
  };
}

/**
 * Standard: Administrator minus every `admin.*` permission. The reference also drops a few
 * export/print entries of modules we do not ship, so there is nothing further to remove.
 */
export function standardPermissions(): ProfilePermissions {
  const base = administratorPermissions();
  return {
    ...base,
    admin: {
      userManagement: false,
      moduleCustomization: false,
      manageCurrencies: false,
      customizeHome: false,
      manageAutomation: false,
      manageTemplates: false,
      emailSettings: false,
      dataManagement: false,
      viewAllRecords: [],
      modifyAllRecords: [],
    },
  };
}

/** Sections of a Standard profile that may still be edited (spec §2.2): modules and features. */
export const STANDARD_EDITABLE_SECTIONS = ["modules", "features"] as const;

export const ADMINISTRATOR_NAME = "Administrator";
export const STANDARD_NAME = "Standard";
export const ROOT_ROLE_NAME = "CEO";
export const MANAGER_ROLE_NAME = "Manager";

/** Module defaults of a fresh organisation: private except Products (ADR 0017 §10). */
export function seedModuleDefaults(): {
  module: ModuleApiName;
  level: "private" | "public_read";
}[] {
  return OWNED_MODULES.map((module) => ({
    module,
    level: module === "Products" ? "public_read" : "private",
  }));
}
