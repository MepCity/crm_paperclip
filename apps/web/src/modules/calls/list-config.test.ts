import { expect, test } from "vitest";
import {
  CALLS_SORT_FIELD_LABELS,
  CALLS_VIEW_TYPE_TILE_IDS,
  callsListPageConfig,
} from "./list-config";

test("defines Calls identity labels and routes using the Subject link column", () => {
  expect(callsListPageConfig.module).toBe("Calls");
  expect(callsListPageConfig.linkField).toBe("Subject");
  expect(callsListPageConfig.linkFieldLabel).toBe("Subject");
  expect(callsListPageConfig.createLabel).toBe("Create Call");
  expect(callsListPageConfig.filterTitle).toBe("Filter Calls by");
  expect(callsListPageConfig.pinnedViews).toEqual(["All Calls"]);
  expect(callsListPageConfig.viewMenuSearch).toBe(true);
  expect(callsListPageConfig.badgeColumn).toBe(false);
  expect(callsListPageConfig.phoneLaterModule).toBeUndefined();
  expect(callsListPageConfig.paths.create("sample-org", "Calls")).toContain("/tab/Calls/create");
  expect(CALLS_SORT_FIELD_LABELS).toContain("Subject");
  expect(CALLS_SORT_FIELD_LABELS).toContain("Call Type");
  expect(CALLS_SORT_FIELD_LABELS).toContain("Call Start Time");
  expect(CALLS_SORT_FIELD_LABELS).toContain("Call Duration");
  expect(CALLS_SORT_FIELD_LABELS).toContain("Call Owner");
  expect(CALLS_SORT_FIELD_LABELS).toContain("Contact Name");
  expect(CALLS_SORT_FIELD_LABELS).not.toContain("Lead Status");
  expect(CALLS_SORT_FIELD_LABELS).not.toContain("Due Date");
  expect(CALLS_SORT_FIELD_LABELS).toHaveLength(26);
});

test("draws four view type tiles without Timeline or Sheet", () => {
  expect(CALLS_VIEW_TYPE_TILE_IDS).toEqual(["list", "split", "chart", "cards"]);
});

test("keeps the Calls Actions inventory in reference order and assigns later modules", () => {
  expect(callsListPageConfig.inventory?.actions.map((item) => item.label)).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Export Calls",
    "Print View",
  ]);
  expect(
    callsListPageConfig.inventory?.actions.find((item) => item.id === "tags")?.laterModule,
  ).toBe("M6");
  expect(
    callsListPageConfig.inventory?.actions.find((item) => item.id === "export")?.laterModule,
  ).toBe("M6");
  expect(
    callsListPageConfig.inventory?.actions.find((item) => item.id === "print")?.submenuIndicator,
  ).toBe(true);
  expect(
    callsListPageConfig.inventory?.actions.find((item) => item.id === "mass-transfer")?.laterModule,
  ).toBeUndefined();
  expect(
    callsListPageConfig.inventory?.actions.find((item) => item.id === "mass-delete")?.laterModule,
  ).toBeUndefined();
  expect(
    callsListPageConfig.inventory?.actions.find((item) => item.id === "mass-update")?.laterModule,
  ).toBeUndefined();
  expect(callsListPageConfig.inventory?.createItems).toBeUndefined();
});
