import { expect, test } from "vitest";
import { buildTasksFilterGroups, tasksFilterGroups } from "./list-filters";
import { taskField } from "./test-metadata";

test("keeps the Tasks system filter rows (TL-20 - TL-24) without Activities or Cadences", () => {
  expect(tasksFilterGroups[0]?.items.map((row) => row.label)).toEqual([
    "Locked",
    "Record Action",
    "Related Records Action",
    "Touched Records",
    "Untouched Records",
  ]);
  expect(tasksFilterGroups).toHaveLength(2);
});

test("lists metadata fields alphabetically and resolves editors", () => {
  const groups = buildTasksFilterGroups({
    fields: [
      taskField("Subject", { label: "Subject" }),
      taskField("Priority", {
        label: "Priority",
        dataType: "picklist",
        picklist: [{ storedValue: "High", displayValue: "High" }],
      }),
      taskField("Due_Date", { label: "Due Date", dataType: "date" }),
      taskField("Owner", { label: "Task Owner", dataType: "ownerlookup" }),
      taskField("Closed_Time", { label: "Closed Time", dataType: "datetime" }),
    ],
    users: [{ userId: "u1", name: "Alice" }],
    linkField: "Subject",
    currencyCode: "TRY",
  });
  const fields = groups[1]?.items ?? [];
  expect(fields.map((item) => item.label)).toEqual([
    "Closed Time",
    "Due Date",
    "Priority",
    "Subject",
    "Task Owner",
  ]);
  expect(fields.find((item) => item.id === "Priority")?.editor?.options).toEqual([
    { id: "High", label: "High" },
  ]);
  expect(fields.find((item) => item.id === "Owner")?.editor?.options).toEqual([
    { id: "u1", label: "Alice" },
  ]);
});

test("omits the Description and Locked field rows (difference rows 01-02)", () => {
  const groups = buildTasksFilterGroups({
    fields: [
      taskField("Subject", { label: "Subject" }),
      taskField("Description", { label: "Description" }),
      taskField("Locked", { label: "Locked" }),
    ],
    users: [],
    linkField: "Subject",
    currencyCode: "TRY",
  });
  expect((groups[1]?.items ?? []).map((item) => item.label)).toEqual(["Subject"]);
});
