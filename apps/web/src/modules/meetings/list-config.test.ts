import { expect, test } from "vitest";
import {
  MEETINGS_SORT_FIELD_LABELS,
  MEETINGS_VIEW_TYPE_TILE_IDS,
  meetingsListPageConfig,
} from "./list-config";

test("defines Meetings identity labels and routes using the Event_Title link column", () => {
  expect(meetingsListPageConfig.module).toBe("Events");
  expect(meetingsListPageConfig.linkField).toBe("Event_Title");
  expect(meetingsListPageConfig.linkFieldLabel).toBe("Title");
  expect(meetingsListPageConfig.createLabel).toBe("Create Meeting");
  expect(meetingsListPageConfig.filterTitle).toBe("Filter Meetings by");
  expect(meetingsListPageConfig.pinnedViews).toEqual(["All Meetings"]);
  expect(meetingsListPageConfig.viewMenuSearch).toBe(true);
  expect(meetingsListPageConfig.badgeColumn).toBe(false);
  expect(meetingsListPageConfig.paths.create("sample-org", "Events")).toContain(
    "/tab/Events/create",
  );
  expect(MEETINGS_SORT_FIELD_LABELS).toContain("Title");
  expect(MEETINGS_SORT_FIELD_LABELS).toContain("From");
  expect(MEETINGS_SORT_FIELD_LABELS).toContain("To");
  expect(MEETINGS_SORT_FIELD_LABELS).toContain("Host");
  expect(MEETINGS_SORT_FIELD_LABELS).toContain("Contact Name");
  expect(MEETINGS_SORT_FIELD_LABELS).toContain("All day");
  expect(MEETINGS_SORT_FIELD_LABELS).toContain("Check-In Address");
  expect(MEETINGS_SORT_FIELD_LABELS).not.toContain("Lead Status");
  expect(MEETINGS_SORT_FIELD_LABELS).not.toContain("Stage");
  expect(MEETINGS_SORT_FIELD_LABELS).toHaveLength(34);
});

test("draws four view type tiles without Timeline or Sheet", () => {
  expect(MEETINGS_VIEW_TYPE_TILE_IDS).toEqual(["list", "split", "chart", "cards"]);
});

test("keeps the Meetings Actions inventory in reference order and assigns later modules", () => {
  const actions = meetingsListPageConfig.inventory?.actions ?? [];
  expect(actions.map((item) => item.label)).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Export Meetings",
    "Print View",
  ]);
  expect(actions.find((item) => item.id === "tags")?.laterModule).toBe("M6");
  expect(actions.find((item) => item.id === "export")?.laterModule).toBe("M6");
  expect(actions.find((item) => item.id === "print")?.submenuIndicator).toBe(true);
  expect(meetingsListPageConfig.inventory?.createItems).toBeUndefined();
});
