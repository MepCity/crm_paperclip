import { describe, expect, it } from "vitest";
import type { ImipReply } from "./imip-reply";
import { applyImipReply, type InvitationState, summarizeRsvp } from "./rsvp";

const stamp = (s: string) => new Date(s);
const base = (): InvitationState => ({
  tenantId: "t1",
  uid: "uid-1",
  sequence: 1,
  attendees: [
    { email: "a@x.com", partstat: "NEEDS-ACTION", lastReplyStamp: null },
    { email: "b@x.com", partstat: "ACCEPTED", lastReplyStamp: stamp("2026-01-02T00:00:00Z") },
  ],
});
const reply = (
  o: Partial<ImipReply> & { email?: string; partstat?: "DECLINED" } = {},
): ImipReply => ({
  uid: o.uid ?? "uid-1",
  sequence: o.sequence ?? 1,
  attendee: { email: o.email ?? "a@x.com", partstat: o.partstat ?? "DECLINED" },
  dtstamp: o.dtstamp === undefined ? stamp("2026-01-03T00:00:00Z") : o.dtstamp,
});

describe("applyImipReply", () => {
  it("applies a reply", () => {
    const s = base();
    const r = applyImipReply(s, reply());
    expect(r.outcome).toBe("applied");
    expect(r.next.attendees[0]?.partstat).toBe("DECLINED");
    expect(r.next.attendees[0]?.lastReplyStamp).toEqual(stamp("2026-01-03T00:00:00Z"));
    expect(r.next.attendees[1]).toEqual(s.attendees[1]);
  });
  it("reports unknown event", () => {
    const s = base();
    const r = applyImipReply(s, reply({ uid: "other" }));
    expect(r.outcome).toBe("unknown_event");
    expect(r.next).toBe(s);
  });
  it("reports unknown attendee", () => {
    const s = base();
    const r = applyImipReply(s, reply({ email: "z@x.com" }));
    expect(r.outcome).toBe("unknown_attendee");
    expect(r.next).toBe(s);
  });
  it("matches addresses case/whitespace-insensitively", () => {
    expect(applyImipReply(base(), reply({ email: "  A@X.com " })).outcome).toBe("applied");
  });
  it("is stale for lower sequence and older stamp", () => {
    const s = { ...base(), sequence: 2 };
    expect(applyImipReply(s, reply({ sequence: 1 })).outcome).toBe("stale");
    const older = applyImipReply(
      base(),
      reply({ email: "b@x.com", dtstamp: stamp("2026-01-01T00:00:00Z") }),
    );
    expect(older.outcome).toBe("stale");
  });
  it("null dtstamp does not override a stamped reply", () => {
    expect(applyImipReply(base(), reply({ email: "b@x.com", dtstamp: null })).outcome).toBe(
      "stale",
    );
    expect(applyImipReply(base(), reply({ dtstamp: null })).outcome).toBe("applied");
  });
  it("higher reply sequence applies", () => {
    expect(
      applyImipReply(base(), reply({ email: "b@x.com", sequence: 2, dtstamp: null })).outcome,
    ).toBe("applied");
  });
  it("replay is idempotent and input is not mutated", () => {
    const s = base();
    const copy = structuredClone(s);
    const once = applyImipReply(s, reply());
    expect(s).toEqual(copy);
    const twice = applyImipReply(once.next, reply());
    expect(twice.outcome).toBe("applied");
    expect(twice.next).toEqual(once.next);
  });
});

describe("summarizeRsvp", () => {
  it("counts per partstat", () => {
    expect(summarizeRsvp(base())).toEqual({
      "NEEDS-ACTION": 1,
      ACCEPTED: 1,
      DECLINED: 0,
      TENTATIVE: 0,
    });
  });
});
