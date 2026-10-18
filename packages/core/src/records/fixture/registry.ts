import type { FieldValue, ListView, ModuleMetadata, RecordData } from "../contract";
import { accountsMetadata } from "./accounts/metadata";
import { fullName as accountsFullName, generateFixtureAccounts } from "./accounts/seed";
import { accountsViews } from "./accounts/views";
import { activityDeleteHook } from "./activity-hooks";
import { attachmentsHooks, removeAttachmentsForParents } from "./attachments/hooks";
import { attachmentsMetadata } from "./attachments/metadata";
import { generateFixtureAttachments } from "./attachments/seed";
import { callsHooks } from "./calls/hooks";
import { callsMetadata } from "./calls/metadata";
import { fullName as callsFullName, generateFixtureCalls } from "./calls/seed";
import { callsViews } from "./calls/views";
import { campaignMembersHooks, removeCampaignMembersFor } from "./campaign-members/hooks";
import { campaignMembersMetadata } from "./campaign-members/metadata";
import { generateFixtureCampaignMembers } from "./campaign-members/seed";
import { campaignsHooks } from "./campaigns/hooks";
import { campaignsMetadata } from "./campaigns/metadata";
import { fullName as campaignsFullName, generateFixtureCampaigns } from "./campaigns/seed";
import { campaignsViews } from "./campaigns/views";
import { casesMetadata } from "./cases/metadata";
import { fullName as casesFullName, generateFixtureCases } from "./cases/seed";
import { casesViews } from "./cases/views";
import {
  contactRolesHooks,
  removeContactRolesFor,
  transferContactRolesToMaster,
} from "./contact-roles/hooks";
import { contactRolesMetadata } from "./contact-roles/metadata";
import { contactRolesIdBase, generateFixtureContactRoles } from "./contact-roles/seed";
import { contactsMetadata } from "./contacts/metadata";
import { fullName as contactsFullName, generateFixtureContacts } from "./contacts/seed";
import { contactsViews } from "./contacts/views";
import { historyMetadata, historyViews } from "./deals/history";
import { dealsHooks, historyHooks } from "./deals/hooks";
import { dealsMetadata } from "./deals/metadata";
import { fullName as dealsFullName, generateFixtureDeals } from "./deals/seed";
import { dealsViews } from "./deals/views";
import { eventsHooks } from "./events/hooks";
import { eventsMetadata } from "./events/metadata";
import { fullName as eventsFullName, generateFixtureEvents } from "./events/seed";
import { eventsViews } from "./events/views";
import type { FixtureModuleHooks } from "./hooks";
import { leadsMetadata } from "./metadata";
import { notesHooks, removeNotesForParents, transferNotesToMaster } from "./notes/hooks";
import { notesMetadata } from "./notes/metadata";
import { generateFixtureNotes } from "./notes/seed";
import { generateFixtureLeads, fullName as leadsFullName } from "./seed";
import { solutionsMetadata } from "./solutions/metadata";
import { generateFixtureSolutions, fullName as solutionsFullName } from "./solutions/seed";
import { solutionsViews } from "./solutions/views";
import { removeRecordTags } from "./tags";
import { tasksHooks } from "./tasks/hooks";
import { tasksMetadata } from "./tasks/metadata";
import { generateFixtureTasks, fullName as tasksFullName } from "./tasks/seed";
import { tasksViews } from "./tasks/views";
import { leadsViews } from "./views";

export interface FixtureModuleBundle extends FixtureModuleHooks {
  autoNumberField?: string;
  readOnly?: boolean;
  /** Related-list records remain available to CRUD, but not discovery surfaces. */
  childModule?: boolean;
  metadata: ModuleMetadata;
  views: readonly ListView[];
  displayNameField: string;
  generateSeed: (now: Date) => RecordData[];
  fullName: (fields: Readonly<Record<string, FieldValue>>) => string;
  managedFields: ReadonlySet<string>;
  searchFields: readonly string[];
  initialNextId: bigint;
  createDefaults: (stamp: string) => Record<string, FieldValue>;
}

export const leadsManagedFields = new Set([
  "Full_Name",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "Last_Activity_Time",
  "Converted_Date_Time",
  "Lead_Conversion_Time",
  "Lead_Status_Modified_Time",
]);

