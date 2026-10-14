import { expect, test } from "vitest";
import { validateRanges } from "@/components/records/form/form-validation";
import { dateTimePartsToIso, isoToDateTimeParts, nextFullHour } from "@/lib/records/datetime-parts";
import {
  addParticipant,
  MEETING_PARTICIPANTS_MAX,
  participantEntries,
  participantValue,
} from "@/lib/records/meeting-participants";
import { reminderOffsetOf, reminderValue } from "@/lib/records/reminder-options";
import { buildMeetingsFormDefaults, meetingsFormRules } from "./meetings-form-rules";

test("create defaults: From is the next full hour, To one hour later, venue and title preset", () => {
  const defaults = buildMeetingsFormDefaults(undefined, new Date(2026, 9, 14, 10, 20));
  expect(defaults.Start_DateTime).toBe(new Date(2026, 9, 14, 11, 0).toISOString());
  expect(defaults.End_DateTime).toBe(new Date(2026, 9, 14, 12, 0).toISOString());
  expect(defaults.All_day).toBe(false);
  expect(defaults.Meeting_Venue__s).toBe("Client location");
  expect(defaults.Event_Title).toBe("New Meeting");
  expect(nextFullHour(new Date(2026, 9, 14, 10, 0)).getHours()).toBe(11);
});

test("rules: Host is Owner, From/To range, All day, participants and inert Repeat", () => {
  expect(meetingsFormRules.owner).toBe("Owner");
  expect(meetingsFormRules.ranges).toEqual([{ start: "Start_DateTime", end: "End_DateTime" }]);
  expect(meetingsFormRules.allDay?.fields).toEqual(["Start_DateTime", "End_DateTime"]);
  expect(meetingsFormRules.participantModules?.Participants).toEqual(["Contacts", "Leads"]);
  expect(meetingsFormRules.laterModuleFields).toEqual({ Recurring_Activity: "P3" });
  expect(meetingsFormRules.omitted).toContain("Meeting_Provider__s");
});

test("To earlier than From is reported under To; equal or later passes", () => {
  const ranges = meetingsFormRules.ranges;
  const label = (name: string) => (name === "End_DateTime" ? "To" : "From");
  const bad = validateRanges(
    ranges,
    { Start_DateTime: "2026-10-14T10:00:00.000Z", End_DateTime: "2026-10-14T09:00:00.000Z" },
    {},
    label,
  );
  expect(bad).toEqual({ End_DateTime: "Please enter a valid To." });
  const ok = validateRanges(
    ranges,
    { Start_DateTime: "2026-10-14T10:00:00.000Z", End_DateTime: "2026-10-14T10:00:00.000Z" },
    {},
    label,
  );
  expect(ok).toEqual({});
});

test("all day stores the day at UTC midnight and reads it back unchanged", () => {
  const iso = dateTimePartsToIso({ date: "2026-10-14", time: "" }, true);
  expect(iso).toBe("2026-10-14T00:00:00.000Z");
  expect(isoToDateTimeParts(iso, true)).toEqual({ date: "2026-10-14", time: "" });
  expect(dateTimePartsToIso({ date: "2026-02-30", time: "" }, true)).toBeNull();
  expect(dateTimePartsToIso({ date: "2026-10-14", time: "" }, false)).toBeNull();
});

test("participants: no repeats, at most 50", () => {
  const one = { module: "Contacts", id: "c1", name: "Synthetic One" };
  expect(addParticipant(addParticipant([], one), one)).toHaveLength(1);
  const many = Array.from({ length: MEETING_PARTICIPANTS_MAX }, (_, i) => ({
    module: "Leads",
    id: `l${i}`,
  }));
  expect(addParticipant(many, one)).toHaveLength(MEETING_PARTICIPANTS_MAX);
  expect(participantEntries(participantValue([one]))).toEqual([one]);
  expect(participantValue([one])).toEqual([
    { type: "contact", id: "c1", name: "Synthetic One", email: null },
  ]);
  expect(participantEntries([{ nope: true }] as never)).toEqual([]);
});

test("reminder offsets round-trip through the stored value", () => {
  expect(reminderOffsetOf(reminderValue("PT15M"))).toBe("PT15M");
  expect(reminderOffsetOf(reminderValue("PT0M"))).toBe("PT0M");
  expect(reminderValue(null)).toBeNull();
  expect(reminderOffsetOf(null)).toBeNull();
});
