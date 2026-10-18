import type { FieldDataType, FieldDefinition } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import { isLeadInlineEditable } from "./leads-inline-edit";

const ctx = {
  orgId: "inline-edit-test-org",
  orgSlug: "inline-edit-test-org",
  orgName: "Inline Edit Test Org",
  userId: "user-1",
  role: "admin" as const,
};

function leadField(apiName = "Company", overrides: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType: "text" as FieldDataType,
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...overrides,
  };
}

describe("isLeadInlineEditable", () => {
  it("allows standard writable field types with edit permission", () => {
    expect(isLeadInlineEditable(leadField("Company"))).toBe(true);
    expect(isLeadInlineEditable(leadField("Email", { dataType: "email" }))).toBe(true);
    expect(isLeadInlineEditable(leadField("Phone", { dataType: "phone" }))).toBe(true);
    expect(isLeadInlineEditable(leadField("Website", { dataType: "website" }))).toBe(true);
    expect(isLeadInlineEditable(leadField("Lead_Source", { dataType: "picklist" }))).toBe(true);
    expect(isLeadInlineEditable(leadField("No_of_Employees", { dataType: "integer" }))).toBe(true);
    expect(isLeadInlineEditable(leadField("Annual_Revenue", { dataType: "currency" }))).toBe(true);
    expect(isLeadInlineEditable(leadField("Email_Opt_Out", { dataType: "boolean" }))).toBe(true);
    expect(isLeadInlineEditable(leadField("Follow_Up_Date", { dataType: "date" }))).toBe(true);
    expect(isLeadInlineEditable(leadField("Rating_Score", { dataType: "double" }))).toBe(true);
  });

  it("is false when the edit view flag is off", () => {
    expect(
      isLeadInlineEditable(
        leadField("Company", {
          views: { view: true, create: true, edit: false, quickCreate: false },
        }),
      ),
    ).toBe(false);
  });

  it("is false for read-only fields", () => {
    expect(isLeadInlineEditable(leadField("Company", { readOnly: true }))).toBe(false);
    expect(isLeadInlineEditable(leadField("Email", { dataType: "email", readOnly: true }))).toBe(
      false,
    );
  });

  it.each(["Address", "Full_Name", "Created_By", "Modified_By", "Created_Time", "Modified_Time"])(
    "is false for excluded api name %s",
    (apiName) => {
      expect(isLeadInlineEditable(leadField(apiName))).toBe(false);
    },
  );

  it.each(["profileimage", "lookup", "multi_module_lookup", "datetime", "bigint"])(
    "is false for excluded data type %s",
    (dataType) => {
      expect(
        isLeadInlineEditable(leadField("Custom_Field", { dataType: dataType as FieldDataType })),
      ).toBe(false);
    },
  );

  describe("with Leads fixture metadata", () => {
    it("evaluates real fields from Leads fixture metadata", async () => {
      const service = createFixtureRecordService(ctx);
      const module = await service.getModule("Leads");
      const findField = (apiName: string): FieldDefinition => {
        const match = module.fields.find((f) => f.apiName === apiName);
        if (!match) throw new Error(`Missing fixture field: ${apiName}`);
        return match;
      };

      // Plain editable fields
      expect(isLeadInlineEditable(findField("Company"))).toBe(true);
      expect(isLeadInlineEditable(findField("Designation"))).toBe(true);

      // Excluded composite / system fields
      expect(isLeadInlineEditable(findField("Address"))).toBe(false);
      expect(isLeadInlineEditable(findField("Full_Name"))).toBe(false);
      expect(isLeadInlineEditable(findField("Created_By"))).toBe(false);
      expect(isLeadInlineEditable(findField("Modified_By"))).toBe(false);
      expect(isLeadInlineEditable(findField("Created_Time"))).toBe(false);
      expect(isLeadInlineEditable(findField("Modified_Time"))).toBe(false);

      // Excluded data types from fixture fields
      expect(isLeadInlineEditable(findField("Record_Image"))).toBe(false); // profileimage
      expect(isLeadInlineEditable(findField("Converted_Account"))).toBe(false); // lookup
      expect(isLeadInlineEditable(findField("Connected_To__s"))).toBe(false); // multi_module_lookup
      expect(isLeadInlineEditable(findField("Last_Activity_Time"))).toBe(false); // datetime
      expect(isLeadInlineEditable(findField("id"))).toBe(false); // bigint
    });
  });
});
