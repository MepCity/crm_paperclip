import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";
import { expect, test } from "vitest";
import { getModuleScreens } from "../registry";
import { invoicesScreenDefinition } from "./definition";
import { buildInvoicesDetailSections } from "./invoices-detail-sections";
import { INVOICES_FORM_SYSTEM_FIELDS, invoicesFormRules } from "./invoices-form-rules";
import { isInvoiceInlineEditable } from "./invoices-inline-edit";
import { invoicesRecordHeaderIdentity } from "./invoices-record-header";
import { invoicesRelatedLists } from "./invoices-related-lists";
import { invoicesListPageConfig } from "./list-config";
import { buildInvoicesFilterGroups } from "./list-filters";

const field = (apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition => ({
  apiName,
  label: apiName,
  dataType: "text",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: false,
  views: { view: true, create: true, edit: true, quickCreate: false },
  ...extra,
});

test("definition is registered with navigation and no portrait", () => {
  expect(invoicesScreenDefinition).toMatchObject({
    apiName: "Invoices",
    tab: "Invoices",
    pluralLabel: "Invoices",
    navigation: { id: "invoices", group: "flat" },
  });
  expect(invoicesScreenDefinition.detail.hasPortrait).toBe(false);
  expect(getModuleScreens().some((d) => d.apiName === "Invoices")).toBe(true);
});

test("list config", () => {
  expect(invoicesListPageConfig).toMatchObject({
    module: "Invoices",
    linkField: "Subject",
    createLabel: "Create Invoice",
    pinnedViews: ["All Invoices"],
  });
});

test("filters list system rows and field rows", () => {
  const groups = buildInvoicesFilterGroups({
    fields: [
      field("Subject", { label: "Subject" }),
      field("Line", { label: "Line", dataType: "subform" }),
    ],
    users: [],
    linkField: "Subject",
    currencyCode: "TRY",
  });
  expect(groups.map((g) => g.id)).toEqual(["system", "fields"]);
  expect(groups[0]?.items).toHaveLength(5);
  const fields = groups[1]?.items ?? [];
  expect(fields.find((i) => i.label === "Subject")?.editor).toBeDefined();
  expect(fields.find((i) => i.label === "Line")?.disabled).toBe(true);
});

test("form rules keep the line-item section for the shared editor", () => {
  expect(invoicesFormRules.requiredFields).toContain("Account_Name");
  expect(invoicesFormRules.omittedSections).toBeUndefined();
  expect((invoicesFormRules.defaultValues as () => unknown)()).toEqual({ Status: "Created" });
});

test("detail sections skip the subform field", () => {
  const metadata: ModuleMetadata = {
    apiName: "Invoices",
    singularLabel: "Invoice",
    pluralLabel: "Invoices",
    fields: [field("Subject"), field("Items", { dataType: "subform" })],
    businessCardFields: [],
    layout: [
      {
        label: "Invoice Information",
        columnCount: 2,
        columns: [["Subject", "Items"], []],
        fields: ["Subject", "Items"],
      },
    ],
  };
  const record: RecordData = { id: "r1", fields: { Subject: "A", Items: [] } };
  const sections = buildInvoicesDetailSections(metadata, record);
  expect(sections[0]?.fields.map((f) => f.field.apiName)).toEqual(["Subject"]);
});

test("inline edit excludes system and subform fields", () => {
  expect(isInvoiceInlineEditable(field("Invoice_Number"))).toBe(false);
  expect(isInvoiceInlineEditable(field("Items", { dataType: "subform" }))).toBe(false);
  expect(INVOICES_FORM_SYSTEM_FIELDS).toContain("Grand_Total");
  expect(isInvoiceInlineEditable(field("Subject"))).toBe(true);
});

test("record header uses the subject", () => {
  expect(invoicesRecordHeaderIdentity({ id: "1", fields: { Subject: "S" } }).title).toBe("S");
  expect(invoicesRecordHeaderIdentity({ id: "1", fields: {} }).title).toBe("");
});

test("related lists are limited to features with a backing implementation", () => {
  expect(invoicesRelatedLists.map((l) => l.title)).toEqual([
    "Notes",
    "Attachments",
    "Open Activities",
    "Closed Activities",
    "Emails",
  ]);
});
