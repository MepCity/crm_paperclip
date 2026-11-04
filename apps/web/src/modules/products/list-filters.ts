import type { FieldDefinition, RelatedFilterModule } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import type { ModuleKey } from "@/components/ui/later-module";
import { type FilterFieldType, filterOperators } from "@/lib/records/filter-operators";
import type { ModuleScreenDefinition } from "../types";

type Input = Parameters<ModuleScreenDefinition["buildFilterGroups"]>[0];

/** System Defined Filters rows in reference CRM order. */
const systemRows: readonly [string, ModuleKey?][] = [
  ["Latest Email Status", "M10"],
  ["Locked"],
  ["Record Action"],
  ["Related Records Action"],
  ["Touched Records"],
  ["Untouched Records"],
];

const initialFieldLabels = [
  "Commission Rate",
  "Created By",
  "Created Time",
  "Description",
  "Handler",
  "Last Activity Time",
  "Manufacturer",
  "Modified By",
  "Modified Time",
  "Product Active",
  "Product Category",
  "Product Code",
  "Product Name",
  "Product Owner",
  "Qty Ordered",
  "Quantity in Demand",
  "Quantity in Stock",
  "Reorder Level",
  "Sales End Date",
  "Sales Start Date",
  "Support End Date",
  "Support Start Date",
  "Tag",
  "Tax",
  "Taxable",
  "Unit Price",
  "Usage Unit",
  "Vendor Name",
];

const fieldModuleKeys: Readonly<Record<string, ModuleKey>> = {
  "Vendor Name": "P2",
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
      "Participants",
      "Remind At",
      "Repeat",
      "Tag",
      "Title",
      "To",
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
      "Note Content",
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
      "Description",
      "Due Date",
      "Last Activity Time",
      "Modified By",
      "Modified Time",
      "Priority",
      "Remind At",
      "Repeat",
      "Status",
      "Subject",
      "Tag",
      "Task Owner",
    ],
  },
];

function editor(field: FieldDefinition, input: Input): FilterEditorDefinition | undefined {
  if (field.apiName === "Vendor_Name") {
    return undefined;
  }
  const special =
    field.apiName === "Connected_To__s" ? "multilookup" : field.apiName === "Tag" ? "tag" : null;
  if (
    !special &&
    field.dataType !== "autonumber" &&
    field.dataType !== "multiselectpicklist" &&
    !(field.dataType in filterOperators)
  )
    return undefined;

  const fieldType =
    special ??
    (field.dataType === "autonumber"
      ? "text"
      : field.dataType === "multiselectpicklist"
        ? "picklist"
        : (field.dataType as FilterFieldType));

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

export function buildProductsFilterGroups(input: Input): readonly FilterGroup[] {
  const labels = new Map(
    input.fields.map((field) => [
      field.apiName === input.linkField ? "Product Name" : field.label,
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
                parentLabel: "Products",
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

export const productsFilterGroups: readonly FilterGroup[] = buildProductsFilterGroups({
  fields: [],
  linkField: "Product_Name",
  users: [],
  currencyCode: "TRY",
});
