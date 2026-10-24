import type { FieldDataType, ModuleMetadata } from "@crm/core/records";

export type FieldRow = { apiName: string; label: string; dataType: string; custom: boolean };

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

const TYPE_LABELS: Record<FieldDataType, string> = {
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
