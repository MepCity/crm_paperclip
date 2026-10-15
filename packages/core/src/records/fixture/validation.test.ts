import { describe, expect, it } from "vitest";
import { ValidationError } from "../../errors";
import type { FieldDataType, FieldDefinition } from "../contract";
import { acceptsFieldValue, isValidDateOnly, validateInput } from "./validation";

const makeField = (
  overrides: Partial<FieldDefinition> & { apiName: string; dataType: FieldDataType },
): FieldDefinition => ({
  label: overrides.apiName,
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
  ...overrides,
});

describe("isValidDateOnly", () => {
  it("accepts valid YYYY-MM-DD date strings", () => {
    expect(isValidDateOnly("2026-10-15")).toBe(true);
    expect(isValidDateOnly("2024-01-01")).toBe(true);
    expect(isValidDateOnly("1999-12-31")).toBe(true);
  });

  it("accepts leap year 2028-02-29 and rejects non-leap year 2027-02-29", () => {
    expect(isValidDateOnly("2028-02-29")).toBe(true);
    expect(isValidDateOnly("2027-02-29")).toBe(false);
  });

  it("rejects invalid month numbers like 2026-13-01", () => {
    expect(isValidDateOnly("2026-13-01")).toBe(false);
  });

  it("rejects invalid month numbers like 2026-00-10", () => {
    expect(isValidDateOnly("2026-00-10")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidDateOnly("")).toBe(false);
  });

  it("rejects date strings containing time components", () => {
    expect(isValidDateOnly("2026-10-15T00:00:00.000Z")).toBe(false);
    expect(isValidDateOnly("2026-10-15 10:30:00")).toBe(false);
  });
});

