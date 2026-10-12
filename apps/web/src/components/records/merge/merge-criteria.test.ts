import type { FieldDefinition, RecordData } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { buildMergeSearchCriteria, initialCriterionRows } from "./merge-criteria";

const field: FieldDefinition = {
  apiName: "Email",
  label: "Email",
  dataType: "email",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
};

describe("merge criteria", () => {
  it("skips empty criterion values", () => {
    const rows = initialCriterionRows([field], { id: "1", fields: { Email: "x@test" } });
    const withBlank = rows.map((row, index) => (index === 0 ? row : { ...row, value: "" }));
    expect(buildMergeSearchCriteria(withBlank, "and")).toEqual({
      field: "Email",
      comparator: "contains",
      value: "x@test",
    });
  });

  it("combines active rows with group operator", () => {
    const source: RecordData = { id: "1", fields: { Email: "a", Company: "Acme" } };
    const rows = initialCriterionRows(
      [field, { ...field, apiName: "Company", label: "Company", dataType: "text" }],
      source,
    );
    const criteria = buildMergeSearchCriteria(rows, "or");
    expect(criteria).toEqual({
      groupOperator: "or",
      group: [
        { field: "Email", comparator: "contains", value: "a" },
        { field: "Company", comparator: "contains", value: "Acme" },
      ],
    });
  });
});
