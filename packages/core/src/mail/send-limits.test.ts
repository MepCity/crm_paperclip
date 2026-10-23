import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAILBOX_DAILY_LIMIT,
  DEFAULT_ORGANIZATION_DAILY_LIMIT,
  InMemorySendLimitStore,
} from "./send-limits";

const now = new Date("2026-03-10T10:00:00Z");
const limits = { perMailboxDaily: 5, perOrganizationDaily: 8 };
const base = { organizationId: "org-1", mailboxId: "mbx-1", now };

describe("send limits", () => {
  it("exports defaults", () => {
    expect(DEFAULT_MAILBOX_DAILY_LIMIT).toBe(500);
    expect(DEFAULT_ORGANIZATION_DAILY_LIMIT).toBe(2000);
  });

  it("allows under and at the limit, rejects over", async () => {
    const store = new InMemorySendLimitStore();
    const a = await store.reserve({ ...base, recipientCount: 3 }, limits);
    expect(a).toMatchObject({ allowed: true, remaining: { mailbox: 2, organization: 5 } });
    const b = await store.reserve({ ...base, recipientCount: 2 }, limits);
    expect(b).toMatchObject({ allowed: true, remaining: { mailbox: 0 } });
    const c = await store.reserve({ ...base, recipientCount: 1 }, limits);
    expect(c).toEqual({
      allowed: false,
      reason: "mailbox_daily",
      resetsAt: new Date("2026-03-11T00:00:00Z"),
    });
  });

  it("hits the organisation limit before the mailbox limit", async () => {
    const store = new InMemorySendLimitStore();
    await store.reserve({ ...base, mailboxId: "m2", recipientCount: 5 }, limits);
    const r = await store.reserve({ ...base, recipientCount: 4 }, limits);
    expect(r).toMatchObject({ allowed: false, reason: "organization_daily" });
  });

  it("rolls over at UTC midnight", async () => {
    const store = new InMemorySendLimitStore();
    await store.reserve(
      { ...base, now: new Date("2026-03-10T23:59:59Z"), recipientCount: 5 },
      limits,
    );
    const r = await store.reserve(
      { ...base, now: new Date("2026-03-11T00:00:00Z"), recipientCount: 5 },
      limits,
    );
    expect(r.allowed).toBe(true);
  });

  it("never exceeds the limit under concurrency", async () => {
    const store = new InMemorySendLimitStore();
    const results = await Promise.all(
      Array.from({ length: 20 }, () => store.reserve({ ...base, recipientCount: 1 }, limits)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("release refunds a reservation", async () => {
    const store = new InMemorySendLimitStore();
    const a = await store.reserve({ ...base, recipientCount: 5 }, limits);
    if (!a.allowed) throw new Error("expected allowed");
    expect((await store.reserve({ ...base, recipientCount: 1 }, limits)).allowed).toBe(false);
    await store.release(a.reservationId);
    await store.release(a.reservationId);
    expect((await store.reserve({ ...base, recipientCount: 5 }, limits)).allowed).toBe(true);
  });

  it("rejects invalid input", async () => {
    const store = new InMemorySendLimitStore();
    await expect(store.reserve({ ...base, recipientCount: -1 }, limits)).rejects.toThrow();
    await expect(store.reserve({ ...base, recipientCount: 0 }, limits)).rejects.toThrow();
    await expect(store.reserve({ ...base, recipientCount: 1.5 }, limits)).rejects.toThrow();
  });
});
