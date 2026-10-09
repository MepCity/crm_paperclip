import type { FieldDataType, FieldDefinition } from "@crm/core/records";
import type { FilterEditorDefinition } from "@/components/records/list/filter-editor";
import type { FilterGroup } from "@/components/records/list/filter-panel";
import type { FilterFieldType } from "@/lib/records/filter-operators";
import { filterOperators } from "@/lib/records/filter-operators";

const systemDefinedItems = [
  "Activities",
  "Campaigns",
  "Latest Email Status",
  "Locked",
  "Record Action",
  "Related Records Action",
  "Touched Records",
  "Untouched Records",
  "Cadences",
];

export const leadsFieldFilterLabels =
  `Address;Address - City;Address - Country / Region;Address - Flat / House No./ Building / Apartment Name;Address - State / Province;Address - Street Address;Address - Zip / Postal Code;Annual Revenue;Company;Connected To;Converted Account;Converted Contact;Converted Deal;Created By;Created Time;Email;Email Opt Out;Fax;First Name;Industry;Last Activity Time;Last Name;Lead Conversion Time;Lead Name;Lead Owner;Lead Source;Lead Status;Mobile;Modified By;Modified Time;No. of Employees;Phone;Rating;Salutation;Secondary Email;Skype ID;Tag;Title;Twitter;Unsubscribed Mode;Unsubscribed Time;Website`.split(
    ";",
  );

const relatedModuleLabels =
  `Accounts (Connected Records);Calls;Campaigns (Connected Records);Cases (Connected Records);Contacts (Connected Records);Deals (Connected Records);Emails;Invitees (Invited Meetings);Invoices (Connected Records);Lead Product Relation (Products);Meetings;Notes;Products (Connected Records);Purchase Orders (Connected Records);Quotes (Connected Records);Sales Orders (Connected Records);Solutions (Connected Records);Tasks;Vendors (Connected Records)`.split(
    ";",
  );

const disabledDataTypes = new Set<FieldDataType>([
  "textarea",
  "lookup",
  "multi_module_lookup",
  "double",
  "bigint",
  "profileimage",
]);

function disabledItems(labels: readonly string[], prefix: string) {
  return labels.map((label, index) => ({
    id: `${prefix}-${index}`,
    label,
    disabled: true,
  }));
}

function filterFieldType(dataType: FieldDataType): FilterFieldType | null {
  if (disabledDataTypes.has(dataType)) return null;
  if (dataType in filterOperators) return dataType as FilterFieldType;
  return null;
}

function editorForField(
  field: FieldDefinition,
  users: readonly { userId: string; name: string; email?: string }[],
  currencyCode: string,
): FilterEditorDefinition | undefined {
  const fieldType = filterFieldType(field.dataType);
  if (!fieldType) return undefined;
  const editor: FilterEditorDefinition = { fieldType };
  if (fieldType === "picklist" && field.picklist) {
    editor.options = field.picklist.map((option) => ({
      id: option.storedValue,
      label: option.displayValue,
    }));
  }
  if (fieldType === "ownerlookup") {
    editor.options = users.map((user) => ({
      id: user.userId,
      label: user.name,
      ...(user.email ? { detail: user.email } : {}),
    }));
  }
  if (fieldType === "currency") {
    editor.currencyCode = currencyCode;
  }
  return editor;
}

export interface BuildLeadsFilterGroupsInput {
  fields: readonly FieldDefinition[];
  users: readonly { userId: string; name: string; email?: string }[];
  linkField: string;
  currencyCode: string;
}

export function buildLeadsFilterGroups(input: BuildLeadsFilterGroupsInput): readonly FilterGroup[] {
  const byLabel = new Map(input.fields.map((field) => [field.label, field]));

  function resolveField(label: string): FieldDefinition | undefined {
    if (label === "Lead Name") {
      return input.fields.find((field) => field.apiName === input.linkField);
    }
    return byLabel.get(label);
  }

  const fieldItems = leadsFieldFilterLabels.map((label, index) => {
    if (label === "Tag") {
      return { id: `field-${index}`, label, disabled: true };
    }
    const field = resolveField(label);
    if (!field) {
      return { id: `field-${index}`, label, disabled: true };
    }
    const editor = editorForField(field, input.users, input.currencyCode);
    if (!editor) {
      return { id: `field-${index}`, label, disabled: true };
    }
    return { id: field.apiName, label, editor };
  });

  return [
    {
      id: "system",
      label: "System Defined Filters",
      items: disabledItems(systemDefinedItems, "system"),
    },
    {
      id: "fields",
      label: "Filter By Fields",
      items: fieldItems,
    },
    {
      id: "related",
      label: "Filter By Related Modules",
      items: disabledItems(relatedModuleLabels, "related"),
    },
  ];
}

function disabledFieldItems(labels: readonly string[]) {
  return labels.map((label, index) => ({
    id: `field-${index}`,
    label,
    disabled: true,
  }));
}

/** Fallback groups before metadata resolves; the list page supplies built groups. */
export const leadsFilterGroups: readonly FilterGroup[] = [
  {
    id: "system",
    label: "System Defined Filters",
    items: disabledItems(systemDefinedItems, "system"),
  },
  {
    id: "fields",
    label: "Filter By Fields",
    items: disabledFieldItems(leadsFieldFilterLabels),
  },
  {
    id: "related",
    label: "Filter By Related Modules",
    items: disabledItems(relatedModuleLabels, "related"),
  },
];
