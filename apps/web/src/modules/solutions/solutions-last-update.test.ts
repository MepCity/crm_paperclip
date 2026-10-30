import { expect, test } from "vitest";
import { solutionsScreenDefinition } from "./definition";
import { formatSolutionsLastUpdateLabel } from "./solutions-last-update";
import { solutionRecord } from "./test-metadata";

const options = { locale: "en-US", timeZone: "UTC" };
const now = new Date("2026-01-02T12:00:00Z");

test("omits the label when Modified_Time is absent", () => {
  expect(formatSolutionsLastUpdateLabel(solutionRecord(), now, options)).toBeNull();
});

test("formats the shared last-update label when Modified_Time is present", () => {
  expect(
    formatSolutionsLastUpdateLabel(
      solutionRecord({ Modified_Time: "2026-01-01T12:00:00Z" }),
      now,
      options,
    ),
  ).toMatch(/^Last Update : /);
});

test("wires the formatter into the record detail definition", () => {
  expect(solutionsScreenDefinition.detail.lastUpdate).toBe(formatSolutionsLastUpdateLabel);
});
