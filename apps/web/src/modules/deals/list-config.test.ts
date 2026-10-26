import { expect, test } from "vitest";
import { DEALS_SORT_FIELD_LABELS, dealsListPageConfig } from "./list-config";

test("defines Deals identity labels and routes using the Deal_Name link column", () => {
  expect(dealsListPageConfig.linkField).toBe("Deal_Name");
  expect(dealsListPageConfig.linkFieldLabel).toBe("Deal Name");
  expect(dealsListPageConfig.createLabel).toBe("Create Deal");
  expect(dealsListPageConfig.filterTitle).toBe("Filter Deals by");
  expect(dealsListPageConfig.pinnedViews).toEqual(["All Deals"]);
  expect(dealsListPageConfig.badgeColumn).toBe(false);
  expect(dealsListPageConfig.paths.create("sample-org", "Deals")).toContain("/tab/Deals/create");
  expect(dealsListPageConfig.defaultPresentation).toBe("board");
  expect(dealsListPageConfig.board).toBeDefined();
  expect(dealsListPageConfig.boardComponent).toBeDefined();
  expect(dealsListPageConfig.boardToolbar).toBeDefined();
  expect(DEALS_SORT_FIELD_LABELS).toContain("Deal Name");
  expect(DEALS_SORT_FIELD_LABELS).toContain("Amount");
  expect(DEALS_SORT_FIELD_LABELS).toContain("Stage");
  expect(DEALS_SORT_FIELD_LABELS).toContain("Closing Date");
  expect(DEALS_SORT_FIELD_LABELS).toContain("Expected Revenue");
  expect(DEALS_SORT_FIELD_LABELS).not.toContain("Lead Status");
  expect(DEALS_SORT_FIELD_LABELS).toHaveLength(29);
});

test("keeps the Deals Actions inventory in reference order and assigns later modules", () => {
  expect(dealsListPageConfig.inventory?.actions.map((item) => item.label)).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Deduplicate Deals",
    "Create Client Script",
    "Export Deals",
    "Sheet view",
    "Print View",
  ]);
  expect(
    dealsListPageConfig.inventory?.actions.find((item) => item.id === "sheet")?.laterModule,
  ).toBe("P3");
  expect(
    dealsListPageConfig.inventory?.actions.find((item) => item.id === "tags")?.laterModule,
  ).toBeUndefined();
  expect(
    dealsListPageConfig.inventory?.actions.find((item) => item.id === "drafts")?.laterModule,
  ).toBeUndefined();
  expect(
    dealsListPageConfig.inventory?.actions.find((item) => item.id === "export")?.laterModule,
  ).toBeUndefined();
  expect(
    dealsListPageConfig.inventory?.actions.find((item) => item.id === "client-script")?.laterModule,
  ).toBe("M11");
  expect(
    dealsListPageConfig.inventory?.actions.find((item) => item.id === "print")?.submenuIndicator,
  ).toBe(true);
  expect(dealsListPageConfig.inventory?.createItems).toBeUndefined();
});
