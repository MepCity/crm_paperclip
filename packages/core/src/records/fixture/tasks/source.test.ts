import { describe, expect, it } from "vitest";
import { tasksMetadata, tasksMetadataSource } from "./metadata";
import { tasksPicklists } from "./picklists";
import { tasksViewSource } from "./views";

/** Independent table transcribed from the export, without account/field IDs. */
const exportedFields = [
  ["Owner", "ownerlookup", 120, false, false],
  ["Subject", "text", 255, true, false],
  ["Due_Date", "date", 20, false, false],
  ["Who_Id", "lookup", 120, false, false],
  ["What_Id", "lookup", 120, false, false],
  ["Status", "picklist", 120, false, false],
  ["Priority", "picklist", 120, false, false],
  ["Created_By", "ownerlookup", 120, false, false],
  ["Modified_By", "ownerlookup", 120, false, false],
  ["Created_Time", "datetime", 120, false, false],
  ["Modified_Time", "datetime", 120, false, false],
  ["Description", "textarea", 32000, false, false],
  ["Send_Notification_Email", "boolean", 5, false, false],
  ["Remind_At", "ALARM", 100, false, false],
  ["Recurring_Activity", "RRULE", 100, false, false],
  ["Closed_Time", "datetime", 120, false, true],
  ["Tag", "text", 2000, false, false],
  ["id", "bigint", 18, false, true],
  ["Locked__s", "boolean", 5, false, true],
  ["Last_Activity_Time", "datetime", 120, false, false],
];

describe("Tasks sanitized metadata source", () => {
  it("preserves all 20 field names, types, lengths and flags", () => {
    expect(
      tasksMetadata.fields.map((field) => [
        field.apiName,
        field.dataType,
        field.maxLength,
        field.required,
        field.readOnly,
      ]),
    ).toEqual(exportedFields);
    expect(tasksMetadata.fields.every((field) => !field.unique)).toBe(true);
  });

  it("preserves layout order and the exported single column", () => {
    expect(tasksMetadataSource.layout).toEqual([
      {
        label: "Task Information",
        columnCount: 1,
        columns: [
          [
            "Owner",
            "Subject",
            "Due_Date",
            "Who_Id",
            "What_Id",
            "Status",
            "Priority",
            "Created_By",
            "Tag",
            "Send_Notification_Email",
            "Modified_By",
            "Remind_At",
            "Created_Time",
            "Modified_Time",
            "Recurring_Activity",
            "Closed_Time",
            "id",
            "Last_Activity_Time",
          ],
        ],
        fields: [
          "Owner",
          "Subject",
          "Due_Date",
          "Who_Id",
          "What_Id",
          "Status",
          "Priority",
          "Created_By",
          "Tag",
          "Send_Notification_Email",
          "Modified_By",
          "Remind_At",
          "Created_Time",
          "Modified_Time",
          "Recurring_Activity",
          "Closed_Time",
          "id",
          "Last_Activity_Time",
        ],
      },
      {
        label: "Description Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
    ]);
  });

  it("preserves picklist display/stored values and order", () => {
    expect(tasksMetadata.fields.find((field) => field.apiName === "Status")?.picklist).toEqual(
      tasksPicklists.Status,
    );
    expect(tasksMetadata.fields.find((field) => field.apiName === "Priority")?.picklist).toEqual(
      tasksPicklists.Priority,
    );
    expect(tasksPicklists.Status).toEqual([
      { displayValue: "Not Started", storedValue: "Not Started" },
      { displayValue: "Deferred", storedValue: "Deferred" },
      { displayValue: "In Progress", storedValue: "In Progress" },
      { displayValue: "Completed", storedValue: "Completed" },
      { displayValue: "Waiting for input", storedValue: "Waiting on someone else" },
    ]);
    expect(tasksPicklists.Priority?.map((option) => option.storedValue)).toEqual([
      "High",
      "Highest",
      "Low",
      "Lowest",
      "Normal",
    ]);
    expect(tasksPicklists.Subject?.map((option) => option.storedValue)).toEqual([
      "Email",
      "Call",
      "Meeting",
      "Send Letter",
      "Product Demo",
    ]);
  });

  it("preserves all 17 views with a single default and null sort", () => {
    expect(tasksViewSource.map((view) => view.name)).toEqual([
      "All Locked Tasks",
      "All Tasks",
      "Closed Tasks",
      "My Closed Tasks",
      "My Next 7 Days + Overdue Tasks",
      "My Open Tasks",
      "My Overdue Tasks",
      "My Tasks",
      "My Today + Overdue Tasks",
      "My Today's Tasks",
      "My Tomorrow's Tasks",
      "Next 7 Days + Overdue Tasks",
      "Open Tasks",
      "Overdue Tasks",
      "Today + Overdue Tasks",
      "Today's Tasks",
      "Tomorrow's Tasks",
    ]);
    expect(tasksViewSource.filter((view) => view.isDefault).map((view) => view.id)).toEqual([
      "all-tasks",
    ]);
    expect(tasksViewSource.every((view) => view.sort === null && view.systemDefined)).toBe(true);
    expect(new Set(tasksViewSource.map((view) => view.id)).size).toBe(17);
  });

  it("preserves exported closed criterion and the missing BEST_TIME column", () => {
    expect(tasksViewSource.find((view) => view.id === "closed-tasks")?.criteria).toEqual({
      field: "Status",
      comparator: "equal",
      value: "Completed",
    });
    expect(tasksViewSource.find((view) => view.id === "my-tasks")?.columns).toEqual([
      "Due_Date",
      "Subject",
      "Status",
      "Priority",
      "What_Id",
      "Who_Id",
      "BEST_TIME",
    ]);
  });
});
