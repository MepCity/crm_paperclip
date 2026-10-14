import { expect, test } from "vitest";
import {
  TASKS_SORT_FIELD_LABELS,
  TASKS_VIEW_TYPE_TILE_IDS,
  tasksListPageConfig,
} from "./list-config";

test("defines Tasks identity labels and routes using the Subject link column", () => {
  expect(tasksListPageConfig.module).toBe("Tasks");
  expect(tasksListPageConfig.linkField).toBe("Subject");
  expect(tasksListPageConfig.createLabel).toBe("Create Task");
  expect(tasksListPageConfig.filterTitle).toBe("Filter Tasks by");
  expect(tasksListPageConfig.pinnedViews).toEqual(["All Tasks"]);
  expect(tasksListPageConfig.viewMenuSearch).toBe(true);
  expect(tasksListPageConfig.paths.create("sample-org", "Tasks")).toContain("/tab/Tasks/create");
  expect(TASKS_SORT_FIELD_LABELS).toContain("Due Date");
  expect(TASKS_SORT_FIELD_LABELS).toContain("Task Owner");
});

test("draws five view type tiles without Sheet", () => {
  expect(TASKS_VIEW_TYPE_TILE_IDS).toEqual(["list", "split", "chart", "connected", "cards"]);
});

test("keeps the Tasks Actions inventory in reference order and assigns later modules", () => {
  const actions = tasksListPageConfig.inventory?.actions ?? [];
  expect(actions.map((item) => item.label)).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Export Tasks",
    "Print View",
  ]);
  expect(actions.find((item) => item.id === "tags")?.laterModule).toBe("M6");
  expect(actions.find((item) => item.id === "export")?.laterModule).toBe("M6");
  expect(actions.find((item) => item.id === "print")?.submenuIndicator).toBe(true);
});
