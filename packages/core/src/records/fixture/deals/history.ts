import type { FieldDefinition, ListView, ModuleMetadata, RecordData } from "../../contract";
import { dealsPicklists } from "./picklists";

const definitions: [string, string, FieldDefinition["dataType"], number, boolean][] = [
  ["Potential_Name", "Deal Name", "lookup", 120, false],
  ["Stage", "Stage", "picklist", 120, false],
  ["Stage_Duration_Calendar_Days", "Stage Duration (Calendar Days)", "integer", 50, false],
  ["Modified_By", "Modified By", "ownerlookup", 120, false],
  ["Modified_Time", "Modified Time", "datetime", 120, false],
  ["Amount", "Amount", "currency", 16, false],
  ["Probability", "Probability (%)", "integer", 3, false],
  ["Expected_Revenue", "Expected Revenue", "currency", 16, true],
  ["Closing_Date", "Closing Date", "date", 20, false],
  ["id", "Record Id", "bigint", 18, true],
  ["Last_Activity_Time", "Last Activity Time", "datetime", 120, true],
  ["Moved_To__s", "Moved To", "picklist", 120, true],
];
export const historyMetadata: ModuleMetadata = {
  apiName: "DealHistory",
  singularLabel: "Stage History",
  pluralLabel: "Stage History",
  businessCardFields: [],
  fields: definitions.map(([apiName, label, dataType, maxLength, readOnly]) => ({
    apiName,
    label,
    dataType,
    maxLength,
    readOnly,
    required: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: false, edit: false, quickCreate: false },
    ...(dataType === "picklist" ? { picklist: dealsPicklists.Stage } : {}),
    ...(dataType === "lookup" ? { lookup: { module: "Deals" } } : {}),
  })),
  layout: [
    {
      label: "Stage History",
      columnCount: 1,
      columns: [definitions.map(([name]) => name)],
      fields: definitions.map(([name]) => name),
    },
  ],
};
export const historyViews: readonly ListView[] = [
  {
    id: "all-deal-history",
    name: "All Stage History",
    systemDefined: true,
    isDefault: true,
    columns: definitions.map(([name]) => name),
    criteria: null,
    sort: { field: "Modified_Time", order: "desc" },
  },
];

export function historyRow(deal: RecordData, id: string): RecordData {
  const fields = Object.fromEntries(definitions.map(([name]) => [name, deal.fields[name] ?? null]));
  Object.assign(fields, {
    id,
    Potential_Name: { module: "Deals", id: deal.id },
    Stage_Duration_Calendar_Days: null,
    Moved_To__s: null,
    Last_Activity_Time: null,
  });
  return { id, fields };
}
export function calendarDays(from: string, to: string): number {
  return (Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / 86_400_000;
}
