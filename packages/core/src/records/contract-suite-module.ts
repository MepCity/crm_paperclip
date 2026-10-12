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
  linkedModuleApiName: string;
  syntheticReferenceId: string;
  updatedReferenceId: string;
  contractLinkedReferenceId: string;
};

/** Scenarios that only apply when a module publishes the expected metadata shape. */
export type RecordServiceContractOptionalScenarios = {
  /** Writable date field published by the module. */
  date?: { field: string };
  singleModuleLookup?: {
    field: string;
    reference: { module: string; id: string; name?: string };
    expectedName?: string;
  };
  /** Harness-provisioned locked records discoverable by this boolean field. */
  lockedRecords?: { field: string };
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
  /** Invalid Owner payload shaped as a connected-module reference (module-specific). */
  ownerInvalidConnectedReference?: { module: string; id: string };
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
  /** When set, each field's `unique` flag must match membership in this list. */
  expectedUniqueFields?: readonly string[];
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
  expectedUniqueFields: [],
  typeValidationCases: [
    ["Company", 3],
    ["No_of_Employees", 1.5],
    ["Annual_Revenue", "3"],
    ["Email_Opt_Out", "false"],
    ["Connected_To__s", 3],
  ],
  optional: {
    lockedRecords: { field: "Locked__s" },
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
      linkedModuleApiName: "Contacts",
      syntheticReferenceId: "synthetic-contact",
      updatedReferenceId: "updated-contact",
      contractLinkedReferenceId: "contract-linked-contact",
    },
    ownerInvalidConnectedReference: { module: "Contacts", id: "second-member" },
    massUpdateClearablePhone: "Phone",
    massUpdateInvalidNumeric: "No_of_Employees",
    filterValidationPicklist: "Lead_Status",
    filterValidationBoolean: "Email_Opt_Out",
  },
};

const contactsSystemFields: RecordServiceContractSystemFields = {
  owner: "Owner",
  createdBy: "Created_By",
  modifiedBy: "Modified_By",
  createdTime: "Created_Time",
  modifiedTime: "Modified_Time",
  lastActivityTime: "Last_Activity_Time",
};

export const contactsRecordServiceContractModule: RecordServiceContractModuleDefinition = {
  apiName: "Contacts",
  singularLabel: "Contact",
  pluralLabel: "Contacts",
  expectedFieldCount: 61,
  buildMinimalValidInput: (extra = {}) => ({
    Last_Name: "Contract Contact",
    ...extra,
  }),
  systemFields: contactsSystemFields,
  filterMarker: {
    field: "Title",
    sample: "Contract Title",
    updated: "Updated Title",
    tenantOther: "Other Title",
  },
  sortFields: ["Last_Name", "Title"],
  duplicatePermittedField: "Phone",
  expectedUniqueFields: ["Email"],
  typeValidationCases: [
    ["Last_Name", 3],
    ["Date_of_Birth", "not-a-date"],
    ["Email_Opt_Out", "false"],
    ["Account_Name", "account"],
  ],
  optional: {
    date: { field: "Date_of_Birth" },
    lockedRecords: { field: "Locked__s" },
    massUpdateClearablePhone: "Phone",
    lengthValidationField: "Last_Name",
    singleModuleLookup: {
      field: "Reporting_To",
      reference: { module: "Contacts", id: "300000000000000000" },
      expectedName: "Sample 001 Contact 001",
    },
  },
};
