import { type FormatOptions, formatRelativeTime } from "@crm/core/format";
import { describe, expect, it } from "vitest";
import { formatLeadsLastUpdateLabel } from "./leads-last-update";

const now = new Date("2026-03-10T12:00:00Z");
const format: FormatOptions = { locale: "en-US", timeZone: "UTC" };
const record = (fields: Record<string, string | null>) => ({ id: "lead-1", fields });

describe("formatLeadsLastUpdateLabel", () => {
  it("returns null when Modified_Time is null, missing or empty", () => {
    expect(formatLeadsLastUpdateLabel(record({ Modified_Time: null }), now, format)).toBeNull();
    expect(formatLeadsLastUpdateLabel(record({}), now, format)).toBeNull();
    expect(formatLeadsLastUpdateLabel(record({ Modified_Time: "" }), now, format)).toBeNull();
  });

  it("prefixes the relative time from the real formatter", () => {
    const modified = "2026-03-10T09:00:00Z";
    expect(formatLeadsLastUpdateLabel(record({ Modified_Time: modified }), now, format)).toBe(
      `Last Update : ${formatRelativeTime(modified, now, format)}`,
    );
  });
});
