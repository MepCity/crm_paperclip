import type { FieldDefinition, ModuleApiName } from "@crm/core/records";

/** Interim criterion field order (MEP-352); rows missing from metadata are skipped. */
export const MERGE_CRITERION_FIELDS: Readonly<Record<ModuleApiName, readonly string[]>> = {
  Contacts: ["First_Name", "Last_Name", "Email", "Phone", "Mobile", "Account_Name"],
  Leads: ["First_Name", "Last_Name", "Email", "Phone", "Mobile", "Company"],
};

export const MERGE_MATCHING_COLUMNS: Readonly<Record<ModuleApiName, readonly string[]>> = {
  Leads: [
    "Full_Name",
    "Company",
    "Email",
    "Phone",
    "Mobile",
    "Created_Time",
    "Modified_Time",
    "Owner",
  ],
  Contacts: [
    "Full_Name",
    "Account_Name",
    "Email",
    "Phone",
    "Mobile",
    "Created_Time",
    "Modified_Time",
    "Owner",
  ],
};

export function resolveMergeCriterionFields(
  module: ModuleApiName,
  fields: readonly FieldDefinition[],
): FieldDefinition[] {
  const byName = new Map(fields.map((field) => [field.apiName, field]));
  const names = MERGE_CRITERION_FIELDS[module] ?? [];
  return names
    .map((apiName) => byName.get(apiName))
    .filter((field): field is FieldDefinition => field !== undefined);
}

export function resolveMatchingTableColumns(
  module: ModuleApiName,
  fields: readonly FieldDefinition[],
): FieldDefinition[] {
  const byName = new Map(fields.map((field) => [field.apiName, field]));
  const names = MERGE_MATCHING_COLUMNS[module] ?? [];
  const resolved = names
    .map((apiName) => byName.get(apiName))
    .filter((field): field is FieldDefinition => field !== undefined);
  if (resolved.length > 0) return resolved;
  return fields.filter((field) => field.apiName !== "id").slice(0, 8);
}

export const MERGE_CONFIRM_TITLE = "Merge Records";
export const MERGE_CONFIRM_MESSAGE =
  "Are you sure you want to merge the selected records? This action cannot be undone.";

export const MERGE_SUCCESS_TITLE = "Records merged";
export const MERGE_SUCCESS_MESSAGE = "The selected records were merged successfully.";
