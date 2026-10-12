import type {
  Comparator,
  Criteria,
  FieldDefinition,
  FieldValue,
  RecordData,
} from "@crm/core/records";

export type MergeGroupOperator = "and" | "or";

export interface MergeCriterionRow {
  id: string;
  fieldApiName: string;
  comparator: Comparator;
  value: string;
}

export function comparatorForField(field: FieldDefinition): Comparator {
  if (field.dataType === "text" || field.dataType === "textarea" || field.dataType === "email") {
    return "contains";
  }
  return "equal";
}

export function fieldValueToCriterionString(value: FieldValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name;
  }
  return "";
}

export function initialCriterionRows(
  fields: readonly FieldDefinition[],
  source: RecordData,
): MergeCriterionRow[] {
  return fields.map((field, index) => ({
    id: `criterion-${index}`,
    fieldApiName: field.apiName,
    comparator: comparatorForField(field),
    value: fieldValueToCriterionString(source.fields[field.apiName]),
  }));
}

export function buildMergeSearchCriteria(
  rows: readonly MergeCriterionRow[],
  groupOperator: MergeGroupOperator,
): Criteria | undefined {
  const active = rows.filter((row) => row.value.trim().length > 0);
  if (active.length === 0) return undefined;
  const group: Criteria[] = active.map((row) => ({
    field: row.fieldApiName,
    comparator: row.comparator,
    value: row.value.trim(),
  }));
  if (group.length === 1) return group[0];
  return { groupOperator, group };
}
