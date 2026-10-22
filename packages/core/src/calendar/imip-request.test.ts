import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { buildInvitation } from "./ics";
import { parseImipRequest } from "./imip-request";

function makeIcs(
  opts: { method?: string; event?: string[]; extra?: string[]; eol?: string } = {},
): string {
  const event = opts.event ?? [
    "UID:event-1@example.com",
    "SEQUENCE:0",
    "DTSTART:20261008T130000Z",
    "DTEND:20261008T140000Z",
    "SUMMARY:Planning sync",
    "ORGANIZER;CN=Alice Example:mailto:alice@example.com",
    "ATTENDEE;CN=Bob Example:mailto:bob@example.org",
  ];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    ...(opts.method === "" ? [] : [`METHOD:${opts.method ?? "REQUEST"}`]),
    "BEGIN:VEVENT",
    ...event,
    "END:VEVENT",
    ...(opts.extra ?? []),
    "END:VCALENDAR",
  ];
  return lines.join(opts.eol ?? "\r\n");
}

function expectInvalid(text: string, field: string): void {
  try {
    parseImipRequest(text);
  } catch (e) {
    expect(e).toBeInstanceOf(ValidationError);
    expect(Object.keys((e as ValidationError).fieldErrors)).toContain(field);
    return;
  }
  throw new Error(`expected ValidationError with field "${field}"`);
}

