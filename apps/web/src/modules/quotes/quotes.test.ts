import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";
import { expect, test, vi } from "vitest";
import { getModuleScreens } from "../registry";
import type { HeaderConfirmRequest } from "../types";
import { quotesScreenDefinition } from "./definition";
import { quotesListPageConfig } from "./list-config";
import { buildQuotesFilterGroups } from "./list-filters";
import { buildQuotesDetailSections } from "./quotes-detail-sections";
import { QUOTES_FORM_SYSTEM_FIELDS, quotesFormRules } from "./quotes-form-rules";
import { isQuoteInlineEditable } from "./quotes-inline-edit";
import { quotesRecordHeaderIdentity } from "./quotes-record-header";
import { quotesRelatedLists } from "./quotes-related-lists";

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
  expect(quotesScreenDefinition).toMatchObject({
    apiName: "Quotes",
    tab: "Quotes",
    pluralLabel: "Quotes",
    navigation: { id: "quotes", group: "flat" },
  });
  expect(quotesScreenDefinition.detail.hasPortrait).toBe(false);
  expect(getModuleScreens().some((d) => d.apiName === "Quotes")).toBe(true);
});

test("list config", () => {
  expect(quotesListPageConfig).toMatchObject({
    module: "Quotes",
    linkField: "Subject",
    createLabel: "Create Quote",
    pinnedViews: ["All Quotes"],
  });
});

test("filters list system rows and field rows", () => {
  const groups = buildQuotesFilterGroups({
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
  expect(quotesFormRules.requiredFields).toContain("Account_Name");
  expect(quotesFormRules.omittedSections).toBeUndefined();
  expect((quotesFormRules.defaultValues as () => unknown)()).toEqual({ Quote_Stage: "Draft" });
});

test("detail sections skip the subform field", () => {
  const metadata: ModuleMetadata = {
    apiName: "Quotes",
    singularLabel: "Quote",
    pluralLabel: "Quotes",
    fields: [field("Subject"), field("Items", { dataType: "subform" })],
    businessCardFields: [],
    layout: [
      {
        label: "Quote Information",
        columnCount: 2,
        columns: [["Subject", "Items"], []],
        fields: ["Subject", "Items"],
      },
    ],
  };
  const record: RecordData = { id: "r1", fields: { Subject: "A", Items: [] } };
  const sections = buildQuotesDetailSections(metadata, record);
  expect(sections[0]?.fields.map((f) => f.field.apiName)).toEqual(["Subject"]);
});

test("inline edit excludes system and subform fields", () => {
  expect(isQuoteInlineEditable(field("Quote_Number"))).toBe(false);
  expect(isQuoteInlineEditable(field("Items", { dataType: "subform" }))).toBe(false);
  expect(QUOTES_FORM_SYSTEM_FIELDS).toContain("Grand_Total");
  expect(isQuoteInlineEditable(field("Subject"))).toBe(true);
});

test("record header uses the subject", () => {
  expect(quotesRecordHeaderIdentity({ id: "1", fields: { Subject: "S" } }).title).toBe("S");
  expect(quotesRecordHeaderIdentity({ id: "1", fields: {} }).title).toBe("");
});

test("related lists are limited to features with a backing implementation", () => {
  expect(quotesRelatedLists.map((l) => l.title)).toEqual([
    "Notes",
    "Attachments",
    "Open Activities",
    "Closed Activities",
    "Emails",
  ]);
});

test("header commands include convert with invoice menu, print preview, and edit", async () => {
  const record: RecordData = { id: "q1", fields: { Subject: "Quote 1" } };
  let confirmedRequest: HeaderConfirmRequest | null = null;
  const navigate = vi.fn();
  const convertQuoteToInvoice = vi.fn().mockResolvedValue("inv-99");

  const commands = quotesScreenDefinition.detail.buildHeaderCommands?.(record, {
    editHref: "/crm/test/tab/Quotes/q1/edit",
    printHref: "/crm/test/tab/Quotes/q1/print",
    orgSlug: "test",
    navigate,
    confirm: (req) => {
      confirmedRequest = req;
    },
    save: vi.fn(),
    convertQuoteToInvoice,
  });

  expect(commands).toBeDefined();
  expect(commands?.map((c) => c.id)).toEqual(["convert", "print-preview", "edit"]);
  const convertCommand = commands?.find((c) => c.id === "convert");
  expect(convertCommand?.menu).toHaveLength(1);
  expect(convertCommand?.menu?.[0]?.label).toBe("Invoice");

  convertCommand?.menu?.[0]?.onAction();
  const request = confirmedRequest as unknown as HeaderConfirmRequest;
  expect(request).toMatchObject({
    title: "Convert Quote",
    confirmLabel: "Convert",
  });

  await request.onConfirm();
  expect(convertQuoteToInvoice).toHaveBeenCalled();
  expect(navigate).toHaveBeenCalledWith("/crm/test/tab/Invoices/inv-99");
});
