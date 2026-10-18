import type { FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import type { ModuleKey } from "@/components/ui/later-module";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

/** System Defined Filters rows KL-17 - KL-22 in reference CRM order. */
const systemRows: readonly [string, ModuleKey?][] = [
  ["Latest Email Status", "M10"],
  ["Locked"],
  ["Record Action"],
  ["Related Records Action"],
  ["Touched Records"],
  ["Untouched Records"],
];

/** Visible field filter rows KL-24 - KL-31 followed by DOM-only catalog order. */
const initialFieldLabels = [
  "Account Name",
  "Case Number",
  "Case Origin",
  "Case Owner",
  "Case Reason",
  "Connected To",
  "Created By",
  "Created Time",
  "Deal Name",
  "Email",
  "Last Activity Time",
  "Modified By",
  "Modified Time",
  "No. of comments",
  "Phone",
  "Priority",
  "Product Name",
  "Related To",
  "Reported By",
  "Status",
  "Subject",
  "Tag",
  "Type",
];

const fieldModuleKeys: Readonly<Record<string, ModuleKey>> = {
  "Product Name": "P2",
};

const relatedModuleRows: readonly [string, ModuleKey][] = [
  ["Calls", "M5"],
  ["Emails", "M10"],
  ["Meetings", "M5"],
  ["Notes", "M6"],
  ["Tasks", "M5"],
];

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

export function buildCasesFilterGroups(input: Input): readonly FilterGroup[] {
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
    {
      id: "related",
      label: "Filter By Related Modules",
      items: relatedModuleRows.map(([label, moduleKey], index) => {
        // Evaluated on the server at import time: no client-only resolver; none of these keys is a live module.
        const laterModule = moduleKey;
        return {
          id: `related-${index}`,
          label,
          ...(laterModule ? { laterModule } : { disabled: true }),
        };
      }),
    },
  ];
}

export const casesFilterGroups = buildCasesFilterGroups({
  fields: [],
  users: [],
  linkField: "Subject",
  currencyCode: "TRY",
});
