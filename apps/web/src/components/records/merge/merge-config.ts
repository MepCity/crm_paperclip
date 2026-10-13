import type { FieldDefinition } from "@crm/core/records";
import type { ModuleMergeDefinition } from "@/modules/types";

export function resolveMergeCriterionFields(
  merge: ModuleMergeDefinition,
  fields: readonly FieldDefinition[],
): FieldDefinition[] {
  const byName = new Map(fields.map((field) => [field.apiName, field]));
  return merge.criterionFields
    .map((apiName) => byName.get(apiName))
    .filter((field): field is FieldDefinition => field !== undefined);
}

export function resolveMatchingTableColumns(
  merge: ModuleMergeDefinition | undefined,
  fields: readonly FieldDefinition[],
): FieldDefinition[] {
  const byName = new Map(fields.map((field) => [field.apiName, field]));
  const names = merge?.matchingColumns ?? [];
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
