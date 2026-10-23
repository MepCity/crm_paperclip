import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { composeMailSchema } from "../mail/outbox";
import { buildInvitationMail, type InvitationMailMeeting } from "./invitation-mail";

const now = new Date("2026-10-01T08:00:00Z");
const organizer = { name: "Org", email: "org@example.test" };
const meeting: InvitationMailMeeting = {
  id: "m1",
  uid: "meeting-1@example.test",
  sequence: 0,
  title: "Kickoff",
  start: new Date("2026-10-05T09:00:00Z"),
  end: new Date("2026-10-05T10:00:00Z"),
  allDay: false,
  location: "Room 1",
  participants: [
    { name: "Ada", email: "ada@example.com" },
    { name: "No Mail", email: null },
  ],
};
const base = { meeting, organizer, mailboxId: "mb1", now };

describe("buildInvitationMail", () => {
  it("builds a REQUEST that passes composeMailSchema", () => {
    const r = buildInvitationMail({ ...base, method: "REQUEST", sequence: 0 });
    expect(composeMailSchema.safeParse(r.compose).success).toBe(true);
    expect(r.compose.to).toEqual([{ address: "ada@example.com", name: "Ada" }]);
    expect(r.skipped).toEqual([{ name: "No Mail" }]);
    expect(r.body).toContain("When: 2026-10-05 09:00 to 2026-10-05 10:00 UTC");
    expect(r.body).toContain("Where: Room 1");
    expect(r.calendarPart.contentType).toBe("text/calendar; method=REQUEST; charset=UTF-8");
    expect(r.calendarPart.filename).toBe("invite.ics");
    expect(r.calendarPart.content).toContain("METHOD:REQUEST");
  });

  it("builds a CANCEL keeping the UID with the given sequence", () => {
    const r = buildInvitationMail({ ...base, method: "CANCEL", sequence: 3 });
    expect(composeMailSchema.safeParse(r.compose).success).toBe(true);
    expect(r.body).toContain("cancelled");
    expect(r.calendarPart.content).toContain("METHOD:CANCEL");
    expect(r.calendarPart.content).toContain("UID:meeting-1@example.test");
    expect(r.calendarPart.content).toContain("SEQUENCE:3");
  });

  it("fails without invitees that have an email", () => {
    const m = { ...meeting, participants: [{ name: "X", email: " " }] };
    expect(() =>
      buildInvitationMail({ ...base, meeting: m, method: "REQUEST", sequence: 0 }),
    ).toThrow(ValidationError);
  });

  it("derives a deterministic idempotency key", () => {
    const a = buildInvitationMail({ ...base, method: "REQUEST", sequence: 1 });
    const b = buildInvitationMail({ ...base, method: "REQUEST", sequence: 1 });
    const c = buildInvitationMail({ ...base, method: "REQUEST", sequence: 2 });
    const d = buildInvitationMail({ ...base, method: "CANCEL", sequence: 1 });
    expect(a.compose.idempotencyKey).toBe(b.compose.idempotencyKey);
    expect(new Set([a, c, d].map((x) => x.compose.idempotencyKey)).size).toBe(3);
  });
});
