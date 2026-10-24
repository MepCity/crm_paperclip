import type { FieldDefinition } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import type { ModuleMergeDefinition } from "@/modules/types";
import { resolveMatchingTableColumns, resolveMergeCriterionFields } from "./merge-config";

const sampleFields: FieldDefinition[] = [
  {
    apiName: "Alpha",
    label: "Alpha",
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Beta",
    label: "Beta",
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
  {
    apiName: "Gamma",
    label: "Gamma",
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
  },
];

const mockMerge: ModuleMergeDefinition = {
  criterionFields: ["Beta", "Alpha"],
  matchingColumns: ["Gamma", "Alpha"],
};

describe("merge config resolvers", () => {
  it("resolves criterion and matching columns from module merge definition", () => {
    expect(
      resolveMergeCriterionFields(mockMerge, sampleFields).map((field) => field.apiName),
    ).toEqual(["Beta", "Alpha"]);
    expect(
      resolveMatchingTableColumns(mockMerge, sampleFields).map((field) => field.apiName),
    ).toEqual(["Gamma", "Alpha"]);
  });
});
