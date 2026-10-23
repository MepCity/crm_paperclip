import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createInvitationProcessor, processMessageCalendarParts } from "./invitation-store";

const org = "org";
const ics = (method: string, body: string) =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Example//EN\r\nMETHOD:${method}\r\n${body}END:VCALENDAR\r\n`;
const reply = (seq: number, stamp: string, email = "bob@example.org") =>
  ics(
    "REPLY",
    `BEGIN:VEVENT\r\nUID:e1@example.com\r\nSEQUENCE:${seq}\r\nDTSTAMP:${stamp}\r\nATTENDEE;PARTSTAT=ACCEPTED:mailto:${email}\r\nEND:VEVENT\r\n`,
  );
const seed = async (p: ReturnType<typeof createInvitationProcessor>) =>
  p.states.put(org, {
    tenantId: org,
    uid: "e1@example.com",
    sequence: 1,
    attendees: [{ email: "bob@example.org", partstat: "NEEDS-ACTION", lastReplyStamp: null }],
  });

describe("incoming iTIP processing", () => {
  it("applies a REPLY, then counts stale and unknown outcomes", async () => {
    const p = createInvitationProcessor();
    await seed(p);
    await processMessageCalendarParts(p, org, "m1", [reply(1, "20261005T090000Z")]);
    expect((await p.states.get(org, "e1@example.com"))?.attendees[0]?.partstat).toBe("ACCEPTED");
    await processMessageCalendarParts(p, org, "m2", [reply(0, "20261005T090000Z")]);
    await processMessageCalendarParts(p, org, "m3", [
      reply(1, "20261005T090000Z", "eve@example.org"),
    ]);
    expect(p.stats).toMatchObject({ replyApplied: 1, replyStale: 1, replyUnknownAttendee: 1 });
  });

  it("counts a REPLY for an unknown event", async () => {
    const p = createInvitationProcessor();
    await processMessageCalendarParts(p, org, "m1", [reply(1, "20261005T090000Z")]);
    expect(p.stats.replyUnknownEvent).toBe(1);
  });

  it("stores REQUEST and CANCEL", async () => {
    const p = createInvitationProcessor();
    const ev = (extra: string) =>
      `BEGIN:VEVENT\r\nUID:e2@example.com\r\nDTSTAMP:20261005T090000Z\r\nSUMMARY:S\r\nORGANIZER:mailto:a@example.com\r\nATTENDEE:mailto:b@example.org\r\n${extra}END:VEVENT\r\n`;
    await processMessageCalendarParts(p, org, "m1", [
      ics("REQUEST", ev("DTSTART:20261008T130000Z\r\nDTEND:20261008T140000Z\r\n")),
    ]);
    await processMessageCalendarParts(p, org, "m2", [ics("CANCEL", ev("SEQUENCE:1\r\n"))]);
    expect(p.stats).toMatchObject({ requestStored: 1, cancelStored: 1, parseFailures: 0 });
    expect((await p.incoming.get(org, "e2@example.com"))?.method).toBe("CANCEL");
  });

  it("counts a malformed part without throwing", async () => {
    const p = createInvitationProcessor();
    await processMessageCalendarParts(p, org, "m1", [ics("REPLY", "garbage\r\n")]);
    expect(p.stats.parseFailures).toBe(1);
  });

  it("is idempotent per message", async () => {
    const p = createInvitationProcessor();
    await seed(p);
    await processMessageCalendarParts(p, org, "m1", [reply(1, "20261005T090000Z")]);
    await processMessageCalendarParts(p, org, "m1", [reply(1, "20261005T090000Z")]);
    expect(p.stats).toMatchObject({ replyApplied: 1, duplicates: 1 });
  });

  it("handles fixture 09", async () => {
    const eml = readFileSync(
      new URL("../../test-fixtures/mail/09-calendar-invite.eml", import.meta.url),
      "utf8",
    );
    const part = eml.slice(eml.indexOf("BEGIN:VCALENDAR"), eml.indexOf("--ics-boundary--"));
    const p = createInvitationProcessor();
    await processMessageCalendarParts(p, org, "m1", [part]);
    expect(p.stats.requestStored).toBe(1);
    expect((await p.incoming.get(org, "event-1@example.com"))?.organizer.email).toBe(
      "alice@example.com",
    );
  });

  it("applies a REPLY only when the sender is the attendee", async () => {
    const p = createInvitationProcessor();
    await seed(p);
    const part = reply(1, "20261005T090000Z");
    await processMessageCalendarParts(p, org, "m1", [part], {
      sender: "eve@example.org",
      mailboxAddresses: [],
    });
    expect((await p.states.get(org, "e1@example.com"))?.attendees[0]?.partstat).toBe(
      "NEEDS-ACTION",
    );
    await processMessageCalendarParts(p, org, "m2", [part], {
      sender: "Bob@Example.org",
      mailboxAddresses: [],
    });
    expect(p.stats).toMatchObject({ replySenderMismatch: 1, replyApplied: 1 });
  });

  it("skips a REQUEST whose organizer is the receiving mailbox", async () => {
    const p = createInvitationProcessor();
    const req = ics(
      "REQUEST",
      "BEGIN:VEVENT\r\nUID:o1@example.com\r\nDTSTAMP:20261005T090000Z\r\nDTSTART:20261008T130000Z\r\nDTEND:20261008T140000Z\r\nSUMMARY:S\r\nORGANIZER:mailto:me@example.com\r\nATTENDEE:mailto:b@example.org\r\nEND:VEVENT\r\n",
    );
    await processMessageCalendarParts(p, org, "m1", [req], {
      sender: "x@example.org",
      mailboxAddresses: ["ME@example.com"],
    });
    expect(p.stats).toMatchObject({ requestOwnOrganizer: 1, requestStored: 0 });
  });
});
