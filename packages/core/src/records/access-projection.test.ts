import { describe, expect, it } from "vitest";
import { projectMetadataForViewer, projectViewForViewer } from "./access-projection";
import type { FieldDefinition, ListView, ModuleMetadata } from "./contract";

const field = (apiName: string): FieldDefinition => ({
  apiName,
  label: apiName,
  dataType: "text",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: false,
  views: { view: true, create: true, edit: true, quickCreate: false },
});

const metadata: ModuleMetadata = {
  apiName: "Leads",
  singularLabel: "Lead",
  pluralLabel: "Leads",
  businessCardFields: ["A", "B"],
  fields: [field("A"), field("B"), field("C")],
  layout: [{ label: "S", columnCount: 1, columns: [["A", "B", "C"]], fields: ["A", "B", "C"] }],
};

describe("viewer-aware projection", () => {
  it("omits hidden fields everywhere and marks read-only ones", () => {
    const out = projectMetadataForViewer(metadata, {
      hidden: new Set(["B"]),
      readOnly: new Set(["C"]),
    });
    expect(out.fields.map((f) => f.apiName)).toEqual(["A", "C"]);
    expect(out.fields.find((f) => f.apiName === "C")?.readOnly).toBe(true);
    expect(out.fields.find((f) => f.apiName === "A")?.readOnly).toBe(false);
    expect(out.layout[0]?.fields).toEqual(["A", "C"]);
    expect(out.layout[0]?.columns).toEqual([["A", "C"]]);
    expect(out.businessCardFields).toEqual(["A"]);
  });

  it("returns the same object when nothing is restricted", () => {
    expect(projectMetadataForViewer(metadata, { hidden: new Set(), readOnly: new Set() })).toBe(
      metadata,
    );
  });

  it("drops hidden columns, sort and criteria from a saved view", () => {
    const view: ListView = {
      id: "v",
      name: "V",
      systemDefined: false,
      isDefault: false,
      columns: ["A", "B"],
      sort: { field: "B", order: "asc" },
      criteria: {
        groupOperator: "and",
        group: [
          { field: "B", comparator: "equal", value: "x" },
          { field: "A", comparator: "equal", value: "y" },
        ],
      },
    };
    const out = projectViewForViewer(view, new Set(["B"]));
    expect(out.columns).toEqual(["A"]);
    expect(out.sort).toBeNull();
    expect(out.criteria).toEqual({
      groupOperator: "and",
      group: [{ field: "A", comparator: "equal", value: "y" }],
    });
  });
});
