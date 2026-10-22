import { describe, expect, it } from "vitest";
import { availableBookingSlots, type BookingSlotInput } from "./booking-slots";

const H = 3_600_000;
const M = 60_000;
const IST = "Europe/Istanbul"; // UTC+3, no DST
const NY = "America/New_York";
const weekdays = (
  tz: string,
  ranges: Array<{ start: string; end: string }>,
): BookingSlotInput["hours"] => ({
  timeZone: tz,
  days: { 0: ranges, 1: ranges, 2: ranges, 3: ranges, 4: ranges, 5: ranges, 6: ranges },
});
const mk = (over: Partial<BookingSlotInput>): BookingSlotInput => ({
  hours: weekdays(IST, [{ start: "09:00", end: "18:00" }]),
  busy: [],
  from: Date.UTC(2026, 5, 1, 0, 0),
  to: Date.UTC(2026, 5, 2, 0, 0),
  durationMinutes: 60,
  now: 0,
  ...over,
});
// 2026-06-01 09:00 Istanbul == 06:00Z
const ist9 = Date.UTC(2026, 5, 1, 6, 0);

describe("availableBookingSlots", () => {
  it("fills a whole empty day", () => {
    const r = availableBookingSlots(mk({}));
    expect(r).toHaveLength(9);
    expect(r[0]).toEqual({ start: ist9, end: ist9 + H });
    expect(r[8].end).toBe(ist9 + 9 * H);
  });

  it("handles a lunch break with two intervals", () => {
    const r = availableBookingSlots(
      mk({
        hours: weekdays(IST, [
          { start: "09:00", end: "12:00" },
          { start: "13:00", end: "18:00" },
        ]),
      }),
    );
    expect(r).toHaveLength(8);
    expect(r.some((s) => s.start === ist9 + 3 * H)).toBe(false);
  });

  it("excludes busy overlap and applies buffer on both sides", () => {
    const busy = [{ start: ist9 + 2 * H, end: ist9 + 3 * H }];
    const plain = availableBookingSlots(mk({ busy })).map((s) => s.start);
    expect(plain).not.toContain(ist9 + 2 * H);
    expect(plain).toContain(ist9 + H);
    expect(plain).toContain(ist9 + 3 * H);
    const buffered = availableBookingSlots(mk({ busy, bufferMinutes: 15 })).map((s) => s.start);
    expect(buffered).not.toContain(ist9 + H);
    expect(buffered).not.toContain(ist9 + 3 * H);
    expect(buffered).toContain(ist9);
    expect(buffered).toContain(ist9 + 4 * H);
  });

  it("respects minimum notice", () => {
    const r = availableBookingSlots(mk({ now: ist9, minNoticeMinutes: 150 }));
    expect(r[0].start).toBe(ist9 + 3 * H);
  });

  it("clips to [from,to) and skips closed days", () => {
    const r = availableBookingSlots(mk({ from: ist9 + 30 * M, to: ist9 + 3 * H, stepMinutes: 30 }));
    expect(r[0].start).toBe(ist9 + 30 * M);
    expect(r[r.length - 1].end).toBe(ist9 + 3 * H);
    // 2026-06-01 is Monday; only Sunday open => nothing
    const closed = availableBookingSlots(
      mk({ hours: { timeZone: IST, days: { 0: [{ start: "09:00", end: "18:00" }] } } }),
    );
    expect(closed).toEqual([]);
  });

  it("supports step smaller than duration", () => {
    const r = availableBookingSlots(mk({ stepMinutes: 30 }));
    expect(r).toHaveLength(17);
    expect(r[1].start - r[0].start).toBe(30 * M);
  });

  it("America/New_York spring forward: gap hour skipped", () => {
    // 2026-03-08 02:00 -> 03:00 local. Open 01:00-04:00 => 2 real hours.
    const r = availableBookingSlots(
      mk({
        hours: weekdays(NY, [{ start: "01:00", end: "04:00" }]),
        from: Date.UTC(2026, 2, 8, 0, 0),
        to: Date.UTC(2026, 2, 9, 0, 0),
      }),
    );
    expect(r).toHaveLength(2);
    expect(r[0].start).toBe(Date.UTC(2026, 2, 8, 6, 0)); // 01:00 EST
    expect(r[1].start).toBe(Date.UTC(2026, 2, 8, 7, 0)); // 03:00 EDT
  });

  it("America/New_York fall back: repeated hour counted once", () => {
    // 2026-11-01 02:00 EDT -> 01:00 EST. Open 00:00-03:00 => 4 real hours.
    const r = availableBookingSlots(
      mk({
        hours: weekdays(NY, [{ start: "00:00", end: "03:00" }]),
        from: Date.UTC(2026, 10, 1, 0, 0),
        to: Date.UTC(2026, 10, 2, 0, 0),
      }),
    );
    expect(r).toHaveLength(4);
    expect(new Set(r.map((s) => s.start)).size).toBe(4);
    expect(r[0].start).toBe(Date.UTC(2026, 10, 1, 4, 0));
  });

  it("Europe/Istanbul around the zone's historic transition dates stays stable", () => {
    const r = availableBookingSlots(
      mk({ from: Date.UTC(2026, 2, 29, 0, 0), to: Date.UTC(2026, 2, 30, 0, 0) }),
    );
    expect(r).toHaveLength(9);
    expect(r[0].start).toBe(Date.UTC(2026, 2, 29, 6, 0));
  });

  it("rejects invalid input", () => {
    expect(() =>
      availableBookingSlots(
        mk({ hours: weekdays("Mars/Base", [{ start: "09:00", end: "10:00" }]) }),
      ),
    ).toThrow(RangeError);
    expect(() =>
      availableBookingSlots(mk({ hours: weekdays(IST, [{ start: "10:00", end: "10:00" }]) })),
    ).toThrow(RangeError);
    expect(() => availableBookingSlots(mk({ durationMinutes: 0 }))).toThrow(RangeError);
    expect(() => availableBookingSlots(mk({ to: Date.UTC(2026, 5, 1, 0, 0) }))).toThrow(RangeError);
  });
});
