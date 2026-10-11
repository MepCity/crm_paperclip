import { describe, expect, it } from "vitest";
import { ValidationError } from "../../errors";
import type { Criteria, FieldDefinition, FieldValue, RecordData } from "../contract";
import { leadsMetadata } from "./metadata";
import { matches, sortRecords, validateCriteria } from "./query";
import { resolveRecordReferences } from "./references";
import { acceptsFieldValue, validateInput } from "./validation";

const field = (dataType: FieldDefinition["dataType"]): FieldDefinition => ({
  apiName: "Value",
  label: "Value",
  dataType,
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
  ...(dataType === "lookup" ? { lookup: { module: "Leads" } } : {}),
});
const row = (value: FieldValue, id = "1"): RecordData => ({ id, fields: { Value: value } });
const runtime = { userId: "member", now: new Date("2026-03-01T18:00:00Z") };

describe("calendar date contract", () => {
  it.each(["2024-02-29", "2026-02-28", "0001-01-01", "0099-12-31"])("accepts %s", (value) => {
    expect(acceptsFieldValue(field("date"), value)).toBe(true);
  });
  it.each([
    "2026-02-30",
    "2026-02-29",
    "2026-13-01",
    "2026-00-01",
    "2026-01-00",
    "2026-1-01",
    "2026-01-01T00:00:00Z",
  ])("rejects %s", (value) => {
    expect(acceptsFieldValue(field("date"), value)).toBe(false);
    expect(() => validateInput({ Value: value }, false, [field("date")])).toThrow(ValidationError);
  });
  it("sorts by calendar day and leaves empties last", () => {
    const fields = new Map([["Value", field("date")]]);
    expect(
      sortRecords(
        [row("2026-03-01", "1"), row(null, "2"), row("2025-12-31", "3")],
        { field: "Value", order: "asc" },
        fields,
      ).map((r) => r.id),
    ).toEqual(["3", "1", "2"]);
  });
  it.each([
    ["equal", "2026-03-01", true],
    ["less_than", "2026-03-02", true],
    ["greater_than", "2026-02-28", true],
    ["between", ["2026-02-28", "2026-03-01"], true],
    ["not_between", ["2026-02-28", "2026-03-01"], false],
    ["equal", { token: "TODAY" }, true],
    ["equal", { token: "PERIOD", name: "THIS_MONTH" }, true],
    ["equal", { token: "RELATIVE", direction: "previous", count: 1, unit: "days" }, false],
    ["less_equal", { token: "AGEINDAYS", offset: 0 }, true],
    ["less_equal", { token: "DUEINDAYS", offset: 1 }, false],
  ] as const)("evaluates %s at day precision", (comparator, value, expected) => {
    const fields = new Map([["Value", field("date")]]);
    const criteria = { field: "Value", comparator, value } as Criteria;
    validateCriteria(criteria, fields);
    expect(matches(row("2026-03-01"), criteria, runtime, fields)).toBe(expected);
  });
  it.each([
    ["TOMORROW", false],
    ["YESTERDAY", false],
    ["TILL_YESTERDAY", false],
    ["STARTING_TOMORROW", false],
    ["THIS_WEEK", true],
    ["PREVIOUS_WEEK", false],
    ["THIS_MONTH", true],
    ["PREVIOUS_MONTH", false],
    ["THIS_YEAR", true],
    ["PREVIOUS_YEAR", false],
    ["NEXT_YEAR", false],
  ] as const)("supports the %s calendar period", (name, expected) => {
    const fields = new Map([["Value", field("date")]]);
    const criteria: Criteria = {
      field: "Value",
      comparator: "equal",
      value: { token: "PERIOD", name },
    };
    validateCriteria(criteria, fields);
    expect(matches(row("2026-03-01"), criteria, runtime, fields)).toBe(expected);
  });
  it("rejects invalid date criteria with ValidationError", () => {
    expect(() =>
      validateCriteria(
        { field: "Value", comparator: "equal", value: "2026-02-30" },
        new Map([["Value", field("date")]]),
      ),
    ).toThrow(ValidationError);
  });
});

