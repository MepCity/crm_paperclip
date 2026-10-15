import { describe, expect, it } from "vitest";
import { ConflictError } from "../../errors";
import type { FieldDataType, FieldDefinition, RecordData } from "../contract";
import { assertUniqueFieldValues, projectRecordsWithOverrides } from "./unique";

const makeField = (
  overrides: Partial<FieldDefinition> & { apiName: string; dataType: FieldDataType },
): FieldDefinition => ({
  label: overrides.label ?? overrides.apiName,
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
  ...overrides,
});

describe("assertUniqueFieldValues", () => {
  it("is silent when no fields are marked unique", () => {
    const fields: FieldDefinition[] = [
      makeField({ apiName: "Company", label: "Company", dataType: "text", unique: false }),
      makeField({ apiName: "Email", label: "Email", dataType: "email", unique: false }),
    ];
    const records: RecordData[] = [
      { id: "rec-1", fields: { Company: "Acme Corp", Email: "contact@example.com" } },
      { id: "rec-2", fields: { Company: "Acme Corp", Email: "contact@example.com" } },
    ];
    expect(() => assertUniqueFieldValues(fields, records)).not.toThrow();
  });

  it("throws ConflictError when two different records share the same unique field value", () => {
    const fields: FieldDefinition[] = [
      makeField({ apiName: "Email", label: "Email Address", dataType: "email", unique: true }),
    ];
    const records: RecordData[] = [
      { id: "rec-1", fields: { Email: "contact@example.com" } },
      { id: "rec-2", fields: { Email: "contact@example.com" } },
    ];
    expect(() => assertUniqueFieldValues(fields, records)).toThrow(ConflictError);

    try {
      assertUniqueFieldValues(fields, records);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
      const conflict = error as ConflictError;
      expect(conflict.code).toBe("conflict");
      expect(conflict.message).toBe("Email Address is already in use.");
    }
  });

  it("does not report conflict when the same record contains the unique value", () => {
    const fields: FieldDefinition[] = [
      makeField({ apiName: "Code", label: "Code", dataType: "text", unique: true }),
    ];
    const record: RecordData = { id: "rec-1", fields: { Code: "IDENTICAL" } };
    // Same record evaluated multiple times in the iterable
    expect(() => assertUniqueFieldValues(fields, [record, record])).not.toThrow();
  });

  it("treats email unique field values as case-insensitive", () => {
    const fields: FieldDefinition[] = [
      makeField({ apiName: "Email", label: "Email", dataType: "email", unique: true }),
    ];
    const records: RecordData[] = [
      { id: "rec-1", fields: { Email: "Alice@Example.COM" } },
      { id: "rec-2", fields: { Email: "alice@example.com" } },
    ];
    expect(() => assertUniqueFieldValues(fields, records)).toThrow(ConflictError);

    try {
      assertUniqueFieldValues(fields, records);
      expect.unreachable("should have thrown");
    } catch (error) {
      const conflict = error as ConflictError;
      expect(conflict.message).toBe("Email is already in use.");
    }
  });

  it("treats non-email text unique field values as case-sensitive", () => {
    const fields: FieldDefinition[] = [
      makeField({ apiName: "Code", label: "Code", dataType: "text", unique: true }),
    ];
    const records: RecordData[] = [
      { id: "rec-1", fields: { Code: "ALPHA" } },
      { id: "rec-2", fields: { Code: "alpha" } },
    ];
    // Different cases in text fields do not conflict
    expect(() => assertUniqueFieldValues(fields, records)).not.toThrow();

    // But identical case conflicts
    const recordsWithConflict: RecordData[] = [
      ...records,
      { id: "rec-3", fields: { Code: "ALPHA" } },
    ];
    expect(() => assertUniqueFieldValues(fields, recordsWithConflict)).toThrow(ConflictError);
  });

  it("compares lookup field values by id", () => {
    const fields: FieldDefinition[] = [
      makeField({ apiName: "Account", label: "Account Name", dataType: "lookup", unique: true }),
    ];
    const records: RecordData[] = [
      {
        id: "rec-1",
        fields: {
          Account: { id: "acc-100", module: "Accounts", name: "Acme Corporation" },
        },
      },
      {
        id: "rec-2",
        fields: {
          Account: { id: "acc-100", module: "Accounts", name: "Different Display Name" },
        },
      },
    ];
    expect(() => assertUniqueFieldValues(fields, records)).toThrow(ConflictError);

    try {
      assertUniqueFieldValues(fields, records);
      expect.unreachable("should have thrown");
    } catch (error) {
      const conflict = error as ConflictError;
      expect(conflict.message).toBe("Account Name is already in use.");
    }

    // Different id does not conflict
    const recordsDifferentId: RecordData[] = [
      {
        id: "rec-1",
        fields: {
          Account: { id: "acc-100", module: "Accounts", name: "Acme Corporation" },
        },
      },
      {
        id: "rec-2",
        fields: {
          Account: { id: "acc-200", module: "Accounts", name: "Beta LLC" },
        },
      },
    ];
    expect(() => assertUniqueFieldValues(fields, recordsDifferentId)).not.toThrow();
  });

  it("skips null and undefined unique field values without conflict", () => {
    const fields: FieldDefinition[] = [
      makeField({ apiName: "Email", label: "Email", dataType: "email", unique: true }),
    ];
    const records: RecordData[] = [
      { id: "rec-1", fields: { Email: null } },
      { id: "rec-2", fields: { Email: null } },
      { id: "rec-3", fields: {} },
    ];
    expect(() => assertUniqueFieldValues(fields, records)).not.toThrow();
  });

  it("detects conflict on second unique field when records are provided as single-use iterator", () => {
    const fields: FieldDefinition[] = [
      makeField({ apiName: "Email", label: "Email", dataType: "email", unique: true }),
      makeField({ apiName: "Phone", label: "Phone", dataType: "phone", unique: true }),
    ];
    const recordsMap = new Map<string, RecordData>([
      ["rec-1", { id: "rec-1", fields: { Email: "first@example.com", Phone: "12345" } }],
      ["rec-2", { id: "rec-2", fields: { Email: "second@example.com", Phone: "12345" } }],
    ]);

    expect(() => assertUniqueFieldValues(fields, recordsMap.values())).toThrow(ConflictError);

    try {
      assertUniqueFieldValues(fields, recordsMap.values());
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
      const conflict = error as ConflictError;
      expect(conflict.message).toBe("Phone is already in use.");
    }
  });
});

