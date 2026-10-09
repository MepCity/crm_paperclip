import type { FieldDefinition, FieldValue, ModuleMetadata, RecordData } from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";
import { formatLeadsCompositeAddress } from "./leads-address";
import {
  LEADS_DETAIL_FIELD_LABELS,
  LEADS_OVERVIEW_SKIPPED_SECTIONS,
} from "./leads-detail.constants";

function fieldOnRecord(record: RecordData, apiName: string): FieldValue | undefined {
  if (!Object.hasOwn(record.fields, apiName)) return undefined;
  return record.fields[apiName];
}

function withDetailLabel(field: FieldDefinition): FieldDefinition {
  const override = LEADS_DETAIL_FIELD_LABELS[field.apiName];
  return override ? { ...field, label: override } : field;
}

function isDetailVisible(field: FieldDefinition, record: RecordData): boolean {
  if (!field.views.view) return false;
  return Object.hasOwn(record.fields, field.apiName);
}

export function buildLeadsBusinessCardFields(
  module: ModuleMetadata,
  record: RecordData,
): BusinessCardField[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));
  const rows: BusinessCardField[] = [];
  for (const apiName of module.businessCardFields) {
    const field = byName.get(apiName);
    if (!field || !isDetailVisible(field, record)) continue;
    rows.push({
      field: withDetailLabel(field),
      value: fieldOnRecord(record, apiName) ?? null,
    });
  }
  return rows;
}

function auditTimestampForField(record: RecordData, apiName: string): string | null | undefined {
  if (apiName === "Created_By") return fieldOnRecord(record, "Created_Time") as string | null;
  if (apiName === "Modified_By") return fieldOnRecord(record, "Modified_Time") as string | null;
  return undefined;
}

function buildLeadInformationSection(
  section: ModuleMetadata["layout"][number],
  module: ModuleMetadata,
  record: RecordData,
): DetailSection {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));
  const fields: DetailFieldEntry[] = [];
  section.columns.forEach((column, columnIndex) => {
    const columnKey: DetailFieldEntry["column"] = columnIndex === 0 ? "left" : "right";
    for (const apiName of column) {
      const field = byName.get(apiName);
      if (!field || !isDetailVisible(field, record)) continue;
      fields.push({
        column: columnKey,
        field: withDetailLabel(field),
        value: fieldOnRecord(record, apiName) ?? null,
        auditTimestamp: auditTimestampForField(record, apiName),
      });
    }
  });
  return { title: section.label, fields };
}

function buildAddressSection(
  section: ModuleMetadata["layout"][number],
  module: ModuleMetadata,
  record: RecordData,
): DetailSection {
  const addressField = module.fields.find((field) => field.apiName === "Address");
  const composite = formatLeadsCompositeAddress(record.fields);
  const field =
    addressField ??
    ({
      apiName: "Address",
      label: "Address",
      dataType: "textarea",
      required: false,
      readOnly: false,
      unique: false,
      massUpdate: false,
      views: { view: true, create: true, edit: true, quickCreate: false },
    } satisfies FieldDefinition);
  return {
    title: section.label,
    fields: [
      {
        column: "full",
        field: withDetailLabel(field),
        value: composite.length > 0 ? composite : null,
      },
    ],
  };
}

function buildDescriptionSection(
  section: ModuleMetadata["layout"][number],
  module: ModuleMetadata,
  record: RecordData,
): DetailSection {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));
  const fields: DetailFieldEntry[] = [];
  for (const apiName of section.fields) {
    const field = byName.get(apiName);
    if (!field || !isDetailVisible(field, record)) continue;
    fields.push({
      column: "full",
      field: withDetailLabel(field),
      value: fieldOnRecord(record, apiName) ?? null,
    });
  }
  return { title: section.label, fields };
}

export function buildLeadsDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const sections: DetailSection[] = [];
  for (const section of module.layout) {
    if (LEADS_OVERVIEW_SKIPPED_SECTIONS.has(section.label)) continue;
    if (section.label === "Lead Information") {
      sections.push(buildLeadInformationSection(section, module, record));
      continue;
    }
    if (section.label === "Address Information") {
      sections.push(buildAddressSection(section, module, record));
      continue;
    }
    if (section.label === "Description Information") {
      sections.push(buildDescriptionSection(section, module, record));
    }
  }
  return sections;
}
