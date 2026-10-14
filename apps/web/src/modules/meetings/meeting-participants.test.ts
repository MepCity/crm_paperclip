import { expect, test } from "vitest";
import { meetingParticipants } from "./meeting-participants";

test.each([
  { value: [] },
  { value: null },
  { value: undefined },
  { value: "invalid" },
  { value: {} },
  { value: 1 },
])("treats empty and non-array Participants as empty: $value", ({ value }) => {
  expect(meetingParticipants(value)).toEqual([]);
});

test.each([
  { value: [{ example: [1, null, true] }] },
  { value: [{ id: "synthetic-id", name: "Synthetic name" }] },
  { value: [null] },
])("keeps populated Participants opaque: $value", ({ value }) => {
  expect(meetingParticipants(value)).toBeNull();
});

test("lists entries written by the Meetings form", () => {
  expect(meetingParticipants([{ module: "Contacts", id: "c1", name: "Synthetic Person" }])).toEqual(
    [{ id: "c1", name: "Synthetic Person" }],
  );
});
