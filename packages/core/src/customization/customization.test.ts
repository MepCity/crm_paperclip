import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import {
  type BaselineField,
  CustomizationConflictError,
  type CustomizationField,
  type CustomizationPatch,
  type CustomizationSnapshot,
  InMemoryCustomizationAdapter,
  type LayoutDefinition,
  type ModuleBaseline,
  resolveEffectiveModule,
  viewWithApiNames,
} from "./index";
import { baselineSchema, fieldSchema, patchSchema, snapshotSchema } from "./schema";

function present<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing test fixture");
  return value;
}

function field(id: string, extra: Partial<BaselineField> = {}): BaselineField {
  return {
    id,
    apiName: id,
    label: id,
    dataType: "text",
    lifecycle: "active",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
    customizable: ["label", "required", "readOnly", "maxLength", "picklist", "views"],
    serverValue: false,
    systemRequired: false,
    ...extra,
  };
}
function layout(ids = ["name", "description"]): LayoutDefinition {
  return {
    id: "default",
    label: "Default",
    isDefault: true,
    sections: [
      { id: "info", label: "Information", columnCount: 2, fields: ids, columns: [ids, []] },
    ],
  };
}
function baseline(extra: Partial<ModuleBaseline> = {}): ModuleBaseline {
  return {
    apiName: "Examples",
    version: "v1",
    singularLabel: "Example",
    pluralLabel: "Examples",
    fields: [field("name", { required: true, systemRequired: true }), field("description")],
    layouts: [layout()],
    views: [
      {
        id: "all",
        name: "All",
        systemDefined: true,
        isDefault: true,
        columns: ["name"],
        criteria: null,
        sort: { field: "name", order: "asc" },
      },
    ],
    customFieldTypes: ["text", "integer", "picklist"],
    supportedColumnCounts: [1, 2],
    reservedApiNames: ["id"],
    externalCriteriaFields: [],
    capabilities: { edit: true, formula: true, export: false },
    engineCapabilities: { edit: true, formula: false, export: true },
    ...extra,
  };
}
function snapshot(extra: Partial<CustomizationSnapshot> = {}): CustomizationSnapshot {
  return { baselineVersion: "v1", revision: 0, fields: [], fieldPatches: {}, ...extra };
}
function custom(id = "custom"): CustomizationField {
  const { customizable: _, serverValue: __, systemRequired: ___, ...result } = field(id);
  return result;
}

const hidden = { view: false, create: false, edit: false, quickCreate: false };

