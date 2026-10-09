import type { FieldDefinition, ModuleMetadata } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { describe, expect, it } from "vitest";
import {
  buildFormModel,
  formFields,
  formPayload,
  initialFormValues,
  numberValue,
  textValue,
} from "./form-model";
import { leadsFormRules, leadsFormFields as names } from "./leads-form-rules";

function field(apiName: string, options: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...options,
  };
}
const metadata: ModuleMetadata = {
  apiName: "Examples",
  singularLabel: "Example",
  pluralLabel: "Examples",
  businessCardFields: [],
  fields: [
    field("Later"),
    field("Required", { required: true }),
    field("ReadOnly", { readOnly: true }),
    field("CreateOnly", { views: { view: true, create: true, edit: false, quickCreate: false } }),
    field("Hidden", { views: { view: true, create: false, edit: false, quickCreate: false } }),
  ],
  layout: [
    {
      label: "First section",
      columnCount: 2,
      columns: [["Required", "ReadOnly", "Hidden", "Missing"], ["CreateOnly"]],
      fields: [],
    },
    { label: "Second section", columnCount: 1, columns: [["Later"]], fields: [] },
  ],
};

describe("metadata form model", () => {
  it("keeps section/column order, filters by surface and retains required/read-only flags", () => {
    const create = buildFormModel(metadata, "create");
    expect(create.map((s) => s.label)).toEqual(["First section", "Second section"]);
    expect(create[0]?.columns.map((c) => c.map((f) => f.apiName))).toEqual([
      ["Required", "ReadOnly"],
      ["CreateOnly"],
    ]);
    expect(create[0]?.columns[0]?.[0]?.required).toBe(true);
    expect(create[0]?.columns[0]?.[1]?.readOnly).toBe(true);
    expect(buildFormModel(metadata, "edit")[0]?.columns[1]).toEqual([]);
  });

  it("maps empty picklists/text to null and preserves zero, false and reference values", () => {
    const fields = [
      field("Text"),
      field("Choice", { dataType: "picklist" }),
      field("Number", { dataType: "double" }),
      field("Boolean", { dataType: "boolean" }),
      field("Reference", { dataType: "lookup" }),
    ];
    const values = initialFormValues(fields, {
      Text: "",
      Choice: "-None-",
      Number: 0,
      Boolean: false,
      Reference: "opaque",
    });
    expect(values).toEqual({
      Text: null,
      Choice: null,
      Number: 0,
      Boolean: false,
      Reference: "opaque",
    });
    expect(textValue(null)).toBe("");
    expect(textValue("text")).toBe("text");
    expect(numberValue(0)).toBe(0);
    expect(numberValue(Number.NaN)).toBeNull();
    expect(numberValue(null)).toBeNull();
  });

  it("omits readonly/image fields and unchanged values while sending explicit clears", () => {
    const fields = [
      field("Text"),
      field("Number", { dataType: "double" }),
      field("Boolean", { dataType: "boolean" }),
      field("Reference", { dataType: "multi_module_lookup" }),
      field("System", { readOnly: true }),
      field("Portrait", { dataType: "profileimage" }),
    ];
    const baseline = {
      Text: "old",
      Number: 0,
      Boolean: false,
      Reference: { module: "Examples", id: "opaque" },
      System: "system",
      Portrait: null,
    };
    const values = {
      ...baseline,
      Text: "",
      Reference: { module: "Examples", id: "opaque" },
      System: "changed",
    };
    expect(formPayload(fields, values, baseline)).toEqual({ Text: null });
    expect(formPayload(fields, values)).toEqual({
      Text: null,
      Number: 0,
      Boolean: false,
      Reference: baseline.Reference,
    });
  });

  it("includes unplaced Leads composite values, excludes Connected To and system fields", async () => {
    const service = createFixtureRecordService({
      orgId: "form-model-org",
      orgSlug: "form-model-org",
      orgName: "Form Model",
      userId: "form-user",
      role: "admin",
    });
    const module = await service.getModule("Leads");
    const fields = formFields(module, buildFormModel(module, "create"), "create", leadsFormRules);
    expect(fields.some((f) => f.apiName === names.salutation)).toBe(true);
    expect(fields.some((f) => f.apiName === names.latitude)).toBe(true);
    expect(fields.some((f) => f.apiName === names.connected)).toBe(false);
    const payload = formPayload(fields, initialFormValues(fields, { [names.owner]: "form-user" }));
    expect(payload[names.owner]).toBe("form-user");
    expect(payload).not.toHaveProperty(names.address);
    expect(payload).not.toHaveProperty(names.coordinates);
    for (const f of module.fields.filter((f) => !f.views.create))
      expect(payload).not.toHaveProperty(f.apiName);
  });
});
