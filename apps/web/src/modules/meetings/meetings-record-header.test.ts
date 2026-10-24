import type { RecordData } from "@crm/core/records";
import { expect, test } from "vitest";
import { meetingsRecordHeaderIdentity } from "./meetings-record-header";

function meetingRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "test-meeting-1", fields };
}

test("builds record header with Event_Title as title, no portrait, record navigation enabled", () => {
  const result = meetingsRecordHeaderIdentity(meetingRecord({ Event_Title: "Board Meeting" }));

  expect(result.title).toBe("Board Meeting");
  expect(result.hasPortrait).toBe(false);
  expect(result.recordNavigation).toBe(true);
  expect(result.subtitle).toBeUndefined();
});

test("handles empty or missing Event_Title safely with empty string title", () => {
  expect(meetingsRecordHeaderIdentity(meetingRecord({}))).toEqual({
    title: "",
    hasPortrait: false,
    recordNavigation: true,
  });

  expect(meetingsRecordHeaderIdentity(meetingRecord({ Event_Title: null }))).toEqual({
    title: "",
    hasPortrait: false,
    recordNavigation: true,
  });

  expect(meetingsRecordHeaderIdentity(meetingRecord({ Event_Title: "" }))).toEqual({
    title: "",
    hasPortrait: false,
    recordNavigation: true,
  });
});
