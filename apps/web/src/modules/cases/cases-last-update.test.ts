import { expect, test } from "vitest";
import { formatCasesLastUpdateLabel } from "./cases-last-update";
import { casesScreenDefinition } from "./definition";
import { caseRecord } from "./test-metadata";

test("uses the shared last-update format and omits absent timestamps", () => {
  const now = new Date("2026-01-02T12:00:00Z");
  expect(
    formatCasesLastUpdateLabel(caseRecord(), now, { locale: "en-US", timeZone: "UTC" }),
  ).toBeNull();
  expect(
    formatCasesLastUpdateLabel(caseRecord({ Modified_Time: "2026-01-01T12:00:00Z" }), now, {
      locale: "en-US",
      timeZone: "UTC",
    }),
  ).toMatch(/^Last Update : /);
});

test("binds cases last-update formatter to record detail header", () => {
  expect(casesScreenDefinition.detail.lastUpdate).toBe(formatCasesLastUpdateLabel);
  expect(casesScreenDefinition.detail.lastUpdatePlacement).toBe("tab-row");
});