describe("named lookup contract", () => {
  it("requires the declared module and accepts only an optional string name", () => {
    expect(acceptsFieldValue(field("lookup"), { module: "Leads", id: "1", name: "Caller" })).toBe(
      true,
    );
    expect(acceptsFieldValue(field("lookup"), { module: "Accounts", id: "1" })).toBe(false);
    expect(acceptsFieldValue(field("lookup"), "1")).toBe(false);
    expect(
      acceptsFieldValue(field("multi_module_lookup"), {
        module: "Accounts",
        id: "1",
        name: "Account",
      }),
    ).toBe(true);
    expect(
      acceptsFieldValue(field("lookup"), {
        module: "Leads",
        id: "1",
        name: 1,
      } as unknown as FieldValue),
    ).toBe(false);
    expect(acceptsFieldValue(field("ownerlookup"), "member")).toBe(true);
  });
  it("derives registered target names and rejects missing or foreign targets", () => {
    const modules = new Map([
      [
        "Leads",
        {
          displayNameField: "Full_Name",
          getRecord: (id: string) =>
            id === "local" ? { id, fields: { Full_Name: "Target Name" } } : undefined,
        },
      ],
    ]);
    const input = row({ module: "Leads", id: "local", name: "Forged" });
    expect(resolveRecordReferences(input, [field("lookup")], modules).fields.Value).toEqual({
      module: "Leads",
      id: "local",
      name: "Target Name",
    });
    expect(input.fields.Value).toEqual({ module: "Leads", id: "local", name: "Forged" });
    for (const id of ["missing", "foreign"]) {
      expect(
        resolveRecordReferences(row({ module: "Leads", id }), [field("lookup")], modules).fields
          .Value,
      ).toBeNull();
      expect(() =>
        resolveRecordReferences(row({ module: "Leads", id }), [field("lookup")], modules, {
          requireRegisteredTargets: true,
        }),
      ).toThrow(ValidationError);
    }
    expect(() =>
      resolveRecordReferences(row({ module: "Accounts", id: "local" }), [field("lookup")], modules),
    ).toThrow(ValidationError);
  });
  it("preserves unregistered targets with or without names", () => {
    for (const value of [
      { module: "Accounts", id: "external", name: "Account" },
      { module: "Accounts", id: "external" },
    ]) {
      const lookup = { ...field("lookup"), lookup: { module: "Accounts" } };
      expect(resolveRecordReferences(row(value), [lookup], new Map())).toEqual(row(value));
    }
  });
  it("uses names for text predicates and sort; missing names are empty", () => {
    const fields = new Map([["Value", field("lookup")]]);
    const named = row({ module: "Leads", id: "999", name: "Alpha" });
    const unnamed = row({ module: "Leads", id: "000" }, "2");
    for (const [comparator, value] of [
      ["contains", "LP"],
      ["starts_with", "AL"],
      ["ends_with", "HA"],
      ["equal", "alpha"],
    ] as const) {
      const criteria = { field: "Value", comparator, value };
      validateCriteria(criteria, fields);
      expect(matches(named, criteria, runtime, fields)).toBe(true);
      expect(matches(unnamed, criteria, runtime, fields)).toBe(false);
    }
    expect(
      matches(unnamed, { field: "Value", comparator: "is_empty", value: null }, runtime, fields),
    ).toBe(true);
    expect(
      sortRecords(
        [unnamed, named, row({ module: "Leads", id: "1", name: "Beta" }, "3")],
        { field: "Value", order: "asc" },
        fields,
      ).map((r) => r.id),
    ).toEqual(["1", "3", "2"]);
  });
});

describe("Leads conversion lookups", () => {
  it.each(["Converted_Account", "Converted_Contact", "Converted_Deal"])(
    "keeps %s system managed",
    (apiName) => {
      const definition = leadsMetadata.fields.find((f) => f.apiName === apiName);
      expect(definition?.readOnly).toBe(true);
      const value = { module: definition?.lookup?.module ?? "", id: "external", name: "Target" };
      for (const partial of [false, true])
        expect(() =>
          validateInput(
            { Last_Name: "Example", Company: "Example Company", [apiName]: value },
            partial,
          ),
        ).toThrow(ValidationError);
    },
  );
});