describe("parseImipRequest", () => {
  it("parses calendar invite from 09-calendar-invite.eml fixture", () => {
    const emlPath = resolve(__dirname, "../../test-fixtures/mail/09-calendar-invite.eml");
    const emlContent = readFileSync(emlPath, "utf-8");

    // Simple boundary split as requested in the specification
    const parts = emlContent.split("--ics-boundary");
    const calendarPart = parts.find((p) => p.includes("BEGIN:VCALENDAR")) ?? "";
    expect(calendarPart).not.toBe("");

    // Split on empty line separating MIME headers from body
    const bodyIndex = calendarPart.indexOf("\n\n");
    const icsText = bodyIndex >= 0 ? calendarPart.slice(bodyIndex + 2) : calendarPart;

    const req = parseImipRequest(icsText);
    expect(req).toEqual({
      method: "REQUEST",
      uid: "event-1@example.com",
      sequence: 0,
      summary: "Planning sync",
      start: "2026-10-08T13:00:00Z",
      end: "2026-10-08T14:00:00Z",
      organizer: {
        email: "alice@example.com",
        name: "Alice Example",
      },
      attendees: [
        {
          email: "bob@example.org",
          name: "Bob Example",
          partstat: "NEEDS-ACTION",
        },
      ],
    });
  });

  it("round-trips REQUEST from buildInvitation", () => {
    const original = {
      uid: "roundtrip-req-1@example.com",
      sequence: 2,
      method: "REQUEST" as const,
      dtstamp: new Date("2026-01-05T08:00:00Z"),
      organizer: { email: "organizer@example.com", name: "Org Leader" },
      attendees: [
        {
          email: "guest1@example.org",
          name: "Guest One",
          partstat: "ACCEPTED" as const,
          rsvp: true,
        },
        { email: "guest2@example.org", partstat: "DECLINED" as const },
      ],
      summary: "Quarterly Review",
      location: "Conference Room A",
      description: "Q1 sync and roadmap",
      start: new Date("2026-01-15T09:00:00Z"),
      end: new Date("2026-01-15T10:30:00Z"),
      allDay: false,
    };

    const icsText = buildInvitation(original);
    const parsed = parseImipRequest(icsText);

    expect(parsed).toEqual({
      method: "REQUEST",
      uid: "roundtrip-req-1@example.com",
      sequence: 2,
      summary: "Quarterly Review",
      location: "Conference Room A",
      start: "2026-01-15T09:00:00Z",
      end: "2026-01-15T10:30:00Z",
      organizer: {
        email: "organizer@example.com",
        name: "Org Leader",
      },
      attendees: [
        {
          email: "guest1@example.org",
          name: "Guest One",
          partstat: "ACCEPTED",
        },
        {
          email: "guest2@example.org",
          partstat: "DECLINED",
        },
      ],
    });
  });

  it("round-trips CANCEL from buildInvitation", () => {
    const original = {
      uid: "roundtrip-cancel-1@example.com",
      sequence: 3,
      method: "CANCEL" as const,
      dtstamp: new Date("2026-01-05T08:00:00Z"),
      organizer: { email: "boss@example.com", name: "Boss" },
      attendees: [
        { email: "member@example.org", name: "Member", partstat: "NEEDS-ACTION" as const },
      ],
      summary: "Cancelled Project Kickoff",
      start: new Date("2026-01-20T14:00:00Z"),
      end: new Date("2026-01-20T15:00:00Z"),
      allDay: false,
    };

    const icsText = buildInvitation(original);
    const parsed = parseImipRequest(icsText);

    expect(parsed.method).toBe("CANCEL");
    expect(parsed.uid).toBe("roundtrip-cancel-1@example.com");
    expect(parsed.sequence).toBe(3);
    expect(parsed.summary).toBe("Cancelled Project Kickoff");
    expect(parsed.organizer).toEqual({ email: "boss@example.com", name: "Boss" });
  });

  it("round-trips all-day event from buildInvitation", () => {
    const original = {
      uid: "allday-1@example.com",
      sequence: 0,
      method: "REQUEST" as const,
      dtstamp: new Date("2026-01-05T08:00:00Z"),
      organizer: { email: "hr@example.com", name: "People Team" },
      attendees: [{ email: "all@example.org", partstat: "NEEDS-ACTION" as const }],
      summary: "Company Offsite",
      start: new Date("2026-02-01T00:00:00Z"),
      end: new Date("2026-02-03T00:00:00Z"),
      allDay: true,
    };

    const icsText = buildInvitation(original);
    const parsed = parseImipRequest(icsText);

    expect(parsed.allDay).toBe(true);
    expect(parsed.start).toBe("2026-02-01");
    expect(parsed.end).toBe("2026-02-03");
  });

  it("unfolds continuation lines (space and tab)", () => {
    const text = [
      "BEGIN:VCALENDAR",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      "UID:long-event",
      " -id-part2@example.com",
      "DTSTART:20261008T13",
      " 0000Z",
      "DTEND:20261008T14",
      "\t0000Z",
      "SUMMARY:Very long summary line",
      "  continued with space",
      "ORGANIZER;CN=Alice",
      "  Example:mailto:al",
      "\tice@example.com",
      "ATTENDEE;CN=Bob",
      "  Example;ROLE=REQ-PARTI",
      " CIPANT:mailto:bob@example.org",
      "LOCATION:Building B,",
      "  Room 101",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const parsed = parseImipRequest(text);
    expect(parsed.uid).toBe("long-event-id-part2@example.com");
    expect(parsed.summary).toBe("Very long summary line continued with space");
    expect(parsed.location).toBe("Building B, Room 101");
    expect(parsed.organizer).toEqual({ email: "alice@example.com", name: "Alice Example" });
    expect(parsed.attendees[0]).toEqual({
      email: "bob@example.org",
      name: "Bob Example",
      role: "REQ-PARTICIPANT",
      partstat: "NEEDS-ACTION",
    });
  });

  it("resolves escaped characters in summary, location and parameters", () => {
    const text = makeIcs({
      event: [
        "UID:esc-1@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "SUMMARY:Sync\\, review\\; agenda\\nSecond line\\NThird line\\\\done",
        "LOCATION:Room 1\\, Floor 2\\; Building A",
        'ORGANIZER;CN="Doe\\, Jane":mailto:jane@example.com',
        'ATTENDEE;CN="Smith\\, John":mailto:john@example.org',
      ],
    });

    const parsed = parseImipRequest(text);
    expect(parsed.summary).toBe("Sync, review; agenda\nSecond line\nThird line\\done");
    expect(parsed.location).toBe("Room 1, Floor 2; Building A");
    expect(parsed.organizer.name).toBe("Doe, Jane");
    expect(parsed.attendees[0]?.name).toBe("Smith, John");
  });

  it("handles TZID parameter and keeps it as a field", () => {
    const text = makeIcs({
      event: [
        "UID:tzid-1@example.com",
        "DTSTART;TZID=America/New_York:20261008T090000",
        "DTEND;TZID=America/New_York:20261008T100000",
        "SUMMARY:New York Meeting",
        "ORGANIZER:mailto:host@example.com",
        "ATTENDEE:mailto:guest@example.org",
      ],
    });

    const parsed = parseImipRequest(text);
    expect(parsed.tzid).toBe("America/New_York");
    expect(parsed.start).toBe("2026-10-08T09:00:00");
    expect(parsed.end).toBe("2026-10-08T10:00:00");
    expect(parsed.allDay).toBeUndefined();
  });

  it("parses all-day events with VALUE=DATE", () => {
    const text = makeIcs({
      event: [
        "UID:allday-2@example.com",
        "DTSTART;VALUE=DATE:20261015",
        "DTEND;VALUE=DATE:20261016",
        "SUMMARY:Holiday",
        "ORGANIZER:mailto:admin@example.com",
      ],
    });

    const parsed = parseImipRequest(text);
    expect(parsed.allDay).toBe(true);
    expect(parsed.start).toBe("2026-10-15");
    expect(parsed.end).toBe("2026-10-16");
    expect(parsed.tzid).toBeUndefined();
  });

  it("parses attendee ROLE parameter", () => {
    const text = makeIcs({
      event: [
        "UID:role-1@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:mailto:admin@example.com",
        "ATTENDEE;ROLE=CHAIR;PARTSTAT=ACCEPTED;CN=Chair Person:mailto:chair@example.org",
        "ATTENDEE;ROLE=OPT-PARTICIPANT;PARTSTAT=TENTATIVE:mailto:opt@example.org",
      ],
    });

    const parsed = parseImipRequest(text);
    expect(parsed.attendees).toEqual([
      {
        email: "chair@example.org",
        name: "Chair Person",
        role: "CHAIR",
        partstat: "ACCEPTED",
      },
      {
        email: "opt@example.org",
        role: "OPT-PARTICIPANT",
        partstat: "TENTATIVE",
      },
    ]);
  });

  it("parses organizer without CN and attendee without CN/role", () => {
    const text = makeIcs({
      event: [
        "UID:simple-1@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:mailto:Plain@Example.COM",
        "ATTENDEE:mailto:Guest@Example.COM",
      ],
    });

    const parsed = parseImipRequest(text);
    expect(parsed.organizer).toEqual({ email: "plain@example.com" });
    expect("name" in parsed.organizer).toBe(false);
    expect(parsed.attendees[0]).toEqual({
      email: "guest@example.com",
      partstat: "NEEDS-ACTION",
    });
    const firstAttendee = parsed.attendees[0];
    expect(firstAttendee).toBeDefined();
    if (firstAttendee) {
      expect("name" in firstAttendee).toBe(false);
      expect("role" in firstAttendee).toBe(false);
    }
  });

  it("accepts LF-only input and case-insensitive METHOD", () => {
    const text = makeIcs({ method: "request", eol: "\n" });
    const parsed = parseImipRequest(text);
    expect(parsed.method).toBe("REQUEST");
    expect(parsed.uid).toBe("event-1@example.com");
  });

  it("rejects missing or empty UID", () => {
    const noUid = makeIcs({
      event: [
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:mailto:a@example.com",
      ],
    });
    expectInvalid(noUid, "uid");

    const emptyUid = makeIcs({
      event: [
        "UID:   ",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:mailto:a@example.com",
      ],
    });
    expectInvalid(emptyUid, "uid");
  });

  it("rejects missing or unsupported METHOD", () => {
    expectInvalid(makeIcs({ method: "" }), "method");
    expectInvalid(makeIcs({ method: "REPLY" }), "method");
    expectInvalid(makeIcs({ method: "PUBLISH" }), "method");
    expectInvalid(makeIcs({ method: "COUNTER" }), "method");
  });

  it("requires exactly one VEVENT", () => {
    const zeroEvents = "BEGIN:VCALENDAR\r\nMETHOD:REQUEST\r\nEND:VCALENDAR";
    expectInvalid(zeroEvents, "vevent");

    const twoEvents = makeIcs({
      extra: [
        "BEGIN:VEVENT",
        "UID:second@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:mailto:a@example.com",
        "END:VEVENT",
      ],
    });
    expectInvalid(twoEvents, "vevent");
  });

  it("validates SEQUENCE as non-negative integer", () => {
    for (const bad of ["-1", "1.5", "abc"]) {
      const text = makeIcs({
        event: [
          "UID:seq-test@example.com",
          `SEQUENCE:${bad}`,
          "DTSTART:20261008T130000Z",
          "DTEND:20261008T140000Z",
          "ORGANIZER:mailto:a@example.com",
        ],
      });
      expectInvalid(text, "sequence");
    }
  });

  it("validates ORGANIZER is required and must be mailto:", () => {
    const noOrg = makeIcs({
      event: ["UID:test@example.com", "DTSTART:20261008T130000Z", "DTEND:20261008T140000Z"],
    });
    expectInvalid(noOrg, "organizer");

    const badOrg = makeIcs({
      event: [
        "UID:test@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:http://example.com/org",
      ],
    });
    expectInvalid(badOrg, "organizer");

    const emptyOrg = makeIcs({
      event: [
        "UID:test@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:mailto:",
      ],
    });
    expectInvalid(emptyOrg, "organizer");
  });

  it("validates DTSTART and DTEND are required and properly formed", () => {
    const noStart = makeIcs({
      event: ["UID:test@example.com", "DTEND:20261008T140000Z", "ORGANIZER:mailto:a@example.com"],
    });
    expectInvalid(noStart, "start");

    const noEnd = makeIcs({
      event: ["UID:test@example.com", "DTSTART:20261008T130000Z", "ORGANIZER:mailto:a@example.com"],
    });
    expectInvalid(noEnd, "end");

    for (const bad of ["bad-date", "20261301T120000Z", "20260230T120000Z"]) {
      const badStart = makeIcs({
        event: [
          "UID:test@example.com",
          `DTSTART:${bad}`,
          "DTEND:20261008T140000Z",
          "ORGANIZER:mailto:a@example.com",
        ],
      });
      expectInvalid(badStart, "start");
    }
  });

  it("validates ATTENDEE mailto and PARTSTAT", () => {
    const badAttMail = makeIcs({
      event: [
        "UID:test@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:mailto:a@example.com",
        "ATTENDEE:not-mailto@example.com",
      ],
    });
    expectInvalid(badAttMail, "attendee");

    const badPartstat = makeIcs({
      event: [
        "UID:test@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "ORGANIZER:mailto:a@example.com",
        "ATTENDEE;PARTSTAT=UNKNOWN:mailto:guest@example.org",
      ],
    });
    expectInvalid(badPartstat, "partstat");
  });

  it("ignores unknown properties and nested components", () => {
    const text = makeIcs({
      event: [
        "UID:nested-1@example.com",
        "DTSTART:20261008T130000Z",
        "DTEND:20261008T140000Z",
        "SUMMARY:Meeting with Alarm",
        "ORGANIZER:mailto:host@example.com",
        "X-CUSTOM-PROP:custom-value",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Reminder",
        "TRIGGER:-PT15M",
        "END:VALARM",
      ],
    });

    const parsed = parseImipRequest(text);
    expect(parsed.uid).toBe("nested-1@example.com");
    expect(parsed.summary).toBe("Meeting with Alarm");
  });
});
