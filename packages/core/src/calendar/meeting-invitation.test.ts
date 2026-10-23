import { describe, expect, it } from "vitest";
import { buildInvitation } from "./ics";
import { type MeetingInvitationSource, meetingToInvitation } from "./meeting-invitation";

const now = new Date("2026-10-01T08:00:00Z");
const organizer = { name: "Org Anizer", email: "org@example.test" };
const meeting: MeetingInvitationSource = {
  uid: "meeting-1@example.test",
  sequence: 2,
  title: "Kickoff",
  start: new Date("2026-10-05T09:00:00Z"),
  end: new Date("2026-10-05T10:00:00Z"),
  allDay: false,
  location: "Room 1",
  description: "Agenda",
  participants: [
    { name: "Ada", email: "ada@example.test" },
    { name: "No Mail", email: null },
    { name: "Bob", email: " bob@example.test " },
  ],
};

describe("meetingToInvitation", () => {
  it("maps a request and skips participants without email", () => {
    const r = meetingToInvitation(meeting, { organizer, method: "REQUEST", now });
    expect(r.method).toBe("REQUEST");
    expect(r.summary).toBe("Kickoff");
    expect(r.sequence).toBe(2);
    expect(r.attendees.map((a) => a.email)).toEqual(["ada@example.test", "bob@example.test"]);
    expect(r.location).toBe("Room 1");
  });

  it("maps a cancel", () => {
    const r = meetingToInvitation(meeting, { organizer, method: "CANCEL", now });
    expect(buildInvitation(r)).toContain("STATUS:CANCELLED");
  });

  it("maps all-day meetings", () => {
    const r = meetingToInvitation(
      {
        ...meeting,
        allDay: true,
        start: new Date("2026-10-05T00:00:00Z"),
        end: new Date("2026-10-06T00:00:00Z"),
      },
      { organizer, method: "REQUEST", now },
    );
    const ics = buildInvitation(r);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261005");
    expect(ics).toContain("DTEND;VALUE=DATE:20261006");
  });

  it("round-trips attendees through buildInvitation", () => {
    const ics = buildInvitation(
      meetingToInvitation(meeting, { organizer, method: "REQUEST", now }),
    );
    expect(ics).toContain("mailto:ada@example.test");
    expect(ics).toContain("mailto:bob@example.test");
    expect(ics).not.toContain("No Mail");
  });
});
