import { expect, test } from "vitest";
import { campaignsRecordHeaderIdentity } from "./campaigns-record-header";
import { campaignRecord } from "./test-metadata";

test("header shows the name with no portrait and record arrows", () => {
  expect(campaignsRecordHeaderIdentity(campaignRecord({ Campaign_Name: "Spring" }))).toEqual({
    title: "Spring",
    hasPortrait: false,
    recordNavigation: true,
  });
  expect(campaignsRecordHeaderIdentity(campaignRecord()).title).toBe("");
});
