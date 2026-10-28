import { describe, expect, it } from "vitest";
import { createSendQuota } from "./send-quota";

const H = 60 * 60 * 1000;
const T0 = new Date("2026-01-01T00:00:00Z");
const at = (ms: number) => new Date(T0.getTime() + ms);
const a1 = { organizationId: "a", mailboxId: "m1" };
const a2 = { organizationId: "a", mailboxId: "m2" };
const b1 = { organizationId: "b", mailboxId: "m1" };

describe("createSendQuota", () => {
  it("handles exactly-full, one-under and one-over boundaries", () => {
    const q = createSendQuota({ perMailboxLimit: 5, perOrganizationLimit: 100 });
    q.record(a1, 4, T0);
    expect(q.check(a1, 1, T0)).toEqual({ ok: true, remaining: 0 });
    expect(q.check(a1, 0 + 1, T0).ok).toBe(true);
    expect(q.check(a1, 2, T0)).toEqual({
      ok: false,
      reason: "mailbox_limit",
      retryAt: at(24 * H),
    });
    q.record(a1, 1, T0);
    expect(q.check(a1, 1, T0).ok).toBe(false);
  });

  it("check does not change state", () => {
    const q = createSendQuota({ perMailboxLimit: 1, perOrganizationLimit: 1 });
    q.check(a1, 1, T0);
    q.check(a1, 1, T0);
    expect(q.check(a1, 1, T0)).toEqual({ ok: true, remaining: 0 });
  });

  it("restores capacity as the window slides, with exact retryAt", () => {
    const q = createSendQuota({ perMailboxLimit: 2, perOrganizationLimit: 10 });
    q.record(a1, 1, at(0));
    q.record(a1, 1, at(10 * H));
    const blocked = q.check(a1, 1, at(11 * H));
    expect(blocked).toEqual({ ok: false, reason: "mailbox_limit", retryAt: at(24 * H) });
    expect(q.check(a1, 1, at(24 * H - 1)).ok).toBe(false);
    expect(q.check(a1, 1, at(24 * H))).toEqual({ ok: true, remaining: 0 });
    expect(q.check(a1, 2, at(24 * H)).ok).toBe(false);
    expect(q.check(a1, 2, at(34 * H))).toEqual({ ok: true, remaining: 0 });
  });

  it("isolates mailboxes but shares the organization limit", () => {
    const q = createSendQuota({ perMailboxLimit: 3, perOrganizationLimit: 4 });
    q.record(a1, 3, T0);
    expect(q.check(a2, 1, T0)).toEqual({ ok: true, remaining: 0 });
    expect(q.check(a1, 1, T0)).toMatchObject({ ok: false, reason: "mailbox_limit" });
    q.record(a2, 1, at(H));
    expect(q.check(a2, 1, at(H))).toEqual({
      ok: false,
      reason: "organization_limit",
      retryAt: at(24 * H),
    });
    expect(q.check(b1, 3, at(H))).toEqual({ ok: true, remaining: 0 });
  });

  it("counts one unit per recipient", () => {
    const q = createSendQuota({ perMailboxLimit: 10, perOrganizationLimit: 10 });
    q.record(a1, 7, T0);
    expect(q.check(a1, 3, T0)).toEqual({ ok: true, remaining: 0 });
    expect(q.check(a1, 4, T0).ok).toBe(false);
  });

  it("supports a custom window", () => {
    const q = createSendQuota({ perMailboxLimit: 1, perOrganizationLimit: 1, windowMs: H });
    q.record(a1, 1, T0);
    expect(q.check(a1, 1, at(30 * 60 * 1000))).toMatchObject({ ok: false, retryAt: at(H) });
    expect(q.check(a1, 1, at(H)).ok).toBe(true);
  });

  it("rejects invalid limits and recipients", () => {
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => createSendQuota({ perMailboxLimit: bad, perOrganizationLimit: 1 })).toThrow(
        RangeError,
      );
      expect(() => createSendQuota({ perMailboxLimit: 1, perOrganizationLimit: bad })).toThrow(
        RangeError,
      );
    }
    const q = createSendQuota({ perMailboxLimit: 1, perOrganizationLimit: 1 });
    expect(() => q.check(a1, 0, T0)).toThrow(RangeError);
    expect(() => q.record(a1, 1.5, T0)).toThrow(RangeError);
  });
});