describe("effective metadata resolver", () => {
  it("inherits baseline and applies ordered overlays without mutating either input", () => {
    const base = baseline();
    const overlay = snapshot({
      revision: 4,
      fields: [custom()],
      fieldPatches: { description: { label: "Details", views: hidden } },
      layouts: [layout(["custom", "name", "description"])],
    });
    const before = structuredClone({ base, overlay });
    const result = resolveEffectiveModule(base, overlay);
    expect(result.revision).toBe(4);
    expect(result.inheritsBaselineLayouts).toBe(false);
    expect(result.fields.map((entry) => entry.id)).toEqual(["name", "description", "custom"]);
    expect(result.fields[1]).toMatchObject({ label: "Details", views: hidden });
    expect(result.layouts[0]?.sections[0]?.columns[0]).toEqual(["custom", "name", "description"]);
    expect(result.capabilities).toEqual({ edit: true, formula: false, export: false });
    expect(result.fields[0]).not.toHaveProperty("customizable");
    expect({ base, overlay }).toEqual(before);
    expect(resolveEffectiveModule(base, overlay)).toEqual(result);
    expect(resolveEffectiveModule(base)).toMatchObject({
      baselineVersion: "v1",
      revision: 0,
      inheritsBaselineLayouts: true,
    });
  });

  it.each(["$type", "$link_url"])("accepts baseline-only API name %s", (apiName) => {
    const base = baseline({ fields: [field("name", { apiName }), field("description")] });
    expect(baselineSchema.parse(base).fields[0]?.apiName).toBe(apiName);
    expect(resolveEffectiveModule(base).fields[0]?.apiName).toBe(apiName);
    expect(fieldSchema.safeParse({ ...custom(), apiName }).success).toBe(false);
    expect(patchSchema.safeParse({ addFields: [{ ...custom(), apiName }] }).success).toBe(false);
    expect(snapshotSchema.safeParse(snapshot({ fields: [{ ...custom(), apiName }] })).success).toBe(
      false,
    );
    expect(() =>
      resolveEffectiveModule(base, snapshot({ fields: [{ ...custom(), apiName }] })),
    ).toThrow(ValidationError);
    expect(patchSchema.safeParse({ fieldPatches: { name: { apiName } } }).success).toBe(false);
  });

  it.each(["$", "$$type", "$1type", "$type-name", "1type", "_type", "type$name"])(
    "rejects malformed baseline API name %s",
    (apiName) => {
      expect(
        baselineSchema.safeParse(baseline({ fields: [field("name", { apiName })] })).success,
      ).toBe(false);
    },
  );

  it("reserves baseline dollar-prefixed API names across active and retired fields", () => {
    for (const lifecycle of ["active", "retired"] as const) {
      const base = baseline({
        fields: [
          ...baseline().fields,
          field("first", { apiName: "$type", lifecycle }),
          field("second", { apiName: "$type" }),
        ],
      });
      expect(() => resolveEffectiveModule(base)).toThrow(
        expect.objectContaining({ fieldErrors: { customization: ["Duplicate API name."] } }),
      );
    }
  });

  it("allows required baseline create-only fields and preserves their edit visibility", () => {
    const base = baseline({
      fields: [
        field("name", { required: true, views: { ...field("name").views, edit: false } }),
        field("description"),
      ],
    });
    for (const overlay of [undefined, snapshot({ fieldPatches: { name: { label: "Title" } } })]) {
      expect(resolveEffectiveModule(base, overlay).fields[0]).toMatchObject({
        required: true,
        readOnly: false,
        views: { create: true, edit: false },
      });
    }
  });

  it("rejects patches hiding edit on baseline-editable required fields", () => {
    expect(() =>
      resolveEffectiveModule(
        baseline(),
        snapshot({
          fieldPatches: {
            name: { views: { ...field("name").views, edit: false } },
          },
        }),
      ),
    ).toThrow(
      expect.objectContaining({
        fieldErrors: { customization: ["Required field is unreachable without a server value."] },
      }),
    );
  });

  it.each([false, true])("rejects required custom create-only fields (patched: %s)", (patched) => {
    const added = { ...custom(), required: true };
    const views = { ...added.views, edit: false };
    const overlay = snapshot({
      fields: [{ ...added, views: patched ? added.views : views }],
      layouts: [layout(["name", "custom"])],
      fieldPatches: patched ? { custom: { views } } : {},
    });
    expect(() => resolveEffectiveModule(baseline(), overlay)).toThrow(
      expect.objectContaining({
        fieldErrors: { customization: ["Required field is unreachable without a server value."] },
      }),
    );
  });

  it.each(["readOnly", "unplaced", "createHidden"])(
    "still rejects unreachable baseline create-only fields: %s",
    (reason) => {
      const base = baseline({
        fields: [
          field("name", {
            required: true,
            readOnly: reason === "readOnly",
            views: { ...field("name").views, create: reason !== "createHidden", edit: false },
          }),
        ],
        layouts: [layout(reason === "unplaced" ? [] : ["name"])],
      });
      expect(() => resolveEffectiveModule(base)).toThrow(
        expect.objectContaining({
          fieldErrors: { customization: ["Required field is unreachable without a server value."] },
        }),
      );
      const reachable = baseline({
        fields: [
          field("name", {
            required: true,
            views: { ...field("name").views, edit: false },
          }),
        ],
        layouts: [layout(["name"])],
      });
      const overlay = snapshot({
        ...(reason === "unplaced"
          ? { layouts: [layout([])] }
          : {
              fieldPatches: {
                name:
                  reason === "readOnly"
                    ? { readOnly: true }
                    : {
                        views: {
                          ...field("name").views,
                          create: false,
                          edit: false,
                        },
                      },
              },
            }),
      });
      expect(() => resolveEffectiveModule(reachable, overlay)).toThrow(
        expect.objectContaining({
          fieldErrors: { customization: ["Required field is unreachable without a server value."] },
        }),
      );
    },
  );

  it("is independent of patch-object insertion order", () => {
    const left = snapshot({
      fieldPatches: { name: { label: "Title" }, description: { label: "Detail" } },
    });
    const right = snapshot({
      fieldPatches: { description: { label: "Detail" }, name: { label: "Title" } },
    });
    expect(JSON.stringify(resolveEffectiveModule(baseline(), left))).toBe(
      JSON.stringify(resolveEffectiveModule(baseline(), right)),
    );
  });

  it.each([
    ["unknown field", { fieldPatches: { missing: { label: "Unknown" } } }],
    ["immutable API name", { fieldPatches: { name: { apiName: "other" } } }],
    ["unknown command key", { executableAction: "replace" }],
    ["system required", { fieldPatches: { name: { required: false } } }],
    ["required visibility", { fieldPatches: { name: { views: hidden } } }],
    ["required edit control", { fieldPatches: { name: { readOnly: true } } }],
    ["duplicate ID", { fields: [custom("description")] }],
    ["reserved API name", { fields: [{ ...custom(), apiName: "id" }] }],
    ["duplicate API name", { fields: [{ ...custom(), apiName: "name" }] }],
    ["unsupported type", { fields: [{ ...custom(), dataType: "formula" }] }],
    ["unknown layout reference", { layouts: [layout(["name", "missing"])] }],
    ["missing required placement", { layouts: [layout(["description"])] }],
    ["duplicate placement", { layouts: [layout(["name", "name"])] }],
    ["multiple layouts", { layouts: [layout(), { ...layout(), id: "second" }] }],
    ["missing default layout", { layouts: [{ ...layout(), isDefault: false }] }],
    ["invalid revision", { revision: -1 }],
    ["old baseline version", { baselineVersion: "old" }],
  ])("rejects %s", (_label, extra) => {
    expect(() =>
      resolveEffectiveModule(baseline(), {
        ...snapshot(),
        ...extra,
      } as unknown as CustomizationSnapshot),
    ).toThrow(ValidationError);
  });

  it("validates section identities and supported column counts", () => {
    const section = layout().sections[0];
    if (!section) throw new Error("Missing test section");
    expect(() =>
      resolveEffectiveModule(
        baseline(),
        snapshot({
          layouts: [
            {
              ...layout(),
              sections: [{ ...section, columnCount: 3, columns: [["name"], [], []] }],
            },
          ],
        }),
      ),
    ).toThrow(ValidationError);
    expect(() =>
      resolveEffectiveModule(
        baseline(),
        snapshot({ layouts: [{ ...layout(), sections: [{ ...section, columnCount: 1 }] }] }),
      ),
    ).toThrow(ValidationError);
    expect(() =>
      resolveEffectiveModule(
        baseline(),
        snapshot({
          layouts: [{ ...layout(), sections: [section, { ...section, columns: [[], []] }] }],
        }),
      ),
    ).toThrow(ValidationError);
  });

  it("enforces baseline property allowlists, system ownership and length invariants", () => {
    for (const original of [
      field("description", { customizable: [] }),
      field("description", { readOnly: true }),
      field("description", { maxLength: 20 }),
    ]) {
      expect(() =>
        resolveEffectiveModule(
          baseline({ fields: [field("name"), original] }),
          snapshot({
            fieldPatches: { description: { label: "Renamed", readOnly: false, maxLength: 30 } },
          }),
        ),
      ).toThrow(ValidationError);
    }
  });

  it("allows a required server-provided value without a form control", () => {
    const base = baseline({
      fields: [
        field("name", {
          required: true,
          readOnly: true,
          systemRequired: true,
          serverValue: true,
          views: hidden,
        }),
      ],
      layouts: [layout([])],
    });
    expect(resolveEffectiveModule(base).fields[0]?.required).toBe(true);
  });

  it("retains retired names while rejecting layout and patch references to tombstones", () => {
    const retired = { ...custom(), lifecycle: "retired" as const };
    expect(resolveEffectiveModule(baseline(), snapshot({ fields: [retired] })).fields).toHaveLength(
      2,
    );
    for (const extra of [
      { fields: [retired, { ...custom("new"), apiName: retired.apiName }] },
      { fields: [retired], layouts: [layout(["name", "custom"])] },
      { fields: [retired], fieldPatches: { custom: { label: "Retired" } } },
    ])
      expect(() => resolveEffectiveModule(baseline(), snapshot(extra))).toThrow(ValidationError);
  });

  it("validates active saved-view columns, sorts and criteria without silently removing them", () => {
    const view = {
      id: "private",
      name: "Private",
      systemDefined: false,
      isDefault: false,
      columns: ["description"],
      criteria: null,
      sort: null,
    };
    for (const extra of [
      { columns: ["missing"] },
      { systemDefined: true },
      { sort: { field: "missing", order: "asc" } },
      { criteria: { field: "missing", comparator: "equal", value: "test" } },
      { criteria: { field: "description", comparator: "unknown", value: "test" } },
      { criteria: { field: "description", comparator: "equal", value: 5 } },
      { criteria: { groupOperator: "and", group: [] } },
    ])
      expect(() =>
        resolveEffectiveModule(
          baseline(),
          snapshot({
            views: [...baseline().views, { ...view, ...extra }],
          } as unknown as Partial<CustomizationSnapshot>),
        ),
      ).toThrow(ValidationError);
    const result = resolveEffectiveModule(
      baseline(),
      snapshot({
        views: [
          ...baseline().views,
          {
            ...view,
            criteria: {
              groupOperator: "and",
              group: [{ field: "description", comparator: "contains", value: "test" }],
            },
          },
        ],
      }),
    );
    expect(result.views).toHaveLength(2);
    expect(() => resolveEffectiveModule(baseline(), snapshot({ views: [] }))).toThrow(
      ValidationError,
    );
  });

  it("resolves stable view IDs through immutable API names", () => {
    const base = baseline({
      fields: [field("name", { apiName: "Record_Name" }), field("description")],
      views: [
        {
          id: "all",
          name: "All",
          systemDefined: true,
          isDefault: true,
          columns: ["name"],
          sort: { field: "name", order: "asc" },
          criteria: { field: "name", comparator: "contains", value: "sample" },
        },
      ],
    });
    expect(resolveEffectiveModule(base).views[0]?.criteria).toEqual(base.views[0]?.criteria);
    expect(resolveEffectiveModule(base).fields[0]?.apiName).toBe("Record_Name");
  });

  it("preserves nested external criteria in baseline and replacement views", () => {
    const external = {
      field: "Common_Status",
      comparator: "equal" as const,
      value: { token: "ANY" },
    };
    const base = baseline({
      externalCriteriaFields: ["Common_Status"],
      fields: [field("name", { apiName: "Record_Name" }), field("description")],
    });
    const view = {
      ...present(base.views[0]),
      criteria: {
        groupOperator: "and" as const,
        group: [
          { field: "name", comparator: "contains" as const, value: "sample" },
          { groupOperator: "or" as const, group: [external] },
        ],
      },
    };
    base.views = [view];
    for (const overlay of [undefined, snapshot({ views: [view] })]) {
      const result = resolveEffectiveModule(base, overlay);
      expect(result.externalCriteriaFields).toEqual(["Common_Status"]);
      expect(result.views[0]?.criteria).toEqual(view.criteria);
      expect(viewWithApiNames(result, present(result.views[0]))).toEqual({
        ...view,
        columns: ["Record_Name"],
        sort: { field: "Record_Name", order: "asc" },
        criteria: {
          ...view.criteria,
          group: [
            { field: "Record_Name", comparator: "contains", value: "sample" },
            { groupOperator: "or", group: [external] },
          ],
        },
      });
      expect(viewWithApiNames(result, present(result.views[0]))).not.toBe(result.views[0]);
    }
  });

  it.each(["columns", "sort", "unknown criterion", "invalid comparator", "typed criterion"])(
    "rejects invalid view reference: %s in baseline and overlay",
    (kind) => {
      const base = baseline({ externalCriteriaFields: ["Common_Status"] });
      const original = { ...present(base.views[0]), systemDefined: false };
      const variants = {
        columns: { columns: ["Common_Status"] },
        sort: { sort: { field: "Common_Status", order: "asc" } },
        "unknown criterion": { criteria: { field: "Unknown", comparator: "equal", value: null } },
        "invalid comparator": {
          criteria: { field: "Common_Status", comparator: "invalid", value: null },
        },
        "typed criterion": { criteria: { field: "name", comparator: "equal", value: 42 } },
      };
      const view = { ...original, ...variants[kind as keyof typeof variants] } as typeof original;
      expect(() => viewWithApiNames(resolveEffectiveModule(base), view)).toThrow(ValidationError);
      expect(() => resolveEffectiveModule({ ...base, views: [view] })).toThrow(ValidationError);
      expect(() =>
        resolveEffectiveModule(
          base,
          snapshot({ views: [...base.views, { ...view, id: "other" }] }),
        ),
      ).toThrow(ValidationError);
    },
  );

  it.each(["stable", "Record_Name", "id", "retired", "custom", "Custom_API"])(
    "rejects external criterion collision with %s",
    (name) => {
      const base = baseline({
        fields: [
          field("stable", { apiName: "Record_Name" }),
          field("retired", { lifecycle: "retired" }),
        ],
        layouts: [layout(["stable"])],
        views: [],
        externalCriteriaFields: [name],
      });
      expect(() =>
        resolveEffectiveModule(
          base,
          snapshot({ fields: [{ ...custom(), apiName: "Custom_API" }] }),
        ),
      ).toThrow(ValidationError);
    },
  );

  it("rejects duplicate external names and missing required metadata", () => {
    expect(() =>
      resolveEffectiveModule(
        baseline({ externalCriteriaFields: ["Common_Status", "Common_Status"] }),
      ),
    ).toThrow(ValidationError);
    const base = baseline();
    const { externalCriteriaFields: _, ...missing } = base;
    expect(() => resolveEffectiveModule(missing as ModuleBaseline)).toThrow(ValidationError);
    const { fields: __, ...section } = present(present(base.layouts[0]).sections[0]);
    expect(() =>
      resolveEffectiveModule(
        baseline({
          layouts: [{ ...layout(), sections: [section] }],
        } as unknown as Partial<ModuleBaseline>),
      ),
    ).toThrow(ValidationError);
  });

  it("keeps ordered section membership independent of columns and visibility", () => {
    const base = baseline({ fields: [...baseline().fields, field("hidden", { views: hidden })] });
    const section = { ...present(layout().sections[0]), fields: ["hidden", "description", "name"] };
    const ordered = { ...layout(), sections: [section] };
    for (const overlay of [undefined, snapshot({ layouts: [ordered] })]) {
      const result = resolveEffectiveModule({ ...base, layouts: [ordered] }, overlay);
      expect(result.layouts[0]?.sections[0]).toEqual(section);
      expect(Object.isFrozen(result.layouts[0]?.sections[0]?.fields)).toBe(true);
    }
    const repeated = {
      ...ordered,
      sections: [section, { ...section, id: "second", columns: [[], []] }],
    };
    expect(
      resolveEffectiveModule({ ...base, layouts: [repeated] }).layouts[0]?.sections,
    ).toHaveLength(2);
  });

  it.each(["unknown", "retired", "duplicate", "outside", "required without placement"])(
    "rejects invalid section membership: %s",
    (kind) => {
      const base = baseline({
        fields: [...baseline().fields, field("retired", { lifecycle: "retired" })],
      });
      const section = present(layout().sections[0]);
      const variants = {
        unknown: { fields: [...section.fields, "missing"] },
        retired: { fields: [...section.fields, "retired"] },
        duplicate: { fields: [...section.fields, "description"] },
        outside: { fields: ["name"] },
        "required without placement": { columns: [["description"], []] },
      };
      const changed = {
        ...layout(),
        sections: [{ ...section, ...variants[kind as keyof typeof variants] }],
      };
      expect(() => resolveEffectiveModule({ ...base, layouts: [changed] })).toThrow(
        ValidationError,
      );
      expect(() => resolveEffectiveModule(base, snapshot({ layouts: [changed] }))).toThrow(
        ValidationError,
      );
    },
  );

  it("rejects invalid constraints and unsupported property shapes", () => {
    for (const patch of [
      { maxLength: -1 },
      { required: undefined },
      { picklist: [{ displayValue: "One", storedValue: "1" }] },
      { views: { create: false } },
      { min: 1 },
    ])
      expect(() =>
        resolveEffectiveModule(
          baseline(),
          snapshot({
            fieldPatches: { description: patch },
          } as unknown as Partial<CustomizationSnapshot>),
        ),
      ).toThrow(ValidationError);
    const choice = {
      ...custom(),
      dataType: "picklist" as const,
      picklist: [
        { displayValue: "One", storedValue: "same" },
        { displayValue: "Two", storedValue: "same" },
      ],
    };
    expect(() => resolveEffectiveModule(baseline(), snapshot({ fields: [choice] }))).toThrow(
      ValidationError,
    );
  });
});

