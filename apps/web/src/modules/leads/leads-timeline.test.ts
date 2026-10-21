import { describe, expect, it } from "vitest";
import {
  LEADS_TIMELINE_MODULE_OPTIONS,
  LEADS_TIMELINE_SOURCE_OPTIONS,
  LEADS_TIMELINE_SUBTABS,
} from "./leads-timeline";

describe("LEADS_TIMELINE_SUBTABS", () => {
  it("defines history subtab for leads timeline", () => {
    expect(LEADS_TIMELINE_SUBTABS).toEqual([{ id: "history", label: "History" }]);
    expect(LEADS_TIMELINE_SUBTABS).toHaveLength(1);
    expect(LEADS_TIMELINE_SUBTABS[0]?.id).toBe("history");
    expect(LEADS_TIMELINE_SUBTABS[0]?.label).toBe("History");
  });

  it("edge case: does not contain interactions subtab observed in other modules", () => {
    const hasInteractions = LEADS_TIMELINE_SUBTABS.some((tab) => tab.id === "interactions");
    expect(hasInteractions).toBe(false);

    // Verify subtabs array elements have non-empty id and label
    for (const tab of LEADS_TIMELINE_SUBTABS) {
      expect(typeof tab.id).toBe("string");
      expect(tab.id.trim().length).toBeGreaterThan(0);
      expect(typeof tab.label).toBe("string");
      expect(tab.label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("LEADS_TIMELINE_MODULE_OPTIONS", () => {
  it("defines all six standard filter options in reference order", () => {
    expect(LEADS_TIMELINE_MODULE_OPTIONS).toHaveLength(6);
    expect(LEADS_TIMELINE_MODULE_OPTIONS.map((item) => item.id)).toEqual([
      "notes",
      "attachments",
      "tasks",
      "calls",
      "meetings",
      "emails",
    ]);
    expect(LEADS_TIMELINE_MODULE_OPTIONS.map((item) => item.label)).toEqual([
      "Notes",
      "Attachments",
      "Tasks",
      "Calls",
      "Meetings",
      "Emails",
    ]);
  });

  it("edge case: all option ids and labels are unique and non-existent filter queries return undefined", () => {
    const ids = LEADS_TIMELINE_MODULE_OPTIONS.map((opt) => opt.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    const labels = LEADS_TIMELINE_MODULE_OPTIONS.map((opt) => opt.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);

    const unlisted = LEADS_TIMELINE_MODULE_OPTIONS.find((opt) => opt.id === "deals");
    expect(unlisted).toBeUndefined();

    const empty = LEADS_TIMELINE_MODULE_OPTIONS.find((opt) => opt.id === "");
    expect(empty).toBeUndefined();
  });
});

describe("LEADS_TIMELINE_SOURCE_OPTIONS", () => {
  it("defines workflow, manual, and import source filter options in order", () => {
    expect(LEADS_TIMELINE_SOURCE_OPTIONS).toHaveLength(3);
    expect(LEADS_TIMELINE_SOURCE_OPTIONS).toEqual([
      { id: "workflow", label: "Workflow Rules" },
      { id: "manual", label: "Manual" },
      { id: "import", label: "Import" },
    ]);
  });

  it("edge case: ensures unique ids and returns undefined for unknown source option", () => {
    const ids = LEADS_TIMELINE_SOURCE_OPTIONS.map((opt) => opt.id);
    expect(new Set(ids).size).toBe(ids.length);

    expect(LEADS_TIMELINE_SOURCE_OPTIONS.find((opt) => opt.id === "api")).toBeUndefined();
    expect(LEADS_TIMELINE_SOURCE_OPTIONS.find((opt) => opt.id === "web_form")).toBeUndefined();

    for (const opt of LEADS_TIMELINE_SOURCE_OPTIONS) {
      expect(opt.id.length).toBeGreaterThan(0);
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });
});
