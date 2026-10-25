import type { FieldDefinition } from "@crm/core/records";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import type { FilterEditorDefinition } from "./filter-editor";
import type { FilterGroup, FilterItem } from "./filter-panel";

/** Keep module-specific editors, but resolve every field row against the active schema. */
export function effectiveFilterGroups(
  groups: readonly FilterGroup[],
  fields: readonly FieldDefinition[],
  linkField: string,
  linkLabel: string,
): FilterGroup[] {
  const visible = fields.filter((field) => field.views.view);
  return groups.map((group) => {
    if (group.id !== "fields") return group;
    const used = new Set<string>();
    const items = group.items.flatMap((item): FilterItem[] => {
      const field = visible.find(
        (field) =>
          field.apiName === item.id ||
          field.label === item.label ||
          (item.label === linkLabel && field.apiName === linkField),
      );
      if (!field) return [];
      used.add(field.apiName);
      return [{ ...item, id: field.apiName, label: field.label }];
    });
    for (const field of visible) {
      if (used.has(field.apiName)) continue;
      let editor: FilterEditorDefinition | undefined;
      if (Object.hasOwn(filterOperators, field.dataType)) {
        editor = { fieldType: field.dataType as FilterFieldType };
        if (field.picklist)
          editor.options = field.picklist.map((option) => ({
            id: option.storedValue,
            label: option.displayValue,
          }));
      }
      items.push({
        id: field.apiName,
        label: field.label,
        ...(editor ? { editor } : { disabled: true }),
      });
    }
    return { ...group, items };
  });
}

export function effectiveColumns(
  names: readonly string[],
  fields: readonly FieldDefinition[],
): FieldDefinition[] {
  const byName = new Map(
    fields.filter((field) => field.views.view).map((field) => [field.apiName, field]),
  );
  return names.flatMap((name) => {
    const field = byName.get(name);
    return field ? [field] : [];
  });
}
