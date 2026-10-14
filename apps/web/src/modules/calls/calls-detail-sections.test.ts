import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";
import { expect, test } from "vitest";
import {
  buildCallsBusinessCardFields,
  buildCallsDetailSections,
  CALLS_BUSINESS_CARD_FIELDS,
  callReferenceSuffix,
} from "./calls-detail-sections";

function field(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...extra,
  };
}

const names = [...CALLS_BUSINESS_CARD_FIELDS];
const metadata: ModuleMetadata = {
  apiName: "Calls",
  singularLabel: "Call",
  pluralLabel: "Calls",
  fields: [
    field("Who_Id", { dataType: "lookup" }),
    field("What_Id", { dataType: "lookup" }),
    field("Call_Type", { dataType: "picklist" }),
    field("Outgoing_Call_Status", { dataType: "picklist" }),
    field("Call_Start_Time", { dataType: "datetime" }),
  ],
  businessCardFields: [],
  layout: [{ label: "Call Information", columns: [names.slice(0, 3), names.slice(3)] }],
} as unknown as ModuleMetadata;

const record: RecordData = {
  id: "c1",
  fields: {
    Who_Id: { id: "p1", name: "Ada Sample", module: "Contacts" },
    What_Id: { id: "d1", name: "Sample Deal", module: "Deals" },
    Call_Type: "Outbound",
    Outgoing_Call_Status: "Scheduled",
    Call_Start_Time: "2026-12-31T10:00:00Z",
  },
};

test("business card order", () => {
  expect(buildCallsBusinessCardFields(metadata, record).map((f) => f.field.apiName)).toEqual(names);
});

test("detail sections: Call Information first, same order, single column", () => {
  const first = buildCallsDetailSections(metadata, record)[0]!;
  expect(first.title).toBe("Call Information");
  expect(first.fields.map((f) => f.field.apiName)).toEqual(names);
  expect(new Set(first.fields.map((f) => f.column))).toEqual(new Set(["full"]));
});

test("link fields get module suffixes; plain fields none", () => {
  expect(callReferenceSuffix(record, "Who_Id")).toBe("- Contacts");
  expect(callReferenceSuffix(record, "What_Id")).toBe("- Deals");
  expect(callReferenceSuffix({ id: "c", fields: { Who_Id: null } }, "Who_Id")).toBeUndefined();
});

test("plain-text fields stay primitive values", () => {
  const f = buildCallsBusinessCardFields(metadata, record);
  expect(f[2]?.value).toBe("Outbound");
  expect(f[3]?.value).toBe("Scheduled");
});
