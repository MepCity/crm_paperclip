import type { FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import type { ModuleKey } from "@/components/ui/later-module";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import { systemFilterProps } from "../system-filter-props";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

/** System Defined Filters rows CL-15 - CL-18 in reference CRM order. */
const systemRows: readonly [string, ModuleKey?][] = [
  ["Record Action"],
  ["Related Records Action"],
  ["Touched Records"],
  ["Untouched Records"],
];

/** Visible field filter rows in reference CRM capture (CL-20 - CL-29). */
const initialFieldLabels = [
  "Call Agenda",
  "Call Duration",
  "Call Duration (in seconds)",
  "Call Owner",
  "Call Purpose",
  "Call Result",
  "Call Start Time",
  "Call Type",
  "Caller ID",
  "Contact Name",
];

/** Module keys from inventory for Filter By Fields (CL-20 - CL-29 are all M5). */
const fieldModuleKeys: Readonly<Record<string, ModuleKey>> = {};

function editor(field: FieldDefinition, input: Input): FilterEditorDefinition | undefined {
  const special = field.apiName === "Tag" ? "tag" : null;
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

export function buildCallsFilterGroups(input: Input): readonly FilterGroup[] {
  const labels = new Map(
    input.fields.map((field) => [
      field.apiName === input.linkField ? "Subject" : field.label,
      field,
    ]),
  );
  const remaining = [...labels.keys()]
    .filter((label) => !initialFieldLabels.includes(label))
    .sort();
  return [
    {
      id: "system",
      label: "System Defined Filters",
      items: systemRows.map(([label, laterModule], index) => ({
        id: `system-${index}`,
        label,
        ...(laterModule
          ? { laterModule }
          : (systemFilterProps(label, "Calls") ?? { disabled: true })),
      })),
    },
    {
      id: "fields",
      label: "Filter By Fields",
      items: [...initialFieldLabels, ...remaining].map((label, index) => {
        const field = labels.get(label);
        const definition = field ? editor(field, input) : undefined;
        const laterModule = fieldModuleKeys[label];
        return {
          id: field?.apiName ?? `field-${index}`,
          label,
          ...(definition ? { editor: definition } : { disabled: true }),
          ...(laterModule ? { laterModule } : {}),
        };
      }),
    },
  ];
}

export const callsFilterGroups = buildCallsFilterGroups({
  fields: [],
  users: [],
  linkField: "Subject",
  currencyCode: "TRY",
});