describe("acceptsFieldValue", () => {
  it("accepts null for any field dataType", () => {
    const dataTypes: FieldDataType[] = [
      "text",
      "integer",
      "currency",
      "double",
      "boolean",
      "date",
      "datetime",
      "bigint",
      "lookup",
      "multi_module_lookup",
      "ALARM",
      "RRULE",
    ];
    for (const dataType of dataTypes) {
      const field = makeField({ apiName: `field_${dataType}`, dataType });
      expect(acceptsFieldValue(field, null)).toBe(true);
    }
  });

  it("accepts valid JSON arrays and rejects non-arrays when acceptsJsonArray is true", () => {
    const field = makeField({
      apiName: "json_array_field",
      dataType: "text",
      acceptsJsonArray: true,
    });
    expect(acceptsFieldValue(field, ["alpha", "beta"])).toBe(true);
    expect(acceptsFieldValue(field, [1, 2, 3])).toBe(true);
    expect(acceptsFieldValue(field, [])).toBe(true);
    expect(acceptsFieldValue(field, "not an array")).toBe(false);
    expect(acceptsFieldValue(field, { key: "value" })).toBe(false);
    expect(acceptsFieldValue(field, 123)).toBe(false);
  });

  it("rejects arrays when acceptsJsonArray is not enabled", () => {
    const field = makeField({ apiName: "plain_text", dataType: "text" });
    expect(acceptsFieldValue(field, ["not", "accepted"])).toBe(false);
  });

  it("validates ALARM dataType branch", () => {
    const field = makeField({ apiName: "alarm_field", dataType: "ALARM" });
    expect(acceptsFieldValue(field, { trigger: 15, unit: "minutes" })).toBe(true);
    expect(acceptsFieldValue(field, {})).toBe(true);
    expect(acceptsFieldValue(field, "invalid-alarm")).toBe(false);
    expect(acceptsFieldValue(field, 15)).toBe(false);
    expect(acceptsFieldValue(field, true)).toBe(false);
  });

  it("validates RRULE dataType branch", () => {
    const field = makeField({ apiName: "rrule_field", dataType: "RRULE" });
    expect(acceptsFieldValue(field, { freq: "DAILY", interval: 1 })).toBe(true);
    expect(acceptsFieldValue(field, {})).toBe(true);
    expect(acceptsFieldValue(field, "RRULE:FREQ=DAILY")).toBe(false);
    expect(acceptsFieldValue(field, 100)).toBe(false);
    expect(acceptsFieldValue(field, false)).toBe(false);
  });

  it("validates integer dataType branch", () => {
    const field = makeField({ apiName: "int_field", dataType: "integer" });
    expect(acceptsFieldValue(field, 42)).toBe(true);
    expect(acceptsFieldValue(field, -100)).toBe(true);
    expect(acceptsFieldValue(field, 0)).toBe(true);
    expect(acceptsFieldValue(field, 42.5)).toBe(false);
    expect(acceptsFieldValue(field, "42")).toBe(false);
    expect(acceptsFieldValue(field, Number.NaN)).toBe(false);
    expect(acceptsFieldValue(field, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("validates currency dataType branch", () => {
    const field = makeField({ apiName: "currency_field", dataType: "currency" });
    expect(acceptsFieldValue(field, 1234.56)).toBe(true);
    expect(acceptsFieldValue(field, 0)).toBe(true);
    expect(acceptsFieldValue(field, -50.25)).toBe(true);
    expect(acceptsFieldValue(field, "1234.56")).toBe(false);
    expect(acceptsFieldValue(field, Number.NaN)).toBe(false);
    expect(acceptsFieldValue(field, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("validates double dataType branch", () => {
    const field = makeField({ apiName: "double_field", dataType: "double" });
    expect(acceptsFieldValue(field, 12.34)).toBe(true);
    expect(acceptsFieldValue(field, -0.001)).toBe(true);
    expect(acceptsFieldValue(field, 100)).toBe(true);
    expect(acceptsFieldValue(field, "12.34")).toBe(false);
    expect(acceptsFieldValue(field, Number.NaN)).toBe(false);
    expect(acceptsFieldValue(field, Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("validates boolean dataType branch", () => {
    const field = makeField({ apiName: "bool_field", dataType: "boolean" });
    expect(acceptsFieldValue(field, true)).toBe(true);
    expect(acceptsFieldValue(field, false)).toBe(true);
    expect(acceptsFieldValue(field, "true")).toBe(false);
    expect(acceptsFieldValue(field, 1)).toBe(false);
    expect(acceptsFieldValue(field, 0)).toBe(false);
    expect(acceptsFieldValue(field, {})).toBe(false);
  });

  it("validates date dataType branch", () => {
    const field = makeField({ apiName: "date_field", dataType: "date" });
    expect(acceptsFieldValue(field, "2026-05-15")).toBe(true);
    expect(acceptsFieldValue(field, "2026-02-29")).toBe(false);
    expect(acceptsFieldValue(field, "not-a-date")).toBe(false);
    expect(acceptsFieldValue(field, 20260515)).toBe(false);
  });

  it("validates datetime dataType branch", () => {
    const field = makeField({ apiName: "datetime_field", dataType: "datetime" });
    expect(acceptsFieldValue(field, "2026-05-15T12:00:00Z")).toBe(true);
    expect(acceptsFieldValue(field, "2026-05-15T12:00:00.123Z")).toBe(true);
    expect(acceptsFieldValue(field, "2026-05-15 12:00:00")).toBe(false);
    expect(acceptsFieldValue(field, "2026-05-15T12:00:00+03:00")).toBe(false);
    expect(acceptsFieldValue(field, "2026-05-15T12:00:00")).toBe(false);
    expect(acceptsFieldValue(field, 1715774400000)).toBe(false);
  });

  it("validates bigint dataType branch", () => {
    const field = makeField({ apiName: "bigint_field", dataType: "bigint" });
    expect(acceptsFieldValue(field, "9007199254740993")).toBe(true);
    expect(acceptsFieldValue(field, "-12345678901234567890")).toBe(true);
    expect(acceptsFieldValue(field, "0")).toBe(true);
    expect(acceptsFieldValue(field, "12.34")).toBe(false);
    expect(acceptsFieldValue(field, "not-a-number")).toBe(false);
    expect(acceptsFieldValue(field, 12345)).toBe(false);
  });

  it("validates lookup dataType branch", () => {
    const field = makeField({
      apiName: "account_lookup",
      dataType: "lookup",
      lookup: { module: "Accounts" },
    });
    expect(acceptsFieldValue(field, { id: "acc-1", module: "Accounts" })).toBe(true);
    expect(acceptsFieldValue(field, { id: "acc-1", module: "Accounts", name: "Acme Corp" })).toBe(
      true,
    );
    expect(acceptsFieldValue(field, { id: "acc-1", module: "Leads" })).toBe(false);
    expect(acceptsFieldValue(field, { id: 123, module: "Accounts" })).toBe(false);
    expect(acceptsFieldValue(field, { id: "acc-1", module: "Accounts", extra: "illegal" })).toBe(
      false,
    );
    expect(acceptsFieldValue(field, "acc-1")).toBe(false);
    expect(acceptsFieldValue(field, 123)).toBe(false);
  });

  it("validates multi_module_lookup dataType branch", () => {
    const field = makeField({
      apiName: "parent_lookup",
      dataType: "multi_module_lookup",
    });
    expect(acceptsFieldValue(field, { id: "rec-1", module: "Accounts" })).toBe(true);
    expect(acceptsFieldValue(field, { id: "rec-2", module: "CustomModule", name: "Label" })).toBe(
      true,
    );
    expect(acceptsFieldValue(field, { id: "rec-1" })).toBe(false);
    expect(acceptsFieldValue(field, { module: "Accounts" })).toBe(false);
    expect(acceptsFieldValue(field, { id: "rec-1", module: "Accounts", name: 123 })).toBe(false);
    expect(acceptsFieldValue(field, { id: "rec-1", module: "Accounts", extra: "illegal" })).toBe(
      false,
    );
    expect(acceptsFieldValue(field, "rec-1")).toBe(false);
  });

  it("validates default / text-like dataType branch", () => {
    const textLikeTypes: FieldDataType[] = [
      "text",
      "textarea",
      "email",
      "phone",
      "website",
      "picklist",
      "multireminder",
      "ownerlookup",
      "profileimage",
    ];
    for (const dataType of textLikeTypes) {
      const field = makeField({ apiName: `sample_${dataType}`, dataType });
      expect(acceptsFieldValue(field, "valid string value")).toBe(true);
      expect(acceptsFieldValue(field, 12345)).toBe(false);
      expect(acceptsFieldValue(field, true)).toBe(false);
      expect(acceptsFieldValue(field, { key: "val" })).toBe(false);
    }
  });
});

describe("validateInput", () => {
  const fields: readonly FieldDefinition[] = [
    makeField({ apiName: "Last_Name", label: "Last Name", dataType: "text", required: true }),
    makeField({ apiName: "Email", label: "Email", dataType: "email" }),
    makeField({
      apiName: "Status",
      label: "Status",
      dataType: "picklist",
      picklist: [
        { displayValue: "Open", storedValue: "Open" },
        { displayValue: "Closed", storedValue: "Closed" },
      ],
    }),
    makeField({ apiName: "Age", label: "Age", dataType: "integer" }),
    makeField({ apiName: "Code", label: "Code", dataType: "text", maxLength: 5 }),
    makeField({
      apiName: "Created_Time",
      label: "Created Time",
      dataType: "datetime",
      readOnly: true,
    }),
    makeField({ apiName: "System_Tag", label: "System Tag", dataType: "text" }),
  ];
  const managed = new Set<string>(["System_Tag"]);

  it("rejects missing required field with mandatory ValidationError", () => {
    expect(() => validateInput({}, false, fields, managed)).toThrow(ValidationError);

    try {
      validateInput({}, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const valError = error as ValidationError;
      expect(valError.code).toBe("validation");
      expect(valError.reason).toBe("mandatory");
      expect(valError.fieldErrors).toEqual({ Last_Name: ["This field is required."] });
    }

    // Also when field is present but null or empty string
    try {
      validateInput({ Last_Name: "" }, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      const valError = error as ValidationError;
      expect(valError.reason).toBe("mandatory");
      expect(valError.fieldErrors).toEqual({ Last_Name: ["This field is required."] });
    }

    try {
      validateInput({ Last_Name: "   " }, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      const valError = error as ValidationError;
      expect(valError.reason).toBe("mandatory");
      expect(valError.fieldErrors).toEqual({ Last_Name: ["This field is required."] });
    }

    try {
      validateInput({ Last_Name: null }, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      const valError = error as ValidationError;
      expect(valError.reason).toBe("mandatory");
      expect(valError.fieldErrors).toEqual({ Last_Name: ["This field is required."] });
    }
  });

  it("rejects unknown field with invalid ValidationError", () => {
    try {
      validateInput({ Last_Name: "Valid", NonExistent: "value" }, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const valError = error as ValidationError;
      expect(valError.code).toBe("validation");
      expect(valError.reason).toBe("invalid");
      expect(valError.fieldErrors).toEqual({ NonExistent: ["Unknown field."] });
    }
  });

  it("rejects read-only and managed fields with invalid ValidationError", () => {
    // field.readOnly is true
    try {
      validateInput(
        { Last_Name: "Valid", Created_Time: "2026-10-15T12:00:00Z" },
        false,
        fields,
        managed,
      );
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const valError = error as ValidationError;
      expect(valError.code).toBe("validation");
      expect(valError.reason).toBe("invalid");
      expect(valError.fieldErrors).toEqual({
        Created_Time: ["This field is system managed."],
      });
    }

    // managed set contains field name
    try {
      validateInput({ Last_Name: "Valid", System_Tag: "system-value" }, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const valError = error as ValidationError;
      expect(valError.code).toBe("validation");
      expect(valError.reason).toBe("invalid");
      expect(valError.fieldErrors).toEqual({
        System_Tag: ["This field is system managed."],
      });
    }
  });

  it("accepts valid input without throwing", () => {
    expect(() =>
      validateInput(
        {
          Last_Name: "Smith",
          Email: "smith@example.org",
          Status: "Open",
          Age: 35,
          Code: "ABC",
        },
        false,
        fields,
        managed,
      ),
    ).not.toThrow();
  });

  it("allows omitting required fields on partial update", () => {
    // In partial update, omitting required Last_Name is allowed
    expect(() =>
      validateInput({ Email: "updated@example.org" }, true, fields, managed),
    ).not.toThrow();

    // But supplying null or empty string for required field on partial update is rejected
    expect(() => validateInput({ Last_Name: null }, true, fields, managed)).toThrow(
      ValidationError,
    );
  });

  it("rejects values with invalid types, excessive length, or unlisted picklist options", () => {
    // Invalid type
    try {
      validateInput({ Last_Name: "Valid", Age: "not-a-number" }, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      const valError = error as ValidationError;
      expect(valError.fieldErrors).toEqual({ Age: ["Invalid field type."] });
    }

    // Value too long
    try {
      validateInput({ Last_Name: "Valid", Code: "123456" }, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      const valError = error as ValidationError;
      expect(valError.fieldErrors).toEqual({ Code: ["Value is too long."] });
    }

    // Unlisted picklist option
    try {
      validateInput({ Last_Name: "Valid", Status: "Archived" }, false, fields, managed);
      expect.unreachable("should have thrown");
    } catch (error) {
      const valError = error as ValidationError;
      expect(valError.fieldErrors).toEqual({ Status: ["Choose a listed option."] });
    }
  });
});
