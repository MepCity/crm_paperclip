import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { buildInvitation, type InvitationInput } from "./ics";

const base: InvitationInput = {
  uid: "evt-1@example.com",
  sequence: 0,
  method: "REQUEST",
  dtstamp: new Date("2026-01-05T08:00:00Z"),
  organizer: { email: "owner@example.com", name: "Owner" },
  attendees: [{ email: "guest@example.org", name: "Guest", partstat: "NEEDS-ACTION", rsvp: true }],
  summary: "Kickoff",
  start: new Date("2026-01-10T09:00:00Z"),
  end: new Date("2026-01-10T10:30:00Z"),
  allDay: false,
};

describe("buildInvitation", () => {
  it("builds a timed REQUEST", () => {
    expect(buildInvitation({ ...base, location: "Room 1" })).toBe(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MepCity//CRM//EN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        "UID:evt-1@example.com",
        "SEQUENCE:0",
        "DTSTAMP:20260105T080000Z",
        "DTSTART:20260110T090000Z",
        "DTEND:20260110T103000Z",
        "SUMMARY:Kickoff",
        "LOCATION:Room 1",
        "ORGANIZER;CN=Owner:mailto:owner@example.com",
        "ATTENDEE;CN=Guest;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:guest@example.org",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
      ].join("\r\n"),
    );
  });

  it("builds an all-day event with exclusive end", () => {
    const out = buildInvitation({
      ...base,
      allDay: true,
      start: new Date("2026-01-31T00:00:00Z"),
      end: new Date("2026-02-01T00:00:00Z"),
    });
    expect(out).toBe(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MepCity//CRM//EN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        "UID:evt-1@example.com",
        "SEQUENCE:0",
        "DTSTAMP:20260105T080000Z",
        "DTSTART;VALUE=DATE:20260131",
        "DTEND;VALUE=DATE:20260201",
        "SUMMARY:Kickoff",
        "ORGANIZER;CN=Owner:mailto:owner@example.com",
        "ATTENDEE;CN=Guest;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:guest@example.org",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
      ].join("\r\n"),
    );
  });

  it("escapes text", () => {
    const out = buildInvitation({ ...base, summary: "a\\b;c,d\ne" });
    expect(out).toContain("SUMMARY:a\\\\b\\;c\\,d\\ne\r\n");
  });

  it("quotes CN when needed", () => {
    const out = buildInvitation({
      ...base,
      organizer: { email: "o@example.com", name: "Doe, Jane" },
    });
    expect(out).toContain('ORGANIZER;CN="Doe, Jane":mailto:o@example.com');
  });

  it("folds long lines at 75 octets without splitting characters", () => {
    const description = "Toplantı gündemi: çalışma şğüöı İ ".repeat(12);
    const out = buildInvitation({ ...base, description });
    const lines = out.split("\r\n");
    const enc = new TextEncoder();
    for (const l of lines) expect(enc.encode(l).length).toBeLessThanOrEqual(75);
    expect(lines.some((l) => l.startsWith(" "))).toBe(true);
    const unfolded = out.replace(/\r\n /g, "");
    expect(unfolded).toContain(
      `DESCRIPTION:${description.replace(/:/g, ":").replace(/,/g, "\\,")}`,
    );
  });

  it("builds CANCEL with STATUS:CANCELLED", () => {
    const out = buildInvitation({ ...base, method: "CANCEL", sequence: 1 });
    expect(out).toContain("METHOD:CANCEL\r\n");
    expect(out).toContain("SEQUENCE:1\r\n");
    expect(out).toContain("STATUS:CANCELLED\r\n");
  });

  it("rejects invalid input", () => {
    expect(() => buildInvitation({ ...base, end: base.start })).toThrow(ValidationError);
    const day = new Date("2026-01-31T00:00:00Z");
    expect(() => buildInvitation({ ...base, allDay: true, start: day, end: day })).toThrow(
      ValidationError,
    );
    expect(() =>
      buildInvitation({ ...base, organizer: { email: "a@example.com\r\nX-EVIL:1" } }),
    ).toThrow(ValidationError);
    expect(() =>
      buildInvitation({ ...base, attendees: [{ email: "b@example.com\r\nX-EVIL:1" }] }),
    ).toThrow(ValidationError);
    expect(() => buildInvitation({ ...base, attendees: [{ email: "" }] })).toThrow(ValidationError);
    expect(() => buildInvitation({ ...base, uid: "" })).toThrow(ValidationError);
    expect(() => buildInvitation({ ...base, attendees: [] })).toThrow(ValidationError);
  });

  it("allows CANCEL without attendees", () => {
    expect(() => buildInvitation({ ...base, method: "CANCEL", attendees: [] })).not.toThrow();
  });
});
