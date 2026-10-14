import { describe, expect, it } from "vitest";
import { callsMetadata, callsMetadataSource, callsWhatTargets, callsWhoTargets } from "./metadata";
import { callsPicklists } from "./picklists";
import { callsViewSource, callsViews } from "./views";

/** Independent table transcribed from the export, without account/field IDs. */
const exportedFields = [
  ["Owner", "ownerlookup", 120, false, false],
  ["Subject", "text", 255, false, false],
  ["Call_Type", "picklist", 120, true, false],
  ["Call_Purpose", "picklist", 120, false, false],
  ["Who_Id", "lookup", 120, false, false],
  ["What_Id", "lookup", 120, false, false],
  ["Call_Start_Time", "datetime", 120, true, false],
  ["Call_Duration", "text", 50, true, false],
  ["Call_Duration_in_seconds", "integer", 50, false, false],
  ["Description", "textarea", 32000, false, false],
  ["Call_Result", "picklist", 120, false, false],
  ["CTI_Entry", "boolean", 5, false, false],
  ["Created_By", "ownerlookup", 120, false, false],
  ["Modified_By", "ownerlookup", 120, false, false],
  ["Created_Time", "datetime", 120, false, false],
  ["Modified_Time", "datetime", 120, false, false],
  ["Reminder", "picklist", 100, false, false],
  ["Tag", "text", 2000, false, false],
  ["Outgoing_Call_Status", "picklist", 120, false, false],
  ["Scheduled_In_CRM", "picklist", 120, false, true],
  ["id", "bigint", 18, false, true],
  ["Last_Activity_Time", "datetime", 120, false, false],
  ["Call_Agenda", "text", 255, false, false],
  ["Caller_ID", "text", 30, false, true],
  ["Dialled_Number", "text", 30, false, true],
  ["Voice_Recording__s", "website", 1000, false, false],
];
const values = (name: string) => callsPicklists[name]?.map((o) => [o.displayValue, o.storedValue]);

describe("Calls sanitized metadata source", () => {
  it("preserves all 26 field names, types, lengths and flags", () => {
    expect(
      callsMetadata.fields.map((f) => [f.apiName, f.dataType, f.maxLength, f.required, f.readOnly]),
    ).toEqual(exportedFields);
    expect(callsMetadata.fields.every((f) => !f.unique)).toBe(true);
  });

  it("preserves layout sections and column order", () => {
    expect(callsMetadataSource.layout.map((s) => [s.label, s.columnCount, s.fields])).toEqual([
      [
        "Call Information",
        1,
        [
          "Who_Id",
          "What_Id",
          "Call_Type",
          "Outgoing_Call_Status",
          "Call_Start_Time",
          "Dialled_Number",
          "Call_Duration",
          "Caller_ID",
          "Owner",
          "Subject",
          "Created_By",
          "Modified_By",
          "Created_Time",
          "Modified_Time",
          "Voice_Recording__s",
          "Reminder",
          "Call_Duration_in_seconds",
          "Scheduled_In_CRM",
          "Tag",
          "id",
          "Last_Activity_Time",
        ],
      ],
      ["Purpose Of Outgoing Call", 1, ["Call_Purpose", "Call_Agenda"]],
      ["Outcome Of Outgoing Call", 1, ["Call_Result", "Description"]],
      ["Reason For Incoming Call", 1, ["Description"]],
    ]);
  });

  it("preserves the six picklists in export order", () => {
    expect(Object.keys(callsPicklists)).toEqual([
      "Call_Type",
      "Call_Purpose",
      "Call_Result",
      "Reminder",
      "Outgoing_Call_Status",
      "Scheduled_In_CRM",
    ]);
    expect(values("Call_Type")).toEqual([
      ["Outbound", "Outbound"],
      ["Inbound", "Inbound"],
      ["Missed", "Missed"],
    ]);
    expect(callsPicklists.Call_Purpose?.map((o) => o.storedValue)).toEqual([
      "-None-",
      "Prospecting",
      "Administrative",
      "Negotiation",
      "Demo",
      "Project",
      "Support",
    ]);
    expect(callsPicklists.Call_Result?.map((o) => o.storedValue)).toEqual([
      "-None-",
      "Interested",
      "Not interested",
      "No response/Busy",
      "Requested more info",
      "Requested call back",
      "Invalid number",
    ]);
    expect(values("Reminder")).toEqual([
      ["None", "none"],
      ["5 minutes before", "5 mins"],
      ["10 minutes before", "10 mins"],
      ["15 minutes before", "15 mins"],
      ["30 minutes before", "30 mins"],
      ["1 hour before", "1 hrs"],
      ["2 hours before", "2 hrs"],
      ["1 day before", "1 days"],
      ["2 days before", "2 days"],
    ]);
    expect(callsPicklists.Outgoing_Call_Status?.map((o) => o.storedValue)).toEqual([
      "-None-",
      "Scheduled",
      "Completed",
      "Overdue",
      "Cancelled",
    ]);
    expect(callsPicklists.Scheduled_In_CRM?.map((o) => o.storedValue)).toEqual(["False", "True"]);
    for (const field of callsMetadata.fields.filter((f) => f.dataType === "picklist"))
      expect(field.picklist).toEqual(callsPicklists[field.apiName]);
  });

  it("publishes the Who_Id and What_Id target lists", () => {
    expect(callsWhoTargets).toEqual(["Contacts", "Leads"]);
    expect(callsWhatTargets).toEqual([
      "Accounts",
      "Campaigns",
      "Cases",
      "Deals",
      "Invoices",
      "Products",
      "Purchase_Orders",
      "Quotes",
      "Sales_Orders",
      "Vendors",
    ]);
  });

  it("preserves all 23 views with a single default and null sort", () => {
    expect(callsViewSource.map((v) => v.name)).toEqual([
      "All Calls",
      "Attended Calls",
      "Cancelled Calls",
      "Completed Calls",
      "Incoming Calls",
      "Missed Calls",
      "My Attended Calls",
      "My Calls",
      "My Cancelled Calls",
      "My Incoming Calls",
      "My Missed Calls",
      "My Outgoing Calls",
      "My Overdue Calls",
      "My Scheduled Calls",
      "My Scheduled+Overdue Calls for Today",
      "My Today's Scheduled Calls",
      "My Unattended Calls",
      "Outgoing Calls",
      "Overdue Calls",
      "Scheduled Calls",
      "Today's Scheduled Calls",
      "Today's Scheduled+Overdue Calls",
      "Unattended Calls",
    ]);
    expect(callsViews.filter((v) => v.isDefault).map((v) => v.id)).toEqual(["all-calls"]);
    expect(callsViews.every((v) => v.sort === null && v.systemDefined)).toBe(true);
    expect(new Set(callsViews.map((v) => v.id)).size).toBe(23);
    expect(callsViews.find((v) => v.id === "completed-calls")?.columns).toEqual([
      "Subject",
      "What_Id",
      "Call_Start_Time",
      "Call_Type",
      "Call_Duration",
    ]);
    expect(callsViews.find((v) => v.id === "unattended-calls")?.criteria).toEqual({
      groupOperator: "and",
      group: [
        { field: "Outgoing_Call_Status", comparator: "equal", value: "Completed" },
        { field: "Call_Duration_in_seconds", comparator: "equal", value: 0 },
      ],
    });
  });
});
