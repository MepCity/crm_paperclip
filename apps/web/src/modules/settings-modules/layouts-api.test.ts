import type { LayoutDefinition } from "@crm/core/customization";
import { describe, expect, it, vi } from "vitest";
import {
  addSection,
  hideField,
  moveFieldInColumn,
  moveFieldToColumn,
  placeField,
  removeSection,
  renameSection,
  reorderSection,
  saveLayout,
  setSectionColumnCount,
} from "./layouts-api";

const sampleLayout: LayoutDefinition = {
  id: "Leads:layout:default",
  label: "Standard",
  isDefault: true,
  sections: [
    {
      id: "sec-1",
      label: "Lead Information",
      columnCount: 2,
      columns: [
        ["field:First_Name", "field:Last_Name"],
        ["field:Email", "field:Phone"],
      ],
      fields: ["field:First_Name", "field:Last_Name", "field:Email", "field:Phone"],
    },
    {
      id: "sec-2",
      label: "Address Information",
      columnCount: 1,
      columns: [["field:Street", "field:City"]],
      fields: ["field:Street", "field:City"],
    },
  ],
};

describe("layouts-api pure layout transforms", () => {
  it("reorders sections correctly", () => {
    const reordered = reorderSection(sampleLayout, 0, 1);
    expect(reordered.sections[0]?.id).toBe("sec-2");
    expect(reordered.sections[1]?.id).toBe("sec-1");

    // Out of bounds preserves layout
    expect(reorderSection(sampleLayout, -1, 1)).toEqual(sampleLayout);
    expect(reorderSection(sampleLayout, 0, 5)).toEqual(sampleLayout);
  });

  it("adds a new section with columns", () => {
    const withNewSec = addSection(sampleLayout, "Custom Section", 2);
    expect(withNewSec.sections).toHaveLength(3);
    const added = withNewSec.sections[2];
    expect(added?.label).toBe("Custom Section");
    expect(added?.columnCount).toBe(2);
    expect(added?.columns).toEqual([[], []]);
    expect(added?.fields).toEqual([]);
  });

  it("renames a section", () => {
    const renamed = renameSection(sampleLayout, "sec-1", "General Details");
    expect(renamed.sections[0]?.label).toBe("General Details");
    expect(renamed.sections[1]?.label).toBe("Address Information");
  });

  it("changes section column count between 1 and 2", () => {
    // 2 -> 1
    const oneCol = setSectionColumnCount(sampleLayout, "sec-1", 1);
    expect(oneCol.sections[0]?.columnCount).toBe(1);
    expect(oneCol.sections[0]?.columns).toEqual([
      ["field:First_Name", "field:Last_Name", "field:Email", "field:Phone"],
    ]);

    // 1 -> 2
    const twoCol = setSectionColumnCount(sampleLayout, "sec-2", 2);
    expect(twoCol.sections[1]?.columnCount).toBe(2);
    expect(twoCol.sections[1]?.columns).toEqual([["field:Street", "field:City"], []]);
  });

  it("removes a section", () => {
    const removed = removeSection(sampleLayout, "sec-2");
    expect(removed.sections).toHaveLength(1);
    expect(removed.sections[0]?.id).toBe("sec-1");
  });

  it("moves a field within a column (reordering)", () => {
    // Swap First_Name and Last_Name in sec-1, column 0
    const moved = moveFieldInColumn(sampleLayout, "sec-1", 0, 0, 1);
    expect(moved.sections[0]?.columns[0]).toEqual(["field:Last_Name", "field:First_Name"]);
    // Column 1 is untouched
    expect(moved.sections[0]?.columns[1]).toEqual(["field:Email", "field:Phone"]);
  });

  it("moves a field between columns in the same section", () => {
    // Move First_Name from col 0 to col 1
    const moved = moveFieldToColumn(sampleLayout, "sec-1", 0, 1, "field:First_Name");
    expect(moved.sections[0]?.columns[0]).toEqual(["field:Last_Name"]);
    expect(moved.sections[0]?.columns[1]).toEqual([
      "field:Email",
      "field:Phone",
      "field:First_Name",
    ]);
  });

  it("hides a field completely from columns and membership", () => {
    const hidden = hideField(sampleLayout, "field:Email");
    expect(hidden.sections[0]?.columns[1]).toEqual(["field:Phone"]);
    expect(hidden.sections[0]?.fields).not.toContain("field:Email");
  });

  it("places an unplaced field into a section column", () => {
    const placed = placeField(sampleLayout, "sec-2", 0, "field:Zip_Code");
    expect(placed.sections[1]?.columns[0]).toEqual([
      "field:Street",
      "field:City",
      "field:Zip_Code",
    ]);
    expect(placed.sections[1]?.fields).toContain("field:Zip_Code");
  });
});

describe("saveLayout API caller", () => {
  it("returns ok and new revision on 200 response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ revision: "v1:2" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await saveLayout("acme", "Leads", "v1:1", sampleLayout);
    expect(result).toEqual({ ok: true, revision: "v1:2" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/crm/v2.1/settings/layouts?module=Leads",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-CRM-ORG": "acme" },
      }),
    );
  });

  it("handles 409 revision conflict and marks stale: true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ code: "SCHEMA_REVISION_MISMATCH" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await saveLayout("acme", "Leads", "v1:1", sampleLayout);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stale).toBe(true);
      expect(result.message).toContain("changed since this page loaded");
    }
  });

  it("handles 400 validation error (e.g. required field unreachable)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        code: "INVALID_DATA",
        message: "Required field is unreachable without a server value.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await saveLayout("acme", "Leads", "v1:1", sampleLayout);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stale).toBe(false);
      expect(result.message).toContain("Required field is unreachable without a server value.");
    }
  });
});
