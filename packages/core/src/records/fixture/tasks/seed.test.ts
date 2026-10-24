import { describe, expect, it } from "vitest";
import { fixtureModules } from "../registry";
import { tasksMetadataSource } from "./metadata";
import { tasksPicklists } from "./picklists";
import { fullName, generateFixtureTasks } from "./seed";

const now = new Date("2026-02-01T12:00:00.000Z");

describe("prepared Tasks seed", () => {
  it("is deterministic at Leads scale, with every exported field", () => {
    const tasks = generateFixtureTasks(68, now);
    expect(tasks).toHaveLength(250);
    expect(tasks).toEqual(generateFixtureTasks(68, now));
    expect(new Set(tasks.map((task) => task.id)).size).toBe(250);
    for (const task of tasks) {
      expect(Object.keys(task.fields)).toEqual(
        tasksMetadataSource.fields.map((field) => field.apiName),
      );
      expect(task.fields.id).toBe(task.id);
      expect(fullName(task.fields)).toBe(task.fields.Subject);
      expect(task.fields.Remind_At).toBeNull();
      expect(task.fields.Recurring_Activity).toBeNull();
    }
  });

  it("covers every Status and Priority, and open/closed records", () => {
    const tasks = generateFixtureTasks(68, now);
    for (const name of ["Status", "Priority"]) {
      expect(new Set(tasks.map((task) => task.fields[name]))).toEqual(
        new Set(tasksPicklists[name]?.map((option) => option.storedValue)),
      );
    }
    expect(tasks.some((task) => task.fields.Status === "Completed")).toBe(true);
    expect(tasks.some((task) => task.fields.Status !== "Completed")).toBe(true);
    expect(tasks.some((task) => task.fields.Who_Id && !task.fields.What_Id)).toBe(true);
    expect(tasks.some((task) => task.fields.What_Id && !task.fields.Who_Id)).toBe(true);
    expect(tasks.some((task) => task.fields.Who_Id && task.fields.What_Id)).toBe(true);
  });

  it.each(["Leads", "Contacts", "Accounts", "Deals"])(
    "references existing synthetic %s records and leaves records without tasks",
    (module) => {
      const targets = fixtureModules[module]?.generateSeed(now) ?? [];
      const targetIds = new Set(targets.map((record) => record.id));
      const counts = new Map<string, number>();
      for (const task of generateFixtureTasks(68, now)) {
        for (const name of ["Who_Id", "What_Id"]) {
          const value = task.fields[name];
          if (
            typeof value !== "object" ||
            value === null ||
            !("module" in value) ||
            value.module !== module ||
            typeof value.id !== "string"
          )
            continue;
          expect(targetIds.has(value.id)).toBe(true);
          counts.set(value.id, (counts.get(value.id) ?? 0) + 1);
        }
      }
      expect([...counts.values()].some((count) => count > 1)).toBe(true);
      expect(targets.some((record) => !counts.has(record.id))).toBe(true);
    },
  );
});
