import type { FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import type { ModuleKey } from "@/components/ui/later-module";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

/** System Defined Filters rows DL-17, DL-19, DL-20 - DL-25 in reference CRM order. */
const systemRows: readonly [string, ModuleKey?][] = [
  ["Activities"],
  ["Latest Email Status", "M10"],
  ["Locked"],
  ["Record Action"],
  ["Related Records Action"],
  ["Touched Records"],
  ["Untouched Records"],
  ["Cadences", "P3"],
];

/** Visible field filter rows in reference CRM capture (DL-27, DL-65 - DL-69). */
const initialFieldLabels = [
  "Account Name",
  "Amount",
  "Campaign Source",
  "Closing Date",
  "Connected To",
  "Contact Name",
];

function editor(field: FieldDefinition, input: Input): FilterEditorDefinition | undefined {
  const special =
    field.apiName === "Connected_To__s" ? "multilookup" : field.apiName === "Tag" ? "tag" : null;
  if (!special && !(field.dataType in filterOperators)) return undefined;
  const fieldType = special ?? (field.dataType as FilterFieldType);
  return {
    fieldType,
    ...(fieldType === "tag" ? { tagModule: "Deals" as const } : {}),
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

export function buildDealsFilterGroups(input: Input): readonly FilterGroup[] {
  const labels = new Map(
    input.fields.map((field) => [
      field.apiName === input.linkField ? "Deal Name" : field.label,
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
      items: systemRows.map(([label, laterModule], index) => {
        if (label === "Activities") {
          return {
            id: "Activities",
            label,
            systemEditor: "activities" as const,
          };
        }
        return {
          id: `system-${index}`,
          label,
          ...(laterModule ? { laterModule } : { disabled: true }),
        };
      }),
    },
    {
      id: "fields",
      label: "Filter By Fields",
      items: [...initialFieldLabels, ...remaining].map((label, index) => {
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

export const dealsFilterGroups = buildDealsFilterGroups({
  fields: [],
  users: [],
  linkField: "Deal_Name",
  currencyCode: "TRY",
});
