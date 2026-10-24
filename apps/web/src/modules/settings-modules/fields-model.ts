import type { FieldDataType, ModuleMetadata } from "@crm/core/records";

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
  return meta.fields.map((f) => ({
    apiName: f.apiName,
    label: f.label,
    dataType: TYPE_LABELS[f.dataType] ?? f.dataType,
    custom: false,
  }));
}

export function filterFieldRows(rows: readonly FieldRow[], query: string): FieldRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter(
    (r) => !q || r.label.toLowerCase().includes(q) || r.dataType.toLowerCase().includes(q),
  );
}
