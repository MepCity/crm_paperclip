import type { FieldDataType, ModuleMetadata } from "@crm/core/records";
import { english } from "@/i18n/catalogs";

export type FieldRow = {
  apiName: string;
  label: string;
  dataType: string;
  custom: boolean;
  /** Present when the row comes from the effective definition (editor mode). */
  id?: string;
  required?: boolean;
  readOnly?: boolean;
  /** False when the field is hidden from the default layout. */
  placed?: boolean;
};

/** Simple scalar types a custom field may use; everything else is not selectable. */
export const CUSTOM_FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "phone",
  "website",
  "integer",
  "currency",
  "double",
  "bigint",
  "boolean",
  "date",
  "datetime",
] as const satisfies readonly FieldDataType[];
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export function typeLabel(dataType: string): string {
  return TYPE_LABELS[dataType as FieldDataType] ?? dataType;
}

/** Letter-first API name derived from a display label. */
export function apiNameFromLabel(label: string): string {
  const words = label.match(/[A-Za-z0-9]+/g) ?? [];
  const name = words.map((w) => w[0]?.toUpperCase() + w.slice(1)).join("_");
  return /^[A-Za-z]/.test(name) ? name : name ? `Custom_${name}` : "";
}

export const ALLOWED_SETTINGS_MODULES = ["Leads", "Contacts", "Accounts", "Deals"] as const;
export type AllowedSettingsModule = (typeof ALLOWED_SETTINGS_MODULES)[number];

export function isAllowedSettingsModule(name: string): name is AllowedSettingsModule {
  return (ALLOWED_SETTINGS_MODULES as readonly string[]).includes(name);
}

export const SIDEBAR_MODULES = [
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Tasks",
  "Meetings",
  "Calls",
  "Products",
  "Quotes",
  "Sales Orders",
  "Purchase Orders",
  "Invoices",
  "Campaigns",
  "Vendors",
  "Price Books",
  "Cases",
  "Solutions",
];

export const MODULE_TABS = [
  "Layouts",
  "Layout Rules",
  "Validation Rules",
  "Fields",
  "Record Locking Configuration",
  "Map Dependency Fields",
  "Links",
  "Buttons",
  "Summary",
];

export const TYPE_LABELS: Record<FieldDataType, string> = {
  multireminder: "Reminder",
  ALARM: "Alarm",
  RRULE: "Recurrence",
  autonumber: "Auto Number",
  text: "Single Line",
  textarea: "Multi Line",
  email: "Email",
  phone: "Phone",
  website: "URL",
  picklist: "Pick List",
  integer: "Number",
  currency: "Currency",
  boolean: "Checkbox",
  date: "Date",
  datetime: "Date/Time",
  double: "Decimal",
  bigint: "Big Integer",
  lookup: "Lookup",
  ownerlookup: "Owner Lookup",
  profileimage: "Image",
  multi_module_lookup: "Multi-module Lookup",
};

export function fieldRowsFromMetadata(meta: ModuleMetadata): FieldRow[] {
  return meta.fields
    .map((f) => ({
      apiName: f.apiName,
      label: f.label,
      dataType: TYPE_LABELS[f.dataType] ?? f.dataType,
      custom: false,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));
}

export function filterFieldRows(rows: readonly FieldRow[], query: string): FieldRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter(
    (r) => !q || r.label.toLowerCase().includes(q) || r.dataType.toLowerCase().includes(q),
  );
}

/** Present the composite address once; its stored scalar fields keep their API identities. */
export function groupAddressRows(rows: readonly FieldRow[], module: string): FieldRow[] {
  if (module !== "Leads") return [...rows];
  const addressFields = new Set([
    "Street",
    "City",
    "State",
    "Country",
    "Zip_Code",
    "Latitude",
    "Longitude",
    "Address",
    "Coordinates",
    "Flat_House_No_Building_Apartment_Name",
    "Address_Latitude",
    "Address_Longitude",
  ]);
  const hasAddress = rows.some((row) => !row.custom && addressFields.has(row.apiName));
  if (!hasAddress)
    return rows.filter((row) => row.custom || !LEAD_LIST_HIDDEN_FIELDS.has(row.apiName));
  return [
    ...rows.filter(
      (row) =>
        row.custom ||
        (!addressFields.has(row.apiName) && !LEAD_LIST_HIDDEN_FIELDS.has(row.apiName)),
    ),
    {
      apiName: "Address",
      label: english.metadata.fields.Address,
      dataType: english.metadata.fields.Address,
      custom: false,
    },
  ];
}

const LEAD_LIST_HIDDEN_FIELDS = new Set([
  "Full_Name",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
  "Converted_Date_Time",
  "Lead_Conversion_Time",
  "Unsubscribed_Mode",
  "Unsubscribed_Time",
  "Change_Log_Time__s",
  "Converted__s",
  "Locked__s",
  "Last_Enriched_Time__s",
  "Enrich_Status__s",
  "nearby_distance__s",
  "Lead_Status_Modified_Time",
  "Tag",
  "Salutation",
]);

/** Explicit Turkish field-list order established by the captured settings inventory. */
export const LEAD_FIELD_LIST_ORDER = [
  "First_Name",
  "Address",
  "Description",
  "Connected_To__s",
  "Connected_To",
  "Mobile",
  "Rating",
  "Converted_Deal",
  "Converted_Account",
  "Converted_Contact",
  "Modified_By",
  "Email",
  "Email_Opt_Out",
  "Fax",
  "Lead_Status",
  "Owner",
  "Lead_Source",
  "Record_Image",
  "Lead_Image",
  "Created_By",
  "Industry",
  "Skype_ID",
  "Last_Name",
  "Phone",
  "Twitter",
  "Website",
  "Annual_Revenue",
  "No_of_Employees",
  "Designation",
  "Secondary_Email",
  "Company",
];
