import type { FieldDefinition, ModuleMetadata, RecordData, RecordService } from "@crm/core/records";
import { expect, test, vi } from "vitest";
import { resolveCreatePrefillParams } from "./create-prefill-params";

function field(apiName: string, options: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...options,
  };
}

const metadata: ModuleMetadata = {
  apiName: "Deals",
  singularLabel: "Deal",
  pluralLabel: "Deals",
  businessCardFields: [],
  fields: [
    field("Deal_Name"),
    field("Stage", {
      dataType: "picklist",
      picklist: [
        { storedValue: "Qualification", displayValue: "Qualification" },
        { storedValue: "Needs Analysis", displayValue: "Needs Analysis" },
      ],
    }),
    field("Closing_Date", { dataType: "date" }),
    field("Amount", { dataType: "currency" }),
    field("Probability", { dataType: "integer" }),
    field("Expected_Revenue", { dataType: "currency", readOnly: true }),
    field("Account_Name", { dataType: "lookup", lookup: { module: "Accounts" } }),
    field("Contact_Name", { dataType: "lookup", lookup: { module: "Contacts" } }),
    field("Campaign_Source", { dataType: "lookup", lookup: { module: "Campaigns" } }),
    field("Modified_Time", {
      dataType: "datetime",
      views: { view: true, create: false, edit: false, quickCreate: false },
    }),
  ],
  layout: [],
};

function harness(records: Record<string, RecordData> = {}) {
  const service = {
    getModule: vi.fn(async () => metadata),
    get: vi.fn(async (module: string, id: string) => {
      const record = records[`${module}/${id}`];
      if (!record) throw new Error(`no ${module}/${id}`);
      return record;
    }),
  } satisfies Pick<RecordService, "getModule" | "get">;
  return service;
}

const accounts: Record<string, RecordData> = {
  "Accounts/acc-1": { id: "acc-1", fields: { Account_Name: "Acme Limited" } },
  "Contacts/con-1": { id: "con-1", fields: { Full_Name: "Ada Lovelace" } },
};

test("keeps create-visible text, picklist and date parameters as written", async () => {
  const values = await resolveCreatePrefillParams(harness(accounts), "Deals", {
    Deal_Name: "Spring Push",
    Stage: "Needs Analysis",
    Closing_Date: "2026-11-30",
  });
  expect(values).toEqual({
    Deal_Name: "Spring Push",
    Stage: "Needs Analysis",
    Closing_Date: "2026-11-30",
  });
});

test("reads numeric parameters as numbers and drops what is not a number", async () => {
  expect(await resolveCreatePrefillParams(harness(accounts), "Deals", { Amount: "1500" })).toEqual({
    Amount: 1500,
  });
  expect(
    await resolveCreatePrefillParams(harness(accounts), "Deals", { Probability: "not-a-number" }),
  ).toBeUndefined();
});

test("ignores unknown names, create-hidden fields and read-only fields", async () => {
  const values = await resolveCreatePrefillParams(harness(accounts), "Deals", {
    Not_A_Field: "anything",
    Modified_Time: "2026-10-01 10:00:00",
    Expected_Revenue: "9000",
  });
  expect(values).toBeUndefined();
});

test("resolves a lookup parameter to the referenced record and its own name column", async () => {
  const values = await resolveCreatePrefillParams(harness(accounts), "Deals", {
    Account_Name: "acc-1",
    Contact_Name: "con-1",
  });
  expect(values).toEqual({
    Account_Name: { module: "Accounts", id: "acc-1", name: "Acme Limited" },
    Contact_Name: { module: "Contacts", id: "con-1", name: "Ada Lovelace" },
  });
});

test("drops a lookup whose record cannot be read and keeps the parameters that can", async () => {
  const values = await resolveCreatePrefillParams(harness(accounts), "Deals", {
    Account_Name: "acc-missing",
    Deal_Name: "Kept",
  });
  expect(values).toEqual({ Deal_Name: "Kept" });
});

test("takes the first value of a repeated parameter and answers undefined for no parameters", async () => {
  expect(
    await resolveCreatePrefillParams(harness(accounts), "Deals", {
      Deal_Name: ["First", "Second"],
    }),
  ).toEqual({ Deal_Name: "First" });
  expect(await resolveCreatePrefillParams(harness(accounts), "Deals", {})).toBeUndefined();
});
