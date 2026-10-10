import { describe, expect, it } from "vitest";
import { isCalendarDateString, parsePanelDateText } from "./panel-date";

describe("panel date parsing", () => {
  it("accepts valid panel text and rejects impossible days", () => {
    expect(parsePanelDateText("05.01.2026")).toBe("2026-01-05");
    expect(parsePanelDateText(" 5.1.2026 ")).toBe("2026-01-05");
    expect(parsePanelDateText("30.02.2026")).toBeNull();
    expect(parsePanelDateText("2026-01-05")).toBeNull();
  });

  it("validates ISO calendar days strictly", () => {
    expect(isCalendarDateString("2026-01-05")).toBe(true);
    expect(isCalendarDateString("2026-02-30")).toBe(false);
  });
});
