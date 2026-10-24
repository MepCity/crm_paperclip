import { expect, test } from "vitest";
import { buildMeetingsFilterGroups, meetingsFilterGroups } from "./list-filters";
import { meetingField } from "./test-metadata";

test("preserves Meetings system filter inventory (ML-15 - ML-18) in reference order", () => {
  expect(meetingsFilterGroups[0]?.items.map((row) => [row.label, row.laterModule])).toEqual([
    ["Record Action", undefined],
    ["Related Records Action", undefined],
    ["Touched Records", undefined],
    ["Untouched Records", undefined],
  ]);

  const systemLabels = meetingsFilterGroups[0]?.items.map((row) => row.label) ?? [];
  expect(systemLabels).toContain("Record Action");
  expect(systemLabels).toContain("Related Records Action");
  expect(systemLabels).toContain("Touched Records");
  expect(systemLabels).toContain("Untouched Records");
  expect(systemLabels).not.toContain("Locked");
  expect(systemLabels).not.toContain("Activities");
  expect(systemLabels).not.toContain("Latest Email Status");
  expect(systemLabels).not.toContain("Cadences");
});

test("preserves initial field rows in reference order (ML-20 - ML-29)", () => {
  expect(
    meetingsFilterGroups[1]?.items.slice(0, 10).map((row) => [row.label, row.laterModule]),
  ).toEqual([
    ["All day", undefined],
    ["Check-In Address", undefined],
    ["Check-In By", undefined],
    ["Check-In City", undefined],
    ["Check-In Country", undefined],
    ["Check-In State", undefined],
    ["Check-In Sub-Locality", undefined],
    ["Check-In Time", undefined],
    ["Checked In Status", undefined],
    ["Contact Name", undefined],
  ]);
});

test("resolves picklist, ownerlookup, boolean, datetime and special fields from metadata", () => {
  const groups = buildMeetingsFilterGroups({
    fields: [
      meetingField("Event_Title", { label: "Title" }),
      meetingField("Owner", { label: "Host", dataType: "ownerlookup" }),
      meetingField("Meeting_Venue__s", {
        label: "Meeting Venue",
        dataType: "picklist",
        picklist: [
          { storedValue: "In-office", displayValue: "In-office" },
          { storedValue: "Online", displayValue: "Online" },
        ],
      }),
      meetingField("All_day", { label: "All day", dataType: "boolean" }),
      meetingField("Start_DateTime", { label: "From", dataType: "datetime" }),
      meetingField("End_DateTime", { label: "To", dataType: "datetime" }),
      meetingField("Tag", { label: "Tag" }),
    ],
    users: [{ userId: "u1", name: "Alice", email: "alice@example.com" }],
    linkField: "Event_Title",
    currencyCode: "TRY",
  });

  expect(groups[1]?.items.find((item) => item.label === "Title")?.id).toBe("Event_Title");
  expect(groups[1]?.items.find((item) => item.id === "Owner")?.editor?.options).toEqual([
    { id: "u1", label: "Alice", detail: "alice@example.com" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "Meeting_Venue__s")?.editor?.options).toEqual([
    { id: "In-office", label: "In-office" },
    { id: "Online", label: "Online" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "All_day")?.editor?.fieldType).toBe("boolean");
  expect(groups[1]?.items.find((item) => item.id === "Start_DateTime")?.editor?.fieldType).toBe(
    "datetime",
  );
  expect(groups[1]?.items.find((item) => item.id === "Tag")?.editor?.fieldType).toBe("tag");
});
