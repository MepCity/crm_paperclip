import type { FieldDefinition } from "@crm/core/records";

export interface SortFieldOption {
  apiName: string;
  label: string;
}

export interface SortFieldLabelConfig {
  sortFieldLabels: readonly string[];
  linkField: string;
  linkFieldLabel: string;
}

/**
 * Resolves the module's ordered Sort By labels against field metadata. A label with no
 * metadata field is dropped, so the list never offers a field the module does not have.
 */
export function resolveSortFieldLabels(
  config: SortFieldLabelConfig,
  fields: readonly FieldDefinition[],
): SortFieldOption[] {
  const byLabel = new Map<string, FieldDefinition>();
  const byApiName = new Map<string, FieldDefinition>();
  for (const field of fields) {
    if (!byLabel.has(field.label)) byLabel.set(field.label, field);
    if (!byApiName.has(field.apiName)) byApiName.set(field.apiName, field);
  }
  const options: SortFieldOption[] = [];
  for (const label of config.sortFieldLabels) {
    const field =
      label === config.linkFieldLabel ? byApiName.get(config.linkField) : byLabel.get(label);
    if (!field) continue;
    options.push({ apiName: field.apiName, label });
  }
  return options;
}