describe("projectRecordsWithOverrides", () => {
  it("merges patch fields into existing records", () => {
    const records = new Map<string, RecordData>([
      [
        "rec-1",
        {
          id: "rec-1",
          fields: { First_Name: "John", Last_Name: "Doe", Status: "Open", City: "Ankara" },
        },
      ],
      [
        "rec-2",
        {
          id: "rec-2",
          fields: { First_Name: "Jane", Last_Name: "Smith" },
        },
      ],
    ]);

    const overrides = new Map<string, Record<string, string>>([
      ["rec-1", { Status: "Closed", City: "Istanbul" }],
    ]);

    const projected = projectRecordsWithOverrides(records, overrides);

    expect(projected).toHaveLength(2);
    const projectedRec1 = projected.find((record) => record.id === "rec-1");
    const projectedRec2 = projected.find((record) => record.id === "rec-2");

    expect(projectedRec1?.fields).toEqual({
      First_Name: "John",
      Last_Name: "Doe",
      Status: "Closed",
      City: "Istanbul",
    });
    expect(projectedRec2?.fields).toEqual({
      First_Name: "Jane",
      Last_Name: "Smith",
    });
  });

  it("appends records with IDs not present in the existing records map", () => {
    const records = new Map<string, RecordData>([
      ["rec-1", { id: "rec-1", fields: { Name: "Existing" } }],
    ]);

    const overrides = new Map<string, Record<string, string>>([["rec-new", { Name: "Brand New" }]]);

    const projected = projectRecordsWithOverrides(records, overrides);

    expect(projected).toHaveLength(2);
    expect(projected).toContainEqual({ id: "rec-1", fields: { Name: "Existing" } });
    expect(projected).toContainEqual({ id: "rec-new", fields: { Name: "Brand New" } });
  });

  it("does not mutate the input records Map or the original record objects", () => {
    const originalRecord: RecordData = { id: "rec-1", fields: { Name: "Original" } };
    const records = new Map<string, RecordData>([["rec-1", originalRecord]]);
    const overrides = new Map<string, Record<string, string>>([
      ["rec-1", { Name: "Updated" }],
      ["rec-2", { Name: "Added" }],
    ]);

    projectRecordsWithOverrides(records, overrides);

    expect(records.size).toBe(1);
    expect(records.get("rec-1")).toBe(originalRecord);
    expect(originalRecord.fields).toEqual({ Name: "Original" });
    expect(overrides.size).toBe(2);
  });
});
