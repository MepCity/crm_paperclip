import type { FormRules } from "@/components/records/form/form-model";

export const ACCOUNTS_FORM_CREATE_TITLE = "Create Account";
export const ACCOUNTS_FORM_EDIT_TITLE = "Edit Account";

const buildingLabelLines = ["Flat / House No./", "Building /", "Apartment Name"] as const;

export const ACCOUNTS_FORM_ADDRESS_GROUPS = ["Billing", "Shipping"].map((prefix) => ({
  field: `${prefix}_Address`,
  country: `${prefix}_Country`,
  state: `${prefix}_State`,
  latitude: `${prefix}_Latitude`,
  longitude: `${prefix}_Longitude`,
  coordinates: `${prefix}_Coordinates`,
  subfields: [
    `${prefix}_Country`,
    `${prefix}_Flat_House_No_Building_Apartment_Name`,
    `${prefix}_Street`,
    `${prefix}_City`,
    `${prefix}_State`,
    `${prefix}_Code`,
    `${prefix}_Latitude`,
    `${prefix}_Longitude`,
  ],
}));

export const accountsFormRules: FormRules = {
  owner: "Owner",
  currency: "Annual_Revenue",
  omitted: ["Connected_To__s"],
  countries: [
    { field: "Billing_Country", state: "Billing_State" },
    { field: "Shipping_Country", state: "Shipping_State" },
  ],
  labelLines: {
    Billing_Flat_House_No_Building_Apartment_Name: buildingLabelLines,
    Shipping_Flat_House_No_Building_Apartment_Name: buildingLabelLines,
  },
  addresses: ACCOUNTS_FORM_ADDRESS_GROUPS,
};

/**
 * Spec column order for Account Information (eight rows in two columns).
 * Wired through `form.fallbackColumns` and `applySectionColumnOverrides` so
 * metadata layout columns are replaced on the form screen when layout does not match.
 */
export const ACCOUNTS_FORM_INFORMATION_COLUMNS = [
  [
    "Owner",
    "Account_Name",
    "Account_Site",
    "Parent_Account",
    "Account_Number",
    "Account_Type",
    "Industry",
    "Annual_Revenue",
  ],
  ["Rating", "Phone", "Fax", "Website", "Ticker_Symbol", "Ownership", "Employees", "SIC_Code"],
] as const;

/** Child field order inside each address group (parent `*_Address` excluded). */
export const ACCOUNTS_FORM_ADDRESS_CHILD_ORDER = [
  "Country",
  "Flat_House_No_Building_Apartment_Name",
  "Street",
  "City",
  "State",
  "Code",
  "Latitude",
  "Longitude",
] as const;
