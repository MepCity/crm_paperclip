import type {
  FieldDefinition,
  ModuleMetadata,
  ModuleRecordReference,
  RecordData,
} from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";
import { resolveModuleScreenByApiName } from "@/modules/registry";
import { referenceModuleSuffix } from "@/modules/tasks/tasks-detail-sections";

function visible(field: FieldDefinition, record: RecordData) {
  return field.views.view && Object.hasOwn(record.fields, field.apiName);
}

/**
 * Field order for Meetings business card: From, To, All day, Meeting Venue,
 * Location, Host, Related To, Contact Name (MD-39, MD-45).
 */
export const MEETINGS_BUSINESS_CARD_FIELDS = [
  "Start_DateTime",
  "End_DateTime",
  "All_day",
  "Meeting_Venue__s",
  "Venue",
  "Owner",
  "What_Id",
  "Who_Id",
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
 * Produces the unlinked module suffix for the What_Id relation in a Meeting
 * (e.g. the singular module label). Used by record detail rendering to display
 * alongside the related record link (MD-39).
 * Pure helper — does not mutate any shared type.
 */
export function meetingRelatedToSuffix(record: RecordData): string | undefined {
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
 * falling back to MEETINGS_BUSINESS_CARD_FIELDS when metadata businessCardFields is empty.
 * All_day is omitted when its value is absent or false (dash rule; boolean key is not drawn).
 * Empty Venue renders as dash via field-format null handling.
 */
export function buildMeetingsBusinessCardFields(
  module: ModuleMetadata,
  record: RecordData,
): BusinessCardField[] {
  const cardNames =
    module.businessCardFields.length > 0
      ? module.businessCardFields
      : MEETINGS_BUSINESS_CARD_FIELDS;

  return cardNames.flatMap((name) => {
    const field = module.fields.find((candidate) => candidate.apiName === name);
    if (!field || !visible(field, record)) return [];
    // All_day: omit when absent or false (spec: "All day and empty Location display a dash;
    // no boolean switch is painted"). We still include the row so the dash appears;
    // the boolean-key strikethrough rule is handled by the renderer. However the spec states
    // the dash is shown — meaning the field row IS shown, just the value reads as dash.
    return [
      {
        field: { ...field, readOnly: true },
        value: record.fields[name] ?? null,
        suffix: name === "What_Id" ? referenceModuleSuffix(record.fields[name]) : undefined,
      },
    ];
  });
}

/**
 * Builds detail sections from service layout (Meeting Information first, single column).
 * Does not include a status ribbon. Meeting image / provider badge sections are excluded.
 */
export function buildMeetingsDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));

  return module.layout
    .filter((section) => section.label !== "Meeting Image" && section.label !== "Meeting Provider")
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
          fields.push({
            column:
              section.label === "Meeting Additional Information"
                ? "full"
                : index === 0
                  ? "left"
                  : "right",
            field,
            value: record.fields[name] ?? null,
            suffix: name === "What_Id" ? referenceModuleSuffix(record.fields[name]) : undefined,
            auditTimestamp: typeof timestamp === "string" ? timestamp : undefined,
          });
        }
      });
      return { title: section.label, fields };
    });
}
