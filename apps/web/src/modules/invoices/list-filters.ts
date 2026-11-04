import type { FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

const systemEditors = {
  Locked: "locked",
  "Record Action": "record_action",
  "Related Records Action": "related_records_action",
  "Touched Records": "touched",
  "Untouched Records": "untouched",
} as const;

const systemRows = Object.keys(systemEditors) as (keyof typeof systemEditors)[];

/** Leading field rows; the remaining fields follow alphabetically. */
const initialFieldLabels = [
  "Account Name",
  "Contact Name",
  "Created By",
  "Created Time",
  "Due Date",
  "Grand Total",
  "Invoice Date",
  "Invoice Number",
  "Modified By",
  "Modified Time",
  "Status",
  "Subject",
];

function editor(field: FieldDefinition, input: Input): FilterEditorDefinition | undefined {
  const special =
    field.apiName === "Connected_To__s" ? "multilookup" : field.apiName === "Tag" ? "tag" : null;
  if (!special && field.dataType !== "autonumber" && !(field.dataType in filterOperators))
    return undefined;
  const fieldType =
    special ?? (field.dataType === "autonumber" ? "text" : (field.dataType as FilterFieldType));
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

export function buildInvoicesFilterGroups(input: Input): readonly FilterGroup[] {
  const labels = new Map(input.fields.map((field) => [field.label, field]));
  const remaining = [...labels.keys()]
    .filter((label) => !initialFieldLabels.includes(label))
    .sort();

  return [
    {
      id: "system",
      label: "System Defined Filters",
      items: systemRows.map((label, index) => ({
        id: `system-${index}`,
        label,
        systemEditor: systemEditors[label],
        systemOptions: {
          relatedModules: [
            { id: "Notes", label: "Notes" },
            { id: "Attachments", label: "Attachments" },
          ],
        },
      })),
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

export const invoicesFilterGroups = buildInvoicesFilterGroups({
  fields: [],
  users: [],
  linkField: "Subject",
  currencyCode: "TRY",
});
