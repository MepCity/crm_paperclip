import { formatRelativeTime } from "@crm/core/format";
import type { RecordData } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import { LEADS_DETAIL_FIELD_API_NAMES } from "@/modules/leads/leads-detail.constants";
import { formatLeadsLastUpdateLabel } from "@/modules/leads/leads-last-update";

const now = new Date("2026-03-15T12:00:00.000Z");
const format = { locale: "en-US", timeZone: "UTC" };
const key = LEADS_DETAIL_FIELD_API_NAMES.Modified_Time;

function record(fields: Record<string, unknown>): RecordData {
  return { id: "lead-1", fields } as unknown as RecordData;
}

describe("formatLeadsLastUpdateLabel", () => {
  it.each([
    ["missing", {}],
    ["null", { [key]: null }],
    ["undefined", { [key]: undefined }],
    ["empty string", { [key]: "" }],
  ])("returns null when the modified time is %s", (_name, fields) => {
    expect(formatLeadsLastUpdateLabel(record(fields), now, format)).toBeNull();
  });

  it.each([
    ["minutes ago", "2026-03-15T11:45:00.000Z"],
    ["days ago", "2026-03-10T12:00:00.000Z"],
  ])("prefixes the relative time (%s)", (_name, value) => {
    const expected = `Last Update : ${formatRelativeTime(value, now, format)}`;
    expect(formatLeadsLastUpdateLabel(record({ [key]: value }), now, format)).toBe(expected);
  });

  it("gives different labels for different distances", () => {
    const a = formatLeadsLastUpdateLabel(
      record({ [key]: "2026-03-15T11:45:00.000Z" }),
      now,
      format,
    );
    const b = formatLeadsLastUpdateLabel(
      record({ [key]: "2026-03-10T12:00:00.000Z" }),
      now,
      format,
    );
    expect(a).not.toBe(b);
  });
});
