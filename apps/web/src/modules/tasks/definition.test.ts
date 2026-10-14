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
  expect(moduleScreens.map((definition) => definition.tab).slice(-2)).toEqual(["Deals", "Tasks"]);
  expect(
    tasksScreenDefinition.detail.header({ id: "sample-task", fields: { Subject: "Sample" } }).title,
  ).toBe("Sample");
});
