import type { FieldValue, RecordInput } from "./contract";

/** Field API names exercised by the shared record-service contract suite. */
export type RecordServiceContractFieldNames = {
  company: string;
  lastName: string;
  email: string;
  phone: string;
  firstName: string;
  website: string;
  description: string;
  noOfEmployees: string;
  annualRevenue: string;
  latitude: string;
  emailOptOut: string;
  leadStatus: string;
  owner: string;
  createdBy: string;
  modifiedBy: string;
  createdTime: string;
  lastActivityTime: string;
  connectedTo: string;
};

export type RecordServiceContractLinkedModule = {
  apiName: string;
  syntheticContactId: string;
  updatedContactId: string;
  contractLinkedContactId: string;
};

/** Scenarios that only apply when a module publishes the expected metadata shape. */
export type RecordServiceContractOptionalScenarios = {
  categoryView: {
    categoryTokenName: string;
    includedStatus: string;
    excludedStatus: string;
    siblingStatus: string;
  };
  picklistPanel: {
    membershipValues: readonly string[];
    rowStatuses: readonly (string | null)[];
  };
  statusCategoryTokens: {
    junkCategoryName: string;
    openCategoryName: string;
    junkStatus: string;
    contactedStatus: string;
    notQualifiedStatus: string;
  };
  massUpdateInvalidPicklistValue: string;
};

export type RecordServiceContractModuleDefinition = {
  apiName: string;
  singularLabel: string;
  pluralLabel: string;
  expectedFieldCount: number;
  fields: RecordServiceContractFieldNames;
  sampleLastName: string;
  sampleCompany: string;
  updatedCompany: string;
  tenantOtherCompany: string;
  sortFields: readonly [string, string];
  duplicatePermittedField: string;
  linkedModule: RecordServiceContractLinkedModule;
  typeValidationCases: readonly (readonly [string, FieldValue])[];
  panelTextFields: readonly string[];
  panelNumberFields: readonly string[];
  panelEmptyCheckFields: readonly string[];
  optional?: RecordServiceContractOptionalScenarios;
};

export function minimalContractInput(
  definition: RecordServiceContractModuleDefinition,
  extra: RecordInput = {},
): RecordInput {
  const { fields, sampleLastName, sampleCompany } = definition;
  return {
    [fields.lastName]: sampleLastName,
    [fields.company]: sampleCompany,
    ...extra,
  };
}

const leadsFields: RecordServiceContractFieldNames = {
  company: "Company",
  lastName: "Last_Name",
  email: "Email",
  phone: "Phone",
  firstName: "First_Name",
  website: "Website",
  description: "Description",
  noOfEmployees: "No_of_Employees",
  annualRevenue: "Annual_Revenue",
  latitude: "Latitude",
  emailOptOut: "Email_Opt_Out",
  leadStatus: "Lead_Status",
  owner: "Owner",
  createdBy: "Created_By",
  modifiedBy: "Modified_By",
  createdTime: "Created_Time",
  lastActivityTime: "Last_Activity_Time",
  connectedTo: "Connected_To__s",
};

export const leadsRecordServiceContractModule: RecordServiceContractModuleDefinition = {
  apiName: "Leads",
  singularLabel: "Lead",
  pluralLabel: "Leads",
  expectedFieldCount: 56,
  fields: leadsFields,
  sampleLastName: "Contract Lead",
  sampleCompany: "Contract Company",
  updatedCompany: "Updated Company",
  tenantOtherCompany: "Other Company",
  sortFields: [leadsFields.company, leadsFields.noOfEmployees],
  duplicatePermittedField: leadsFields.email,
  linkedModule: {
    apiName: "Contacts",
    syntheticContactId: "synthetic-contact",
    updatedContactId: "updated-contact",
    contractLinkedContactId: "contract-linked-contact",
  },
  typeValidationCases: [
    [leadsFields.company, 3],
    [leadsFields.noOfEmployees, 1.5],
    [leadsFields.annualRevenue, "3"],
    [leadsFields.emailOptOut, "false"],
    [leadsFields.connectedTo, 3],
  ],
  panelTextFields: [
    leadsFields.firstName,
    leadsFields.email,
    leadsFields.phone,
    leadsFields.website,
    leadsFields.description,
  ],
  panelNumberFields: [leadsFields.annualRevenue, leadsFields.noOfEmployees, leadsFields.latitude],
  panelEmptyCheckFields: [
    leadsFields.firstName,
    leadsFields.leadStatus,
    leadsFields.annualRevenue,
    leadsFields.emailOptOut,
  ],
  optional: {
    categoryView: {
      categoryTokenName: "Junk",
      includedStatus: "Junk Lead",
      excludedStatus: "Not Qualified",
      siblingStatus: "Junk Lead",
    },
    picklistPanel: {
      membershipValues: ["Contacted", "Not Qualified"],
      rowStatuses: ["Contacted", "Junk Lead", null, "Contacted"],
    },
    statusCategoryTokens: {
      junkCategoryName: "Junk",
      openCategoryName: "Open",
      junkStatus: "Junk Lead",
      contactedStatus: "Contacted",
      notQualifiedStatus: "Not Qualified",
    },
    massUpdateInvalidPicklistValue: "Unknown Option",
  },
};
