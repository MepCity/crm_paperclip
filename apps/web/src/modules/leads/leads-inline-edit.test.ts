import type { FieldDefinition } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { isLeadInlineEditable } from "./leads-inline-edit";

function leadField(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
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

  it("excludes system and composite fields from inline editing", () => {
    const excludedFields = [
      "Address",
      "Full_Name",
      "Created_By",
      "Modified_By",
      "Created_Time",
      "Modified_Time",
    ];
    for (const apiName of excludedFields) {
      expect(isLeadInlineEditable(leadField(apiName))).toBe(false);
    }
  });

  it("excludes uneditable data types", () => {
    const excludedDataTypes = [
      "profileimage",
      "lookup",
      "multi_module_lookup",
      "datetime",
      "bigint",
    ] as const;
    for (const dataType of excludedDataTypes) {
      expect(isLeadInlineEditable(leadField("Custom_Field", { dataType }))).toBe(false);
    }
  });

  it("excludes read-only fields even if dataType is otherwise editable", () => {
    expect(isLeadInlineEditable(leadField("Company", { readOnly: true }))).toBe(false);
    expect(isLeadInlineEditable(leadField("Email", { dataType: "email", readOnly: true }))).toBe(
      false,
    );
  });

  it("excludes fields when edit view is disabled", () => {
    expect(
      isLeadInlineEditable(
        leadField("Company", {
          views: { view: true, create: true, edit: false, quickCreate: false },
        }),
      ),
    ).toBe(false);
  });
});
