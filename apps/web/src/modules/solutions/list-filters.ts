import type { FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import type { ModuleKey } from "@/components/ui/later-module";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

/** System Defined Filters rows SL-17 - SL-21 in reference CRM order (no Latest Email Status). */
const systemRows: readonly [string, ModuleKey?][] = [
  ["Locked"],
  ["Record Action"],
  ["Related Records Action"],
  ["Touched Records"],
  ["Untouched Records"],
];

/** Visible field filter rows in reference CRM capture (SL-23 - SL-31). */
const initialFieldLabels = [
  "Connected To",
  "Created By",
  "Created Time",
  "Last Activity Time",
  "Modified By",
  "Modified Time",
  "No. of comments",
  "Product Name",
  "Solution Number",
];

const fieldModuleKeys: Readonly<Record<string, ModuleKey>> = {
  "Product Name": "P2",
};

function editor(field: FieldDefinition, input: Input): FilterEditorDefinition | undefined {
  if (field.apiName === "Product_Name") {
    // Unregistered target Products (P2): no text-match editor, drawn with laterModule="P2"
    return undefined;
  }
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

export function buildSolutionsFilterGroups(input: Input): readonly FilterGroup[] {
  const labels = new Map(
    input.fields.map((field) => [
      field.apiName === input.linkField ? "Solution Title" : field.label,
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
      items: systemRows.map(([label, moduleKey], index) => {
        // Evaluated on the server at import time: no client-only resolver; none of these keys is a live module.
        const laterModule = moduleKey;
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

export const solutionsFilterGroups = buildSolutionsFilterGroups({
  fields: [],
  users: [],
  linkField: "Solution_Title",
  currencyCode: "TRY",
});
