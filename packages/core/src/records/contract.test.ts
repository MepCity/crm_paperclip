import type { FieldValue, RecordServiceFactory } from "@crm/core/records";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { OrgContext } from "../tenancy/types";

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

// Compile-time assertions: Date, bigint and undefined never become field values.
type IsFieldValue<T> = T extends FieldValue ? true : false;
const invalidValues: [IsFieldValue<Date>, IsFieldValue<bigint>, IsFieldValue<undefined>] = [
  false,
  false,
  false,
];

// A client-facing import must have no runtime exports or service dependencies.
import * as records from "@crm/core/records";

describe("record port type boundary", () => {
  it("exports types without loading a runtime service", () => {
    expect(Object.keys(records)).toEqual([]);
  });

  it("uses an explicit organization context and JSON-compatible field values", () => {
    expectTypeOf<Parameters<RecordServiceFactory>>().toEqualTypeOf<[ctx: OrgContext]>();
    expectTypeOf<FieldValue>().toExtend<JsonValue>();
    expect(invalidValues).toEqual([false, false, false]);
    const values: FieldValue[] = [
      null,
      "Lead 001",
      "9007199254740993",
      "2026-01-01T00:00:00.000Z",
      42,
      12.5,
      true,
      { module: "Contacts", id: "synthetic-reference" },
    ];
    expect(JSON.parse(JSON.stringify(values))).toEqual(values);
  });
});
