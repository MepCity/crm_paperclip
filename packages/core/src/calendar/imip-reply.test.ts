import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { buildInvitation } from "./ics";
import { parseImipReply } from "./imip-reply";

function reply(
  opts: { method?: string; event?: string[]; extra?: string[]; eol?: string } = {},
): string {
  const event = opts.event ?? [
    "UID:evt-1@example.com",
    "SEQUENCE:2",
    "DTSTAMP:20260105T080000Z",
    "ATTENDEE;CN=Guest;PARTSTAT=ACCEPTED:mailto:Guest@Example.org",
  ];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    ...(opts.method === "" ? [] : [`METHOD:${opts.method ?? "REPLY"}`]),
    "BEGIN:VEVENT",
    ...event,
    "END:VEVENT",
    ...(opts.extra ?? []),
    "END:VCALENDAR",
  ];
  return lines.join(opts.eol ?? "\r\n");
}

const att = (params: string, value = "mailto:g@example.org") => `ATTENDEE${params}:${value}`;
const withEvent = (...event: string[]) => reply({ event });

function expectInvalid(text: string, field: string): void {
  try {
    parseImipReply(text);
  } catch (e) {
    expect(e).toBeInstanceOf(ValidationError);
    expect(Object.keys((e as ValidationError).fieldErrors)).toContain(field);
    return;
  }
  throw new Error("expected ValidationError");
}

