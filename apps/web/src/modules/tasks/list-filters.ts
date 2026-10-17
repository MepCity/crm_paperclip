import type { FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

/** System Defined Filters rows TL-20 - TL-24 in reference CRM order (no Activities, Cadences). */
const systemRows: readonly string[] = [
  "Locked",
  "Record Action",
  "Related Records Action",
  "Touched Records",
  "Untouched Records",
];

/** Difference rows 01-02: the reference field filter has no Description row, and Locked is a system filter. */
const hiddenFieldLabels: ReadonlySet<string> = new Set(["Description", "Locked"]);

function editor(field: FieldDefinition, input: Input): FilterEditorDefinition | undefined {
  const special =
    field.apiName === "Connected_To__s" ? "multilookup" : field.apiName === "Tag" ? "tag" : null;
  if (!special && !(field.dataType in filterOperators)) return undefined;
  const fieldType = special ?? (field.dataType as FilterFieldType);
  return {
    fieldType,
    ...(fieldType === "picklist"
      ? {
          options: field.picklist?.map((option) => ({
            id: option.storedValue,
            label: option.displayValue,
          })),
        }
      : {}),
    ...(fieldType === "ownerlookup"
      ? {
          options: input.users.map((user) => ({
            id: user.userId,
            label: user.name,
            ...(user.email ? { detail: user.email } : {}),
          })),
        }
      : {}),
    ...(fieldType === "currency" ? { currencyCode: input.currencyCode } : {}),
  };
}

/**
 * Filter By Fields (TL-26, TL-53 - TL-61, TL-66): the field labels in the panel's own
 * alphabetical order, so Closed Time ... Priority, Related To, Status, Subject, Tag, Task Owner.
 * There is no Filter By Related Modules group.
 */
export function buildTasksFilterGroups(input: Input): readonly FilterGroup[] {
  const labels = new Map(
    input.fields
      .filter((field) => !hiddenFieldLabels.has(field.label))
      .map((field) => [field.label, field]),
  );
  return [
    {
      id: "system",
      label: "System Defined Filters",
      items: systemRows.map((label, index) => ({
        id: `system-${index}`,
        label,
        disabled: true,
      })),
    },
    {
      id: "fields",
      label: "Filter By Fields",
      items: [...labels.keys()].sort().map((label, index) => {
        const field = labels.get(label);
        const definition = field ? editor(field, input) : undefined;
        return {
          id: field?.apiName ?? `field-${index}`,
          label,
          ...(definition ? { editor: definition } : { disabled: true }),
        };
      }),
    },
  ];
}

export const tasksFilterGroups = buildTasksFilterGroups({
  fields: [],
  users: [],
  linkField: "Subject",
  currencyCode: "TRY",
});
