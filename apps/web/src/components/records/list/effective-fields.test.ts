import type { FieldDefinition } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { effectiveColumns, effectiveFilterGroups } from "./effective-fields";

const field = (apiName: string): FieldDefinition => ({
  apiName,
  label: apiName,
  dataType: "text",
  required: false,
  readOnly: false,
  unique: false,
  massUpdate: true,
  views: { view: true, create: true, edit: true, quickCreate: true },
});

describe("active list fields", () => {
  it("adds effective fields to filters and drops retired columns without changing the saved view", () => {
    const fields = [field("Name"), field("Custom_Text")];
    const view = {
      columns: ["Name", "Retired"],
      criteria: { field: "Retired", comparator: "equal", value: "old" },
    };
    expect(effectiveColumns(view.columns, fields).map((field) => field.apiName)).toEqual(["Name"]);
    const groups = effectiveFilterGroups(
      [
        {
          id: "fields",
          label: "Filter By Fields",
          items: [
            { id: "Name", label: "Name" },
            { id: "Retired", label: "Retired" },
          ],
        },
      ],
      fields,
      "Name",
      "Name",
    );
    expect(groups[0]?.items.map((item) => item.id)).toEqual(["Name", "Custom_Text"]);
    expect(groups[0]?.items[1]?.editor).toEqual({ fieldType: "text" });
    expect(view).toEqual({
      columns: ["Name", "Retired"],
      criteria: { field: "Retired", comparator: "equal", value: "old" },
    });
  });
});
