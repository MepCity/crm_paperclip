import type { FieldDataType, FieldDefinition } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { isLeadInlineEditable } from "./leads-inline-edit";

const field = (overrides: Partial<FieldDefinition> = {}): FieldDefinition => ({
  apiName: "Designation",
  label: "Designation",
  dataType: "text" as FieldDataType,
  required: false,
  readOnly: false,
  massUpdate: false,
  unique: false,
  views: { view: true, create: true, edit: true, quickCreate: false },
  ...overrides,
});

describe("isLeadInlineEditable", () => {
  it("is true for a plain editable text field", () => {
    expect(isLeadInlineEditable(field())).toBe(true);
  });

  it("is false when the edit view flag is off", () => {
    expect(
      isLeadInlineEditable(
        field({ views: { view: true, create: true, edit: false, quickCreate: false } }),
      ),
    ).toBe(false);
  });

  it("is false for read-only fields", () => {
    expect(isLeadInlineEditable(field({ readOnly: true }))).toBe(false);
  });

  it.each(["Address", "Full_Name", "Created_By", "Modified_By", "Created_Time", "Modified_Time"])(
    "is false for excluded api name %s",
    (apiName) => {
      expect(isLeadInlineEditable(field({ apiName }))).toBe(false);
    },
  );

  it.each(["profileimage", "lookup", "multi_module_lookup", "datetime", "bigint"])(
    "is false for excluded data type %s",
    (dataType) => {
      expect(isLeadInlineEditable(field({ dataType: dataType as FieldDataType }))).toBe(false);
    },
  );
});
