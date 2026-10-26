import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs script without types
import { engineFieldTypes, inventory, render } from "./metadata-inventory.mjs";

function fixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "meta-inv-"));
  const mod = join(dir, "modules", "Things");
  mkdirSync(mod, { recursive: true });
  const field = (data_type: string, extra: object = {}) => ({
    field_label: "SECRET_LABEL",
    api_name: "SECRET_API",
    data_type,
    custom_field: false,
    mass_update: false,
    read_only: false,
    unique: {},
    formula: {},
    lookup: {},
    pick_list_values: [{ display_value: "SECRET_VALUE" }],
    ...extra,
  });
  writeFileSync(
    join(mod, "fields.json"),
    JSON.stringify({
      fields: [
        field("text", { unique: { casesensitive: true }, mass_update: true }),
        field("text", { custom_field: true }),
        field("picklist", { read_only: true }),
        field("lookup", { lookup: { api_name: "x" } }),
        field("weirdtype", { formula: { return_type: "text" } }),
      ],
    }),
  );
  writeFileSync(
    join(mod, "layouts.json"),
    JSON.stringify({
      layouts: [{ name: "SECRET_LAYOUT", sections: [{}, {}] }, { sections: [{}] }],
    }),
  );
  writeFileSync(
    join(mod, "custom_views.json"),
    JSON.stringify({ custom_views: [{ name: "SECRET_VIEW" }, {}] }),
  );
  return dir;
}

describe("metadata-inventory", () => {
  it("counts fields, flags, layouts, sections and views", () => {
    const { rows, total } = inventory(fixture());
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r).toMatchObject({ name: "Things", fields: 5, layouts: 2, sections: 3, views: 2 });
    expect(r.types).toEqual({ text: 2, picklist: 1, lookup: 1, weirdtype: 1 });
    expect(r.flags).toEqual({
      custom: 1,
      system: 4,
      mass_update: 1,
      unique: 1,
      read_only: 1,
      formula: 1,
      lookup: 1,
      picklist: 1,
    });
    expect(total.types.text).toBe(2);
  });

  it("lists metadata types the engine lacks and leaks no labels or values", () => {
    const md = render(fixture());
    expect(md).toMatch(/\| weirdtype \| 1 \|/);
    expect(md).not.toMatch(/SECRET/);
    expect(md).not.toMatch(/\/tmp|\/var\/|meta-inv-/);
  });

  it("reads the engine type list from the contract", () => {
    const types = engineFieldTypes();
    expect(types).toContain("text");
    expect(types).toContain("multi_module_lookup");
  });
});
