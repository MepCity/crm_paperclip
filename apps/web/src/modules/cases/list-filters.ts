import type { FieldDefinition, RelatedFilterModule } from "@crm/core/records";
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

const relatedModuleRows: readonly {
  label: string;
  laterModule?: ModuleKey;
  module?: RelatedFilterModule;
  fieldModule?: string;
  fieldLabels?: readonly string[];
}[] = [
  {
    label: "Calls",
    module: "Calls",
    fieldModule: "Calls",
    fieldLabels: [
      "Call Agenda",
      "Call Duration",
      "Call Duration (in seconds)",
      "Call Owner",
      "Call Purpose",
      "Call Result",
      "Call Start Time",
      "Call Type",
      "Caller ID",
      "Created By",
      "Created Time",
      "Dialled Number",
      "Last Activity Time",
      "Modified By",
      "Modified Time",
      "Outgoing Call Status",
      "Scheduled in CRM",
      "Subject",
      "Tag",
    ],
  },
  { label: "Emails", laterModule: "M10" },
  {
    label: "Meetings",
    module: "Meetings",
    fieldModule: "Events",
    fieldLabels: [
      "All day",
      "Check-In Address",
      "Check-In By",
      "Check-In City",
      "Check-In Country",
      "Check-In State",
      "Check-In Sub-Locality",
      "Check-In Time",
      "Checked In Status",
      "Created By",
      "Created Time",
      "From",
      "Host",
      "Last Activity Time",
      "Location",
      "Meeting Venue",
      "Modified By",
      "Modified Time",
      "Provider",
      "Tag",
      "Title",
      "To",
      "Zip Code",
    ],
  },
  {
    label: "Notes",
    module: "Notes",
    fieldModule: "Notes",
    fieldLabels: [
      "Created By",
      "Created Time",
      "Modified By",
      "Modified Time",
      "Note Owner",
      "Note Title",
    ],
  },
  {
    label: "Tasks",
    module: "Tasks",
    fieldModule: "Tasks",
    fieldLabels: [
      "Closed Time",
      "Created By",
      "Created Time",
      "Due Date",
      "Last Activity Time",
      "Modified By",
      "Modified Time",
      "Priority",
      "Status",
      "Subject",
      "Tag",
      "Task Owner",
    ],
  },
];

function editor(field: FieldDefinition, input: Input): FilterEditorDefinition | undefined {
  if (field.apiName === "Product_Name") {
    // Unregistered target Products (P2): no text-match editor, drawn with laterModule="P2"
    return undefined;
  }
  const special =
    field.apiName === "Connected_To__s" ? "multilookup" : field.apiName === "Tag" ? "tag" : null;
  if (!special && field.dataType !== "autonumber" && !(field.dataType in filterOperators))
    return undefined;
  // Autonumbers (Solution/Case Number) match as text.
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
      items: systemRows.map(([label, moduleKey], index) => ({
        id: `system-${index}`,
        label,
        ...(moduleKey
          ? { laterModule: moduleKey }
          : {
              systemEditor: (
                {
                  Locked: "locked",
                  "Record Action": "record_action",
                  "Related Records Action": "related_records_action",
                  "Touched Records": "touched",
                  "Untouched Records": "untouched",
                } as const
              )[
                label as
                  | "Locked"
                  | "Record Action"
                  | "Related Records Action"
                  | "Touched Records"
                  | "Untouched Records"
              ],
              systemOptions: {
                relatedModules: [
                  { id: "Notes", label: "Notes" },
                  { id: "Attachments", label: "Attachments" },
                  { id: "Tasks", label: "Tasks" },
                  { id: "Events", label: "Meetings" },
                  { id: "Calls", label: "Calls" },
                ],
              },
            }),
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
    {
      id: "related",
      label: "Filter By Related Modules",
      items: relatedModuleRows.map((row, index) => ({
        id: `related-${index}`,
        label: row.label,
        ...(row.module && row.fieldModule && row.fieldLabels
          ? {
              relatedModule: {
                module: row.module,
                fieldModule: row.fieldModule,
                parentLabel: "Cases",
                fieldLabels: row.fieldLabels,
              },
            }
          : row.laterModule
            ? { laterModule: row.laterModule }
            : { disabled: true }),
      })),
    },
  ];
}

export const casesFilterGroups = buildCasesFilterGroups({
  fields: [],
  users: [],
  linkField: "Subject",
  currencyCode: "TRY",
});
