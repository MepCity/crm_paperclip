import { expect, test } from "vitest";
import { campaignsRecordHeaderIdentity } from "./campaigns-record-header";
import { campaignRecord } from "./test-metadata";

test("header shows the name with no portrait and no record arrows", () => {
  expect(campaignsRecordHeaderIdentity(campaignRecord({ Campaign_Name: "Spring" }))).toEqual({
    title: "Spring",
    hasPortrait: false,
    recordNavigation: false,
  });
  expect(campaignsRecordHeaderIdentity(campaignRecord()).title).toBe("");
});
