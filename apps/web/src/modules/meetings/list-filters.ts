import type { FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import type { ModuleKey } from "@/components/ui/later-module";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

/** System Defined Filters rows ML-15 - ML-18 in reference CRM order (no Locked, Activities, Latest Email Status, Cadences). */
const systemRows: readonly string[] = [
  "Record Action",
  "Related Records Action",
  "Touched Records",
  "Untouched Records",
];

/** Visible field filter rows in reference CRM capture (ML-20 - ML-29). */
const initialFieldLabels = [
  "All day",
  "Check-In Address",
  "Check-In By",
  "Check-In City",
  "Check-In Country",
  "Check-In State",
  "Check-In Sub-Locality",
  "Check-In Time",
  "Checked In Status",
  "Contact Name",
];

/** Module keys from inventory for Filter By Fields. All 10 visible fields are M5 (current module). */
const fieldModuleKeys: Readonly<Record<string, ModuleKey>> = {};

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

export function buildMeetingsFilterGroups(input: Input): readonly FilterGroup[] {
  const labels = new Map(
    input.fields.map((field) => [field.apiName === input.linkField ? "Title" : field.label, field]),
  );
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
        disabled: true,
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

export const meetingsFilterGroups = buildMeetingsFilterGroups({
  fields: [],
  users: [],
  linkField: "Event_Title",
  currencyCode: "TRY",
});
