import type { FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import { systemFilterProps } from "../system-filter-props";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

/** System Defined Filters rows CL-17 - CL-20; Activities, Locked and Cadences are absent. */
const systemLabels = [
  "Record Action",
  "Related Records Action",
  "Touched Records",
  "Untouched Records",
] as const;

/** Visible field filter rows in the reference CRM capture (CL-22 - CL-31). */
const initialFieldLabels = [
  "Actual Cost",
  "Budgeted Cost",
  "Campaign Name",
  "Campaign Owner",
  "Connected To",
  "Created By",
  "Created Time",
  "End Date",
  "Expected Response",
  "Expected Revenue",
];

function editor(field: FieldDefinition, input: Input): FilterEditorDefinition | undefined {
  const special =
    field.apiName === "Connected_To__s" ? "multilookup" : field.apiName === "Tag" ? "tag" : null;
  // bigint columns (Expected Response, Numbers sent) filter like the other number fields.
  const dataType = field.dataType === "bigint" ? "integer" : field.dataType;
  if (!special && !(dataType in filterOperators)) return undefined;
  const fieldType = special ?? (dataType as FilterFieldType);
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

export function buildCampaignsFilterGroups(input: Input): readonly FilterGroup[] {
  const labels = new Map(
    input.fields.map((field) => [
      field.apiName === input.linkField ? "Campaign Name" : field.label,
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
      items: systemLabels.map((label, index) => ({
        id: `system-${index}`,
        label,
        ...(systemFilterProps(label, "Campaigns") ?? { disabled: true }),
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

export const campaignsFilterGroups = buildCampaignsFilterGroups({
  fields: [],
  users: [],
  linkField: "Campaign_Name",
  currencyCode: "TRY",
});
