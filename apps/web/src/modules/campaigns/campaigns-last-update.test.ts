import { expect, test } from "vitest";
import { formatCampaignsLastUpdateLabel } from "./campaigns-last-update";
import { campaignsScreenDefinition } from "./definition";
import { campaignRecord } from "./test-metadata";

test("uses the shared last-update format and omits absent timestamps", () => {
  const now = new Date("2026-01-02T12:00:00Z");
  const options = { locale: "en-US", timeZone: "UTC" };
  expect(formatCampaignsLastUpdateLabel(campaignRecord(), now, options)).toBeNull();
  expect(
    formatCampaignsLastUpdateLabel(
      campaignRecord({ Modified_Time: "2026-01-01T12:00:00Z" }),
      now,
      options,
    ),
  ).toMatch(/^Last Update : /);
});

test("the screen definition wires the formatter into the record header", () => {
  expect(campaignsScreenDefinition.detail?.lastUpdate).toBe(formatCampaignsLastUpdateLabel);
});