describe("parseImipReply", () => {
  it("parses a basic reply", () => {
    expect(parseImipReply(reply())).toEqual({
      uid: "evt-1@example.com",
      sequence: 2,
      attendee: { email: "guest@example.org", name: "Guest", partstat: "ACCEPTED" },
      dtstamp: new Date("2026-01-05T08:00:00Z"),
    });
  });

  it("accepts LF-only input", () => {
    expect(parseImipReply(reply({ eol: "\n" })).uid).toBe("evt-1@example.com");
  });

  it("unfolds continuation lines (space and tab)", () => {
    const text = [
      "BEGIN:VCALENDAR",
      "METHOD:REPLY",
      "BEGIN:VEVENT",
      "UID:evt-long",
      " -part2@example.com",
      "ATTENDEE;CN=Guest;PARTSTAT=DECLI",
      "\tNED:mailto:g@exam",
      " ple.org",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const r = parseImipReply(text);
    expect(r.uid).toBe("evt-long-part2@example.com");
    expect(r.attendee).toEqual({ email: "g@example.org", name: "Guest", partstat: "DECLINED" });
  });

  it("matches METHOD case-insensitively", () => {
    expect(parseImipReply(reply({ method: "reply" })).sequence).toBe(2);
  });

  it.each(["REQUEST", "CANCEL", "COUNTER", "REFRESH"])("rejects METHOD:%s", (m) => {
    expectInvalid(reply({ method: m }), "method");
  });

  it("rejects a missing METHOD", () => {
    expectInvalid(reply({ method: "" }), "method");
  });

  it("requires exactly one VEVENT", () => {
    const none = "BEGIN:VCALENDAR\r\nMETHOD:REPLY\r\nEND:VCALENDAR";
    expectInvalid(none, "vevent");
    const two = reply({
      extra: ["BEGIN:VEVENT", "UID:b", att(";PARTSTAT=ACCEPTED"), "END:VEVENT"],
    });
    expectInvalid(two, "vevent");
  });

  it("requires UID", () => {
    expectInvalid(withEvent(att(";PARTSTAT=ACCEPTED")), "uid");
    expectInvalid(withEvent("UID:  ", att(";PARTSTAT=ACCEPTED")), "uid");
  });

  it("unescapes the UID", () => {
    expect(parseImipReply(withEvent("UID:a\\,b\\;c\\\\d", att(";PARTSTAT=ACCEPTED"))).uid).toBe(
      "a,b;c\\d",
    );
  });

  it("defaults SEQUENCE to 0 and validates it", () => {
    expect(parseImipReply(withEvent("UID:x", att(";PARTSTAT=ACCEPTED"))).sequence).toBe(0);
    expect(
      parseImipReply(withEvent("UID:x", "SEQUENCE:0", att(";PARTSTAT=ACCEPTED"))).sequence,
    ).toBe(0);
    for (const bad of ["-1", "1.5", "abc", ""]) {
      expectInvalid(withEvent("UID:x", `SEQUENCE:${bad}`, att(";PARTSTAT=ACCEPTED")), "sequence");
    }
  });

  it("requires exactly one ATTENDEE", () => {
    expectInvalid(withEvent("UID:x"), "attendee");
    expectInvalid(
      withEvent(
        "UID:x",
        att(";PARTSTAT=ACCEPTED"),
        att(";PARTSTAT=DECLINED", "mailto:h@example.org"),
      ),
      "attendee",
    );
  });

  it("requires a mailto: value and lowercases/trims the address", () => {
    expectInvalid(withEvent("UID:x", att(";PARTSTAT=ACCEPTED", "http://example.org")), "attendee");
    expectInvalid(withEvent("UID:x", att(";PARTSTAT=ACCEPTED", "mailto:")), "attendee");
    const r = parseImipReply(
      withEvent("UID:x", att(";PARTSTAT=ACCEPTED", "MAILTO: Mixed@Case.ORG ")),
    );
    expect(r.attendee.email).toBe("mixed@case.org");
  });

  it.each(["ACCEPTED", "DECLINED", "TENTATIVE", "NEEDS-ACTION"] as const)(
    "accepts PARTSTAT=%s",
    (p) => {
      expect(parseImipReply(withEvent("UID:x", att(`;PARTSTAT=${p}`))).attendee.partstat).toBe(p);
      expect(
        parseImipReply(withEvent("UID:x", att(`;partstat=${p.toLowerCase()}`))).attendee.partstat,
      ).toBe(p);
    },
  );

  it("rejects missing or unknown PARTSTAT", () => {
    expectInvalid(withEvent("UID:x", att("")), "partstat");
    expectInvalid(withEvent("UID:x", att(";PARTSTAT=DELEGATED")), "partstat");
  });

  it("handles quoted CN with comma, semicolon and colon", () => {
    const r = parseImipReply(
      withEvent("UID:x", att(';CN="Doe, John; Jr: III";PARTSTAT=TENTATIVE')),
    );
    expect(r.attendee).toEqual({
      email: "g@example.org",
      name: "Doe, John; Jr: III",
      partstat: "TENTATIVE",
    });
  });

  it("handles unquoted CN, escaped CN and omits an absent CN", () => {
    expect(
      parseImipReply(withEvent("UID:x", att(";CN=Plain;PARTSTAT=ACCEPTED"))).attendee.name,
    ).toBe("Plain");
    expect(
      parseImipReply(withEvent("UID:x", att(";CN=A\\, B;PARTSTAT=ACCEPTED"))).attendee.name,
    ).toBe("A, B");
    const r = parseImipReply(withEvent("UID:x", att(";PARTSTAT=ACCEPTED")));
    expect("name" in r.attendee).toBe(false);
  });

  it("unescapes newline sequences", () => {
    const r = parseImipReply(withEvent("UID:a\\nb\\Nc", att(";PARTSTAT=ACCEPTED")));
    expect(r.uid).toBe("a\nb\nc");
  });

  it("parses DTSTAMP, null when missing, rejects malformed", () => {
    expect(parseImipReply(withEvent("UID:x", att(";PARTSTAT=ACCEPTED"))).dtstamp).toBeNull();
    for (const bad of [
      "20260105",
      "20260105T080000",
      "2026-01-05T08:00:00Z",
      "20261305T080000Z",
      "20260230T080000Z",
    ]) {
      expectInvalid(withEvent("UID:x", `DTSTAMP:${bad}`, att(";PARTSTAT=ACCEPTED")), "dtstamp");
    }
  });

  it("ignores unknown properties, params and nested components", () => {
    const r = parseImipReply(
      withEvent(
        "X-FOO:bar",
        "UID:x",
        "SUMMARY:Hello",
        "BEGIN:VALARM",
        "UID:inner",
        "END:VALARM",
        att(";X-NUM-GUESTS=3;RSVP=TRUE;PARTSTAT=ACCEPTED;ROLE=REQ-PARTICIPANT"),
        "COMMENT:thanks",
      ),
    );
    expect(r.uid).toBe("x");
    expect(r.attendee.partstat).toBe("ACCEPTED");
  });

  it("round-trips from buildInvitation", () => {
    const request = buildInvitation({
      uid: "rt-1@example.com",
      sequence: 3,
      method: "REQUEST",
      dtstamp: new Date("2026-01-05T08:00:00Z"),
      organizer: { email: "owner@example.com", name: "Owner" },
      attendees: [{ email: "guest@example.org", name: "Doe, Jane", rsvp: true }],
      summary: "Kickoff",
      start: new Date("2026-01-10T09:00:00Z"),
      end: new Date("2026-01-10T10:30:00Z"),
      allDay: false,
    });
    const text = request
      .replace("METHOD:REQUEST", "METHOD:REPLY")
      .replace("PARTSTAT=NEEDS-ACTION", "PARTSTAT=DECLINED");
    expect(parseImipReply(text)).toEqual({
      uid: "rt-1@example.com",
      sequence: 3,
      attendee: { email: "guest@example.org", name: "Doe, Jane", partstat: "DECLINED" },
      dtstamp: new Date("2026-01-05T08:00:00Z"),
    });
  });
});
