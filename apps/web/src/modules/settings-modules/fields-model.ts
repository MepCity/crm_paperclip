import type { FieldDataType, ModuleMetadata } from "@crm/core/records";

export type FieldRow = { apiName: string; label: string; dataType: string; custom: boolean };

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