describe("in-memory customization port", () => {
  it("isolates tenants and modules, including keys that would collide when concatenated", async () => {
    const store = new InMemoryCustomizationAdapter([baseline(), baseline({ apiName: "Other" })]);
    await store.applyPatch("alpha", "Examples", 0, {
      fieldPatches: { name: { label: "Tenant title" } },
    });
    expect((await store.readEffective("alpha", "Examples")).fields[0]?.label).toBe("Tenant title");
    expect((await store.readEffective("beta", "Examples")).fields[0]?.label).toBe("name");
    expect((await store.readEffective("alpha", "Other")).revision).toBe(0);
    await expect(store.readEffective("", "Examples")).rejects.toThrow(ValidationError);
    await expect(store.readEffective("alpha", "Unknown")).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("keeps structured tenant/module keys separate", async () => {
    const store = new InMemoryCustomizationAdapter([
      baseline({ apiName: "b:c" }),
      baseline({ apiName: "c" }),
    ]);
    await store.applyPatch("a", "b:c", 0, { fieldPatches: { name: { label: "First key" } } });
    await store.applyPatch("a:b", "c", 0, { fieldPatches: { name: { label: "Second key" } } });
    expect((await store.readEffective("a", "b:c")).fields[0]?.label).toBe("First key");
    expect((await store.readEffective("a:b", "c")).fields[0]?.label).toBe("Second key");
  });

  it("publishes exactly one winner for concurrent CAS attempts and reports typed conflicts", async () => {
    const store = new InMemoryCustomizationAdapter([baseline()]);
    const results = await Promise.allSettled([
      store.applyPatch("alpha", "Examples", 0, { fieldPatches: { name: { label: "First" } } }),
      store.applyPatch("alpha", "Examples", 0, { fieldPatches: { name: { label: "Second" } } }),
    ]);
    expect(results[0]?.status).toBe("fulfilled");
    expect(results[1]?.status).toBe("rejected");
    if (results[1]?.status === "rejected") {
      expect(results[1].reason).toBeInstanceOf(CustomizationConflictError);
      expect(results[1].reason).toMatchObject({
        expectedRevision: 0,
        actualRevision: 1,
        code: "conflict",
      });
    }
    expect((await store.readEffective("alpha", "Examples")).revision).toBe(1);
  });

  it("rolls back the complete candidate on invalid patches without consuming a revision", async () => {
    const store = new InMemoryCustomizationAdapter([baseline()]);
    const before = await store.readEffective("alpha", "Examples");
    await expect(
      store.applyPatch("alpha", "Examples", 0, {
        addFields: [custom()],
        fieldPatches: { name: { label: "Changed" } },
        layouts: [layout(["name", "missing"])],
      }),
    ).rejects.toThrow(ValidationError);
    expect(await store.readEffective("alpha", "Examples")).toEqual(before);
    await expect(
      store.applyPatch("alpha", "Examples", 0, { addFields: [custom()] }),
    ).resolves.toMatchObject({ revision: 1 });
    await expect(
      store.applyPatch("alpha", "Examples", 1, {
        addFields: [{ ...custom("retired"), lifecycle: "retired" }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("uses defensive copies and deep immutability for all inputs and outputs", async () => {
    const base = baseline();
    const store = new InMemoryCustomizationAdapter([base]);
    const inputField = base.fields[0];
    if (!inputField) throw new Error("Missing test field");
    inputField.label = "External mutation";
    const patch = {
      fieldPatches: { description: { label: "Details", views: { ...hidden } } },
      layouts: [layout()],
    };
    const result = await store.applyPatch("alpha", "Examples", 0, patch);
    patch.fieldPatches.description.label = "Changed";
    patch.fieldPatches.description.views.view = true;
    expect(Object.isFrozen(patch.layouts[0])).toBe(false);
    expect(Object.isFrozen(result.layouts[0]?.sections[0]?.columns[0])).toBe(true);
    expect(() => {
      const outputField = result.fields[0];
      if (!outputField) throw new Error("Missing test field");
      outputField.label = "Bad";
    }).toThrow(TypeError);
    expect((await store.readEffective("alpha", "Examples")).fields[1]?.label).toBe("Details");
    expect((await store.readEffective("alpha", "Examples")).fields[1]?.views.view).toBe(false);
    expect((await store.readEffective("beta", "Examples")).fields[0]?.label).toBe("name");
  });

  it("merges successive field patches, preserving prior additions and placement", async () => {
    const store = new InMemoryCustomizationAdapter([baseline()]);
    await store.applyPatch("alpha", "Examples", 0, {
      addFields: [custom()],
      layouts: [layout(["custom", "name"])],
      fieldPatches: { custom: { label: "Custom label" } },
    });
    const result = await store.applyPatch("alpha", "Examples", 1, {
      fieldPatches: { custom: { required: true }, description: { label: "Details" } },
    });
    expect(result.fields[2]).toMatchObject({ label: "Custom label", required: true });
    expect(result.layouts[0]?.sections[0]?.columns[0]).toEqual(["custom", "name"]);
  });

  it("upgrades every tenant atomically and preserves overlays with new revision tags", async () => {
    const store = new InMemoryCustomizationAdapter([baseline()]);
    await store.applyPatch("alpha", "Examples", 0, {
      addFields: [custom()],
      fieldPatches: { description: { label: "Tenant label" } },
    });
    const upgraded = baseline({
      version: "v2",
      pluralLabel: "Updated examples",
      fields: [...baseline().fields, field("extra")],
    });
    store.upgradeBaseline(upgraded);
    const upgradedField = upgraded.fields[0];
    if (!upgradedField) throw new Error("Missing test field");
    upgradedField.label = "Input mutation";
    const result = await store.readEffective("alpha", "Examples");
    expect(result).toMatchObject({
      baselineVersion: "v2",
      revision: 2,
      pluralLabel: "Updated examples",
    });
    expect(result.fields.map((entry) => entry.id)).toEqual([
      "name",
      "description",
      "extra",
      "custom",
    ]);
    expect(result.fields[1]?.label).toBe("Tenant label");
    expect(await store.readEffective("untouched", "Examples")).toMatchObject({
      revision: 1,
      baselineVersion: "v2",
    });
    await expect(store.applyPatch("untouched", "Examples", 0, {})).rejects.toThrow(
      CustomizationConflictError,
    );
    await expect(store.applyPatch("alpha", "Examples", 1, {})).rejects.toThrow(
      CustomizationConflictError,
    );
  });

  it("rejects an incompatible upgrade across all tenants and retains the last compatible baseline", async () => {
    const store = new InMemoryCustomizationAdapter([baseline()]);
    await store.applyPatch("alpha", "Examples", 0, {
      fieldPatches: { name: { label: "First tenant" } },
    });
    await store.applyPatch("beta", "Examples", 0, { addFields: [custom()] });
    const before = await Promise.all(
      ["alpha", "beta", "untouched"].map((org) => store.readEffective(org, "Examples")),
    );
    expect(() =>
      store.upgradeBaseline(
        baseline({
          version: "v2",
          fields: [...baseline().fields, field("collision", { apiName: "custom" })],
        }),
      ),
    ).toThrow(ValidationError);
    expect(
      await Promise.all(
        ["alpha", "beta", "untouched"].map((org) => store.readEffective(org, "Examples")),
      ),
    ).toEqual(before);
    for (const changed of [
      baseline(),
      baseline({ version: "v2", fields: [field("name")] }),
      baseline({ version: "v2", reservedApiNames: [] }),
    ])
      expect(() => store.upgradeBaseline(changed)).toThrow(ValidationError);
  });

  it("does not materialize overlays on reads and rejects malformed patch/revision inputs", async () => {
    const store = new InMemoryCustomizationAdapter([baseline()]);
    await store.readEffective("alpha", "Examples");
    // A read-only tenant inherits newly upgraded defaults rather than a copied old layout.
    store.upgradeBaseline(baseline({ version: "v2", layouts: [layout(["description", "name"])] }));
    expect(
      (await store.readEffective("alpha", "Examples")).layouts[0]?.sections[0]?.columns[0],
    ).toEqual(["description", "name"]);
    for (const revision of [-1, 0.5, Number.NaN]) {
      await expect(store.applyPatch("alpha", "Examples", revision, {})).rejects.toThrow(
        ValidationError,
      );
    }
    await expect(
      store.applyPatch("alpha", "Examples", 1, {
        fieldPatches: { description: { dataType: "integer" } },
      } as CustomizationPatch),
    ).rejects.toThrow(ValidationError);
  });
});
