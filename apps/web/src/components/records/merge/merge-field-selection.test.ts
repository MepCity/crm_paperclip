import type { FieldDefinition, RecordData } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  buildMergeValues,
  defaultFieldChoices,
  isMergeValueSelectable,
  valuesConflict,
} from "./merge-field-selection";

const textField: FieldDefinition = {
  apiName: "Email",
  label: "Email",
  dataType: "email",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
};

const readOnlyField: FieldDefinition = {
  ...textField,
  apiName: "Modified_Time",
  label: "Modified Time",
  dataType: "datetime",
  readOnly: true,
};

const record = (id: string, fields: Record<string, string>): RecordData => ({
  id,
  fields,
});

describe("merge field selection", () => {
  it("enables Next only with two or three selected records via conflict detection", () => {
    expect(valuesConflict(["a", "b"])).toBe(true);
    expect(valuesConflict(["a", "a"])).toBe(false);
    expect(valuesConflict([null, ""])).toBe(false);
  });

  it("defaults choices to the master when it has a value", () => {
    const records = [record("1", { Email: "one@test" }), record("2", { Email: "two@test" })];
    const choices = defaultFieldChoices([textField], records, "1");
    expect(choices.Email).toBe("1");
  });

  it("omits read-only fields from merge payload", () => {
    const records = [
      record("1", { Email: "one@test", Modified_Time: "2020-01-01T00:00:00.000Z" }),
      record("2", { Email: "two@test", Modified_Time: "2021-01-01T00:00:00.000Z" }),
    ];
    const choices = { Email: "2", Modified_Time: "2" };
    const values = buildMergeValues([textField, readOnlyField], records, choices);
    expect(values).toEqual({ Email: "two@test" });
    expect(isMergeValueSelectable(readOnlyField)).toBe(false);
  });

  it("falls back to the first non-empty value when the master is empty", () => {
    const records = [
      record("1", { Email: "one@test", First_Name: "" }),
      record("2", { Email: "two@test", First_Name: "Ada" }),
    ];
    const firstName: FieldDefinition = { ...textField, apiName: "First_Name", label: "First Name" };
    const choices = defaultFieldChoices([textField, firstName], records, "1");
    expect(choices.First_Name).toBe("2");
    expect(choices.Email).toBe("1");
  });
});
