import type { FieldValue, RecordInput } from "./contract";

export type RecordServiceContractSystemFields = {
  owner: string;
  createdBy: string;
  modifiedBy: string;
  createdTime: string;
  modifiedTime: string;
  lastActivityTime: string;
};

/** Writable field used to tag records in filters, pagination and tenancy tests. */
export type RecordServiceContractFilterMarker = {
  field: string;
  sample: string;
  updated: string;
  tenantOther: string;
};

export type RecordServiceContractLinkedModule = {
  apiName: string;
  syntheticContactId: string;
  updatedContactId: string;
  contractLinkedContactId: string;
};

export type RecordServiceContractPanelFiltersScenario = {
  textFields: readonly string[];
  numberFields: readonly string[];
  emptyCheckFields: readonly string[];
  booleanField: string;
  seedTextFields: readonly string[];
  seedNumberFields: readonly string[];
  picklistField: string;
  picklistRowStatuses: readonly (string | null)[];
};

export type RecordServiceContractSortWithNumericScenario = {
  isolateField: string;
  numericField: string;
};

export type RecordServiceContractConnectedLookupScenario = {
  field: string;
};

/** Scenarios that only apply when a module publishes the expected metadata shape. */
export type RecordServiceContractOptionalScenarios = {
  categoryView?: {
    picklistField: string;
    categoryTokenName: string;
    includedStatus: string;
    excludedStatus: string;
    siblingStatus: string;
  };
  picklistPanel?: {
    picklistField: string;
    membershipValues: readonly string[];
    rowStatuses: readonly (string | null)[];
  };
  statusCategoryTokens?: {
    picklistField: string;
    textField: string;
    junkCategoryName: string;
    openCategoryName: string;
    junkStatus: string;
    contactedStatus: string;
    notQualifiedStatus: string;
  };
  massUpdateInvalidPicklist?: {
    field: string;
    value: string;
  };
  panelFilters?: RecordServiceContractPanelFiltersScenario;
  sortWithNumeric?: RecordServiceContractSortWithNumericScenario;
  connectedLookup?: RecordServiceContractConnectedLookupScenario;
  massUpdateClearablePhone?: string;
  massUpdateInvalidNumeric?: string;
  lengthValidationField?: string;
  filterValidationPicklist?: string;
  filterValidationBoolean?: string;
};

export type RecordServiceContractModuleDefinition = {
  apiName: string;
  singularLabel: string;
  pluralLabel: string;
  expectedFieldCount: number;
  buildMinimalValidInput: (extra?: RecordInput) => RecordInput;
  systemFields: RecordServiceContractSystemFields;
  filterMarker: RecordServiceContractFilterMarker;
  duplicatePermittedField: string;
  sortFields: readonly [string, string];
  linkedModule: RecordServiceContractLinkedModule;
  typeValidationCases: readonly (readonly [string, FieldValue])[];
  optional?: RecordServiceContractOptionalScenarios;
};

const leadsSystemFields: RecordServiceContractSystemFields = {
  owner: "Owner",
  createdBy: "Created_By",
  modifiedBy: "Modified_By",
  createdTime: "Created_Time",
  modifiedTime: "Modified_Time",
  lastActivityTime: "Last_Activity_Time",
};

export const leadsRecordServiceContractModule: RecordServiceContractModuleDefinition = {
  apiName: "Leads",
  singularLabel: "Lead",
  pluralLabel: "Leads",
  expectedFieldCount: 56,
  buildMinimalValidInput: (extra = {}) => ({
    Last_Name: "Contract Lead",
    Company: "Contract Company",
    ...extra,
  }),
  systemFields: leadsSystemFields,
  filterMarker: {
    field: "Company",
    sample: "Contract Company",
    updated: "Updated Company",
    tenantOther: "Other Company",
  },
  sortFields: ["Company", "No_of_Employees"],
  duplicatePermittedField: "Email",
  linkedModule: {
    apiName: "Contacts",
    syntheticContactId: "synthetic-contact",
    updatedContactId: "updated-contact",
    contractLinkedContactId: "contract-linked-contact",
  },
  typeValidationCases: [
    ["Company", 3],
    ["No_of_Employees", 1.5],
    ["Annual_Revenue", "3"],
    ["Email_Opt_Out", "false"],
    ["Connected_To__s", 3],
  ],
  optional: {
    categoryView: {
      picklistField: "Lead_Status",
      categoryTokenName: "Junk",
      includedStatus: "Junk Lead",
      excludedStatus: "Not Qualified",
      siblingStatus: "Junk Lead",
    },
    picklistPanel: {
      picklistField: "Lead_Status",
      membershipValues: ["Contacted", "Not Qualified"],
      rowStatuses: ["Contacted", "Junk Lead", null, "Contacted"],
    },
    statusCategoryTokens: {
      picklistField: "Lead_Status",
      textField: "First_Name",
      junkCategoryName: "Junk",
      openCategoryName: "Open",
      junkStatus: "Junk Lead",
      contactedStatus: "Contacted",
      notQualifiedStatus: "Not Qualified",
    },
    massUpdateInvalidPicklist: {
      field: "Lead_Status",
      value: "Unknown Option",
    },
    panelFilters: {
      textFields: ["First_Name", "Email", "Phone", "Website", "Description"],
      numberFields: ["Annual_Revenue", "No_of_Employees", "Latitude"],
      emptyCheckFields: ["First_Name", "Lead_Status", "Annual_Revenue", "Email_Opt_Out"],
      booleanField: "Email_Opt_Out",
      seedTextFields: ["First_Name", "Email", "Phone", "Website", "Description"],
      seedNumberFields: ["Annual_Revenue", "No_of_Employees", "Latitude"],
      picklistField: "Lead_Status",
      picklistRowStatuses: ["Contacted", "Junk Lead", null, "Contacted"],
    },
    sortWithNumeric: {
      isolateField: "Email",
      numericField: "No_of_Employees",
    },
    connectedLookup: {
      field: "Connected_To__s",
    },
    massUpdateClearablePhone: "Phone",
    massUpdateInvalidNumeric: "No_of_Employees",
    filterValidationPicklist: "Lead_Status",
    filterValidationBoolean: "Email_Opt_Out",
  },
};
