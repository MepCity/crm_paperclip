import type {
  FieldDefinition,
  ModuleMetadata,
  ModuleRecordReference,
  RecordData,
} from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";
import { resolveModuleScreenByApiName } from "@/modules/registry";

function visible(field: FieldDefinition, record: RecordData) {
  return field.views.view && Object.hasOwn(record.fields, field.apiName);
}

/** Field order for Tasks business card: Priority, Due Date, Status, Related To, Task Owner (TD-36 – TD-40). */
export const TASKS_BUSINESS_CARD_FIELDS = [
  "Priority",
  "Due_Date",
  "Status",
  "What_Id",
  "Owner",
] as const;

/** Known singular labels for modules that may not yet be loaded in the client registry. */
const KNOWN_MODULE_SINGULAR_LABELS: Readonly<Record<string, string>> = {
  Leads: "Lead",
  Contacts: "Contact",
  Accounts: "Account",
  Deals: "Deal",
  Tasks: "Task",
  Events: "Meeting",
  Meetings: "Meeting",
  Calls: "Call",
  Campaigns: "Campaign",
  Cases: "Case",
  Solutions: "Solution",
  Products: "Product",
  Vendors: "Vendor",
  Price_Books: "Price Book",
  Quotes: "Quote",
  Sales_Orders: "Sales Order",
  Purchase_Orders: "Purchase Order",
  Invoices: "Invoice",
};

/**
 * Produces the unlinked module suffix for the What_Id relation (e.g. singular module label).
 * Used by record detail rendering to display alongside the related record link (TD-39, TD-46).
 */
export function taskRelatedToSuffix(record: RecordData): string | undefined {
  const what = record.fields.What_Id;
  if (!what || typeof what !== "object" || Array.isArray(what)) {
    return undefined;
  }
  const ref = what as Partial<ModuleRecordReference>;
  if (!ref.module || typeof ref.module !== "string") {
    return undefined;
  }
  if (!ref.id && (!ref.name || ref.name.trim() === "")) {
    return undefined;
  }
  const screen = resolveModuleScreenByApiName(ref.module);
  if (screen?.singularLabel) {
    return screen.singularLabel;
  }
  return KNOWN_MODULE_SINGULAR_LABELS[ref.module] ?? ref.module;
}

/**
 * Builds business card fields in the order supplied by service metadata,
 * falling back to TASKS_BUSINESS_CARD_FIELDS when metadata businessCardFields is empty.
 */
export function buildTasksBusinessCardFields(
  module: ModuleMetadata,
  record: RecordData,
): BusinessCardField[] {
  const cardNames =
    module.businessCardFields.length > 0 ? module.businessCardFields : TASKS_BUSINESS_CARD_FIELDS;

  return cardNames.flatMap((name) => {
    const field = module.fields.find((candidate) => candidate.apiName === name);
    if (!field || !visible(field, record)) return [];
    const valueSuffix = name === "What_Id" ? taskRelatedToSuffix(record) : undefined;
    return [{ field, value: record.fields[name] ?? null, ...(valueSuffix ? { valueSuffix } : {}) }];
  });
}

/**
 * Builds detail sections from service layout (Task Information, Description Information).
 * Filters out Task Image layout section if present.
 * Does not include address grouping or status ribbon.
 */
export function buildTasksDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));

  return module.layout
    .filter((section) => section.label !== "Task Image")
    .map((section) => {
      const fields: DetailFieldEntry[] = [];
      section.columns.forEach((column, index) => {
        for (const name of column) {
          const field = byName.get(name);
          if (!field?.views.view) continue;
          if (!visible(field, record)) continue;
          const timestamp =
            name === "Created_By"
              ? record.fields.Created_Time
              : name === "Modified_By"
                ? record.fields.Modified_Time
                : undefined;
          const valueSuffix = name === "What_Id" ? taskRelatedToSuffix(record) : undefined;
          fields.push({
            ...(valueSuffix ? { valueSuffix } : {}),
            column:
              section.label === "Description Information" ? "full" : index === 0 ? "left" : "right",
            field,
            value: record.fields[name] ?? null,
            auditTimestamp: typeof timestamp === "string" ? timestamp : undefined,
          });
        }
      });
      return { title: section.label, fields };
    });
}