const contactsManaged = new Set([
  "Full_Name",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "Last_Activity_Time",
  "id",
]);

function parentDeleteHook(module: string, existing?: FixtureModuleHooks["afterDelete"]) {
  return activityDeleteHook(module, (ids, ctx) => {
    existing?.(ids, ctx);
    if (module === "Campaigns" || module === "Leads" || module === "Contacts")
      removeCampaignMembersFor(
        module === "Campaigns" ? "Campaign" : module === "Leads" ? "Lead" : "Contact",
        ids,
        ctx,
      );
    removeAttachmentsForParents(module, ids, ctx);
    removeNotesForParents(module, ids, ctx);
    if (module === "Deals" || module === "Contacts")
      removeContactRolesFor(module === "Deals" ? "Deal" : "Contact", ids, ctx);
  });
}

function parentMergeHook(module: string): NonNullable<FixtureModuleHooks["transferMergedRecords"]> {
  return (ids, masterId, ctx) => {
    transferNotesToMaster(module, ids, masterId, ctx);
    if (module === "Contacts") transferContactRolesToMaster(ids, masterId, ctx);
  };
}

const moduleBundles: Readonly<Record<string, FixtureModuleBundle>> = {
  Solutions: {
    autoNumberField: "Solution_Number",
    afterDelete: parentDeleteHook("Solutions"),
    transferMergedRecords: parentMergeHook("Solutions"),
    metadata: solutionsMetadata,
    views: solutionsViews,
    displayNameField: "Solution_Title",
    fullName: solutionsFullName,
    generateSeed: generateFixtureSolutions,
    managedFields: new Set(
      [...contactsManaged].filter((field) => field !== "Full_Name").concat("Solution_Number"),
    ),
    searchFields: ["Solution_Title", "Solution_Number"],
    initialNextId: 280000000000000000n,
    createDefaults: (stamp) => ({ Locked__s: false, Created_Time: stamp, Modified_Time: stamp }),
  },

  Cases: {
    autoNumberField: "Case_Number",
    afterDelete: parentDeleteHook("Cases"),
    transferMergedRecords: parentMergeHook("Cases"),
    metadata: casesMetadata,
    views: casesViews,
    displayNameField: "Subject",
    fullName: casesFullName,
    generateSeed: generateFixtureCases,
    managedFields: new Set(
      [...contactsManaged].filter((field) => field !== "Full_Name").concat("Case_Number"),
    ),
    searchFields: ["Subject", "Case_Number"],
    initialNextId: 260000000000000000n,
    createDefaults: (stamp) => ({ Locked__s: false, Created_Time: stamp, Modified_Time: stamp }),
  },
  Campaigns: {
    ...campaignsHooks,
    afterDelete: parentDeleteHook("Campaigns"),
    metadata: campaignsMetadata,
    views: campaignsViews,
    displayNameField: "Campaign_Name",
    generateSeed: (now) => generateFixtureCampaigns(68, now),
    fullName: campaignsFullName,
    managedFields: new Set([
      "id",
      "Created_By",
      "Modified_By",
      "Created_Time",
      "Modified_Time",
      "Last_Activity_Time",
    ]),
    searchFields: ["Campaign_Name", "Description"],
    initialNextId: 220000000000000000n,
    createDefaults: (stamp) => ({ Created_Time: stamp, Modified_Time: stamp }),
  },
  Campaign_Members: {
    ...campaignMembersHooks,
    childModule: true,
    metadata: campaignMembersMetadata,
    views: [
      {
        id: "all-campaign-members",
        name: "All Campaign Members",
        systemDefined: true,
        isDefault: true,
        columns: ["Campaign", "Lead", "Contact", "Member_Status"],
        criteria: null,
        sort: null,
      },
    ],
    displayNameField: "id",
    generateSeed: generateFixtureCampaignMembers,
    fullName: (fields) => String(fields.id),
    managedFields: new Set(["id", "Created_By", "Modified_By", "Created_Time", "Modified_Time"]),
    searchFields: [],
    initialNextId: 240000000000000000n,
    createDefaults: (stamp) => ({ Created_Time: stamp, Modified_Time: stamp }),
  },
  Attachments: {
    ...attachmentsHooks,
    childModule: true,
    metadata: attachmentsMetadata,
    views: [
      {
        id: "all-attachments",
        name: "All Attachments",
        systemDefined: true,
        isDefault: true,
        columns: ["File_Name", "Size", "Parent_Id"],
        criteria: null,
        sort: null,
      },
    ],
    displayNameField: "File_Name",
    generateSeed: generateFixtureAttachments,
    fullName: (fields) => String(fields.File_Name ?? ""),
    managedFields: new Set(["Created_By", "Modified_By", "Created_Time", "Modified_Time", "id"]),
    searchFields: ["File_Name"],
    initialNextId: 190000000000000000n,
    createDefaults: (stamp) => ({ Created_Time: stamp, Modified_Time: stamp }),
  },
  Notes: {
    ...notesHooks,
    childModule: true,
    metadata: notesMetadata,
    views: [
      {
        id: "all-notes",
        name: "All Notes",
        systemDefined: true,
        isDefault: true,
        columns: ["Note_Title", "Note_Content", "Parent_Id"],
        criteria: null,
        sort: null,
      },
    ],
    displayNameField: "id",
    fullName: (fields) => String(fields.id),
    generateSeed: (now) => generateFixtureNotes(68, now),
    managedFields: new Set(["id", "Created_By", "Modified_By", "Created_Time", "Modified_Time"]),
    searchFields: [],
    initialNextId: 180000000000001000n,
    createDefaults: (stamp) => ({ Created_Time: stamp, Modified_Time: stamp }),
  },
  Contact_Roles: {
    ...contactRolesHooks,
    childModule: true,
    metadata: contactRolesMetadata,
    views: [
      {
        id: "all-contact-roles",
        name: "All Contact Roles",
        systemDefined: true,
        isDefault: true,
        columns: ["Deal", "Contact", "Contact_Role"],
        criteria: null,
        sort: null,
      },
    ],
    displayNameField: "id",
    fullName: (fields) => String(fields.id),
    generateSeed: (now) =>
      generateFixtureContactRoles(
        generateFixtureDeals(68, now),
        generateFixtureContacts(68, now),
        now,
      ),
    managedFields: new Set(["id", "Created_By", "Modified_By", "Created_Time", "Modified_Time"]),
    searchFields: [],
    initialNextId: contactRolesIdBase + 1000n,
    createDefaults: (stamp) => ({ Created_Time: stamp, Modified_Time: stamp }),
  },
  Events: {
    ...eventsHooks,
    metadata: eventsMetadata,
    views: eventsViews,
    displayNameField: "Event_Title",
    generateSeed: (now) => generateFixtureEvents(68, now),
    fullName: eventsFullName,
    managedFields: new Set([...contactsManaged].filter((field) => field !== "Full_Name")),
    searchFields: ["Event_Title", "Description", "Venue"],
    initialNextId: 140000000000000000n,
    createDefaults: (stamp) => ({ Created_Time: stamp, Modified_Time: stamp }),
  },
  Calls: {
    ...callsHooks,
    metadata: callsMetadata,
    views: callsViews,
    displayNameField: "Subject",
    generateSeed: (now) => generateFixtureCalls(68, now),
    fullName: callsFullName,
    managedFields: new Set([...contactsManaged].filter((field) => field !== "Full_Name")),
    searchFields: ["Subject", "Description"],
    initialNextId: 160000000000000000n,
    createDefaults: (stamp) => ({ CTI_Entry: false, Created_Time: stamp, Modified_Time: stamp }),
  },
  Tasks: {
    ...tasksHooks,
    metadata: tasksMetadata,
    views: tasksViews,
    displayNameField: "Subject",
    generateSeed: (now) => generateFixtureTasks(68, now),
    fullName: tasksFullName,
    managedFields: new Set([...contactsManaged].filter((field) => field !== "Full_Name")),
    searchFields: ["Subject", "Description"],
    initialNextId: 120000000000000000n,
    createDefaults: (stamp) => ({ Locked__s: false, Created_Time: stamp, Modified_Time: stamp }),
  },
  Leads: {
    transferMergedRecords: parentMergeHook("Leads"),
    afterDelete: parentDeleteHook("Leads"),
    metadata: leadsMetadata,
    views: leadsViews,
    displayNameField: "Full_Name",
    generateSeed: (now) => generateFixtureLeads(68, now),
    fullName: leadsFullName,
    managedFields: leadsManagedFields,
    searchFields: ["Full_Name", "Company", "Email", "Phone"],
    initialNextId: 200000000000000000n,
    createDefaults: (stamp) => ({
      Converted__s: false,
      Locked__s: false,
      Created_Time: stamp,
      Modified_Time: stamp,
    }),
  },
  Accounts: {
    transferMergedRecords: parentMergeHook("Accounts"),
    afterDelete: parentDeleteHook("Accounts"),
    metadata: accountsMetadata,
    views: accountsViews,
    displayNameField: "Account_Name",
    generateSeed: (now) => generateFixtureAccounts(68, now),
    fullName: accountsFullName,
    managedFields: new Set([...contactsManaged].filter((field) => field !== "Full_Name")),
    searchFields: ["Account_Name", "Phone", "Website", "Account_Site"],
    initialNextId: 600000000000000000n,
    createDefaults: (stamp) => ({ Locked__s: false, Created_Time: stamp, Modified_Time: stamp }),
  },
  DealHistory: {
    ...historyHooks,
    readOnly: true,
    metadata: historyMetadata,
    views: historyViews,
    displayNameField: "id",
    generateSeed: () => [],
    fullName: (fields) => String(fields.id),
    managedFields: new Set(),
    searchFields: ["Stage"],
    initialNextId: 900000000000000000n,
    createDefaults: () => ({}),
  },
  Deals: {
    ...dealsHooks,
    transferMergedRecords: parentMergeHook("Deals"),
    afterDelete: parentDeleteHook("Deals", dealsHooks.afterDelete),
    metadata: dealsMetadata,
    views: dealsViews,
    displayNameField: "Deal_Name",
    generateSeed: (now) => generateFixtureDeals(68, now),
    fullName: dealsFullName,
    managedFields: new Set([...contactsManaged].filter((field) => field !== "Full_Name")),
    searchFields: ["Deal_Name", "Next_Step", "Description"],
    initialNextId: 800000000000000000n,
    createDefaults: (stamp) => ({ Locked__s: false, Created_Time: stamp, Modified_Time: stamp }),
  },
  Contacts: {
    transferMergedRecords: parentMergeHook("Contacts"),
    afterDelete: parentDeleteHook("Contacts"),
    metadata: contactsMetadata,
    views: contactsViews,
    displayNameField: "Full_Name",
    generateSeed: (now) => generateFixtureContacts(68, now),
    fullName: contactsFullName,
    managedFields: contactsManaged,
    searchFields: ["Full_Name", "Email", "Phone", "Mobile", "Title"],
    initialNextId: 400000000000000000n,
    createDefaults: (stamp) => ({
      Locked__s: false,
      Created_Time: stamp,
      Modified_Time: stamp,
    }),
  },
};

/** Tag support follows metadata, including modules added after this slice. */
export const fixtureModules: Readonly<Record<string, FixtureModuleBundle>> = Object.fromEntries(
  Object.entries(moduleBundles).map(([module, bundle]) => {
    if (!bundle.metadata.fields.some((field) => field.apiName === "Tag")) return [module, bundle];
    return [
      module,
      {
        ...bundle,
        metadata: {
          ...bundle.metadata,
          fields: bundle.metadata.fields.map((field) =>
            field.apiName === "Tag" ? { ...field, acceptsJsonArray: true } : field,
          ),
        },
        afterDelete(
          ids: readonly string[],
          ctx: Parameters<NonNullable<FixtureModuleHooks["afterDelete"]>>[1],
        ) {
          bundle.afterDelete?.(ids, ctx);
          removeRecordTags(ctx.moduleStore(module), ids);
        },
      },
    ];
  }),
);

export const supportedModules = Object.keys(fixtureModules).filter(
  (name) => !fixtureModules[name]?.childModule,
);
