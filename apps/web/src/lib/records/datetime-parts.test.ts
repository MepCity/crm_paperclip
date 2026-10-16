import { describe, expect, it } from "vitest";
import { allDayClearedTime } from "./datetime-parts";

describe("allDayClearedTime", () => {
  it("returns the next whole hour for From and one hour later for To", () => {
    const now = new Date(2026, 5, 1, 13, 20);
    expect(allDayClearedTime(0, now)).toBe("14:00");
    expect(allDayClearedTime(1, now)).toBe("15:00");
  });
  it("wraps past midnight", () => {
    const now = new Date(2026, 5, 1, 23, 10);
    expect(allDayClearedTime(0, now)).toBe("00:00");
    expect(allDayClearedTime(1, now)).toBe("01:00");
  });
});
