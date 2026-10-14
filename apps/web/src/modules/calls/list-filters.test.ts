import { expect, test } from "vitest";
import { buildCallsFilterGroups, callsFilterGroups } from "./list-filters";
import { callField } from "./test-metadata";

test("preserves Calls system filter inventory (CL-15 - CL-18) in reference order", () => {
  expect(callsFilterGroups[0]?.items.map((row) => [row.label, row.laterModule])).toEqual([
    ["Record Action", undefined],
    ["Related Records Action", undefined],
    ["Touched Records", undefined],
    ["Untouched Records", undefined],
  ]);

  const systemLabels = callsFilterGroups[0]?.items.map((row) => row.label) ?? [];
  expect(systemLabels).toContain("Record Action");
  expect(systemLabels).toContain("Related Records Action");
  expect(systemLabels).toContain("Touched Records");
  expect(systemLabels).toContain("Untouched Records");
  expect(systemLabels).not.toContain("Locked");
  expect(systemLabels).not.toContain("Activities");
  expect(systemLabels).not.toContain("Latest Email Status");
  expect(systemLabels).not.toContain("Cadences");
});

test("preserves initial field rows with inventory module keys (CL-20 - CL-29)", () => {
  expect(
    callsFilterGroups[1]?.items.slice(0, 10).map((row) => [row.label, row.laterModule]),
  ).toEqual([
    ["Call Agenda", undefined],
    ["Call Duration", undefined],
    ["Call Duration (in seconds)", undefined],
    ["Call Owner", undefined],
    ["Call Purpose", undefined],
    ["Call Result", undefined],
    ["Call Start Time", undefined],
    ["Call Type", undefined],
    ["Caller ID", undefined],
    ["Contact Name", undefined],
  ]);
});

test("resolves picklist, ownerlookup, datetime and tag fields from metadata", () => {
  const groups = buildCallsFilterGroups({
    fields: [
      callField("Subject", { label: "Subject" }),
      callField("Owner", { label: "Call Owner", dataType: "ownerlookup" }),
      callField("Call_Type", {
        label: "Call Type",
        dataType: "picklist",
        picklist: [
          { storedValue: "Outbound", displayValue: "Outbound" },
          { storedValue: "Inbound", displayValue: "Inbound" },
          { storedValue: "Missed", displayValue: "Missed" },
        ],
      }),
      callField("Call_Start_Time", { label: "Call Start Time", dataType: "datetime" }),
      callField("Call_Duration", { label: "Call Duration", dataType: "text" }),
      callField("Who_Id", { label: "Contact Name", dataType: "lookup" }),
      callField("What_Id", { label: "Related To", dataType: "lookup" }),
      callField("Tag", { label: "Tag" }),
    ],
    users: [{ userId: "u1", name: "Alice", email: "alice@example.com" }],
    linkField: "Subject",
    currencyCode: "TRY",
  });

  expect(groups[1]?.items.find((item) => item.label === "Subject")?.id).toBe("Subject");
  expect(groups[1]?.items.find((item) => item.id === "Owner")?.editor?.options).toEqual([
    { id: "u1", label: "Alice", detail: "alice@example.com" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "Call_Type")?.editor?.options).toEqual([
    { id: "Outbound", label: "Outbound" },
    { id: "Inbound", label: "Inbound" },
    { id: "Missed", label: "Missed" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "Tag")?.editor?.fieldType).toBe("tag");
  expect(groups[1]?.items.find((item) => item.id === "Call_Start_Time")?.editor?.fieldType).toBe(
    "datetime",
  );
  expect(groups[1]?.items.find((item) => item.id === "Call_Duration")?.editor?.fieldType).toBe(
    "text",
  );
});
