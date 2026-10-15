import type { FieldValue, ListView, ModuleMetadata, RecordData } from "../contract";
import { accountsMetadata } from "./accounts/metadata";
import { fullName as accountsFullName, generateFixtureAccounts } from "./accounts/seed";
import { accountsViews } from "./accounts/views";
import { activityDeleteHook } from "./activity-hooks";
import { callsHooks } from "./calls/hooks";
import { callsMetadata } from "./calls/metadata";
import { fullName as callsFullName, generateFixtureCalls } from "./calls/seed";
import { callsViews } from "./calls/views";
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
import { notesHooks } from "./notes/hooks";
import { notesMetadata } from "./notes/metadata";
import { generateFixtureNotes } from "./notes/seed";
import { notesViews } from "./notes/views";
import { generateFixtureLeads, fullName as leadsFullName } from "./seed";
import { tasksHooks } from "./tasks/hooks";
import { tasksMetadata } from "./tasks/metadata";
import { generateFixtureTasks, fullName as tasksFullName } from "./tasks/seed";
import { tasksViews } from "./tasks/views";
import { leadsViews } from "./views";

export interface FixtureModuleBundle extends FixtureModuleHooks {
  readOnly?: boolean;
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

export const fixtureModules: Readonly<Record<string, FixtureModuleBundle>> = {
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
  Notes: {
    ...notesHooks,
    metadata: notesMetadata,
    views: notesViews,
    displayNameField: "Note_Title",
    generateSeed: (now) => generateFixtureNotes(68, now),
    fullName: (fields) => String(fields.Note_Title ?? ""),
    managedFields: new Set([...contactsManaged].filter((field) => field !== "Full_Name")),
    searchFields: ["Note_Title", "Note_Content"],
    initialNextId: 195000000000000000n,
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
    afterDelete: activityDeleteHook("Leads"),
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
    afterDelete: activityDeleteHook("Accounts"),
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
    afterDelete: activityDeleteHook("Deals", dealsHooks.afterDelete),
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
    afterDelete: activityDeleteHook("Contacts"),
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

export const supportedModules = Object.keys(fixtureModules);
