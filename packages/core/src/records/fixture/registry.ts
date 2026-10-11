import type { FieldValue, ListView, ModuleMetadata, RecordData } from "../contract";
import { contactsMetadata } from "./contacts/metadata";
import { fullName as contactsFullName, generateFixtureContacts } from "./contacts/seed";
import { contactsViews } from "./contacts/views";
import { leadsMetadata } from "./metadata";
import { generateFixtureLeads, fullName as leadsFullName } from "./seed";
import { leadsViews } from "./views";

export interface FixtureModuleBundle {
  metadata: ModuleMetadata;
  views: readonly ListView[];
  generateSeed: (now: Date) => RecordData[];
  fullName: (fields: Readonly<Record<string, FieldValue>>) => string;
  managedFields: ReadonlySet<string>;
  searchFields: readonly string[];
  initialNextId: bigint;
  createDefaults: (stamp: string) => Record<string, FieldValue>;
}

const leadsManaged = new Set([
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
  Leads: {
    metadata: leadsMetadata,
    views: leadsViews,
    generateSeed: (now) => generateFixtureLeads(68, now),
    fullName: leadsFullName,
    managedFields: leadsManaged,
    searchFields: ["Full_Name", "Company", "Email", "Phone"],
    initialNextId: 200000000000000000n,
    createDefaults: (stamp) => ({
      Converted__s: false,
      Locked__s: false,
      Created_Time: stamp,
      Modified_Time: stamp,
    }),
  },
  Contacts: {
    metadata: contactsMetadata,
    views: contactsViews,
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
