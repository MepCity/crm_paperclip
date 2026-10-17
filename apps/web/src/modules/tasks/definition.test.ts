import { expect, test } from "vitest";
import { moduleScreens, resolveModuleScreen } from "../registry";
import { tasksScreenDefinition } from "./definition";

test("exports a Tasks module screen definition registered in the module table", () => {
  expect(tasksScreenDefinition).toMatchObject({
    apiName: "Tasks",
    tab: "Tasks",
    singularLabel: "Task",
    pluralLabel: "Tasks",
    pageTitle: "Tasks",
    navigation: { id: "tasks" },
  });
  expect(resolveModuleScreen("Tasks")).toBe(tasksScreenDefinition);
  expect(moduleScreens.map((definition) => definition.tab)).toContain("Tasks");
  expect(
    tasksScreenDefinition.detail.header({ id: "sample-task", fields: { Subject: "Sample" } }).title,
  ).toBe("Sample");
  expect(tasksScreenDefinition.detail.layout).toBe("activity");
  expect(tasksScreenDefinition.detail.lastUpdatePlacement).toBe("tab-row");
  expect(tasksScreenDefinition.detail.addTags).toEqual({ label: "Add Tags", laterModule: "M5" });
  expect(tasksScreenDefinition.detail.hasPortrait).toBe(true);
  expect(tasksScreenDefinition.detail.portraitAppearance).toBe("inline");
  expect(tasksScreenDefinition.detail.recordNavigation).toBe(true);
});

test("tasks detail buildHeaderCommands includes Close Task only on uncompleted tasks", () => {
  const save = () => Promise.resolve();
  const openTaskCommands = tasksScreenDefinition.detail.buildHeaderCommands?.(
    { id: "t1", fields: { Status: "In Progress" } },
    { editHref: "/edit", save, navigate: () => {}, confirm: () => {} },
  );
  expect(openTaskCommands).toEqual([
    expect.objectContaining({ id: "close-task", label: "Close Task", variant: "primary" }),
    expect.objectContaining({ id: "edit", label: "Edit", href: "/edit" }),
  ]);

  const closedTaskCommands = tasksScreenDefinition.detail.buildHeaderCommands?.(
    { id: "t2", fields: { Status: "Completed" } },
    { editHref: "/edit", save, navigate: () => {}, confirm: () => {} },
  );
  expect(closedTaskCommands).toEqual([
    expect.objectContaining({ id: "edit", label: "Edit", href: "/edit" }),
  ]);
});
