import { describe, expect, it } from "vitest";
import { createInMemoryBounceRegistry } from "./bounce-registry";
import type { BounceKind, DeliveryReport } from "./dsn";

const DAY = 24 * 60 * 60 * 1000;

function report(
  finalRecipient: string,
  kind: BounceKind,
  action = "failed",
  status = kind === "permanent" ? "5.1.1" : "4.2.2",
): DeliveryReport {
  return {
    originalMessageId: "<m1@example.com>",
    recipients: [{ finalRecipient, action, status, diagnosticCode: "smtp; test", kind }],
  };
}

function setup() {
  let t = Date.UTC(2026, 0, 1);
  const reg = createInMemoryBounceRegistry({ now: () => new Date(t) });
  return { reg, advance: (ms: number) => (t += ms) };
}

describe("bounce registry", () => {
  it("marks permanent failures bounced at once", () => {
    const { reg } = setup();
    reg.recordReport(report("a@example.com", "permanent"));
    expect(reg.isBounced("a@example.com")).toBe(true);
    expect(reg.get("a@example.com")).toMatchObject({
      state: "bounced",
      reason: "permanent",
      lastStatus: "5.1.1",
    });
  });

  it("bounces after 3 transient failures within the window, not 2", () => {
    const { reg, advance } = setup();
    reg.recordReport(report("a@example.com", "transient"));
    advance(DAY);
    reg.recordReport(report("a@example.com", "transient"));
    expect(reg.isBounced("a@example.com")).toBe(false);
    expect(reg.get("a@example.com")).toMatchObject({ state: "soft", softCount: 2 });
    advance(DAY);
    reg.recordReport(report("a@example.com", "transient"));
    expect(reg.get("a@example.com")).toMatchObject({
      state: "bounced",
      reason: "soft_limit",
      softCount: 3,
    });
  });

  it("drops soft counts that fall outside the window", () => {
    const { reg, advance } = setup();
    reg.recordReport(report("a@example.com", "transient"));
    reg.recordReport(report("a@example.com", "transient"));
    advance(8 * DAY);
    reg.recordReport(report("a@example.com", "transient"));
    expect(reg.get("a@example.com")).toMatchObject({ state: "soft", softCount: 1 });
  });

  it("ignores delayed, delivered and other rows", () => {
    const { reg } = setup();
    reg.recordReport(report("a@example.com", "transient", "delayed"));
    reg.recordReport(report("a@example.com", "other", "delivered", "2.0.0"));
    reg.recordReport(report("a@example.com", "other", "failed", "5.0.0"));
    expect(reg.get("a@example.com")).toBeNull();
    expect(reg.list()).toEqual([]);
  });

  it("matches addresses case-insensitively", () => {
    const { reg } = setup();
    reg.recordReport(report("A@Example.com", "permanent"));
    expect(reg.isBounced("a@EXAMPLE.com")).toBe(true);
    expect(reg.list()).toHaveLength(1);
  });

  it("skips invalid addresses", () => {
    const { reg } = setup();
    reg.recordReport(report("not an address", "permanent"));
    expect(reg.list()).toEqual([]);
    expect(reg.isBounced("not an address")).toBe(false);
  });

  it("does not demote a bounced address on a later soft report", () => {
    const { reg } = setup();
    reg.recordReport(report("a@example.com", "permanent"));
    reg.recordReport(report("a@example.com", "transient"));
    expect(reg.get("a@example.com")).toMatchObject({ state: "bounced", reason: "permanent" });
  });

  it("clear removes the address entirely", () => {
    const { reg } = setup();
    reg.recordReport(report("a@example.com", "permanent"));
    reg.clear("A@example.com");
    expect(reg.isBounced("a@example.com")).toBe(false);
    expect(reg.get("a@example.com")).toBeNull();
  });

  it("lists newest lastSeenAt first", () => {
    const { reg, advance } = setup();
    reg.recordReport(report("a@example.com", "permanent"));
    advance(1000);
    reg.recordReport(report("b@example.com", "permanent"));
    advance(1000);
    reg.recordReport(report("a@example.com", "permanent"));
    expect(reg.list().map((e) => e.address)).toEqual(["a@example.com", "b@example.com"]);
  });
});
