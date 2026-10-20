import { expect, test } from "vitest";
import { isCampaignInlineEditable } from "./campaigns-inline-edit";
import { campaignField } from "./test-metadata";

test("system fields are not inline editable, ordinary fields are", () => {
  expect(isCampaignInlineEditable(campaignField("Campaign_Name"))).toBe(true);
  for (const name of ["Created_By", "Modified_Time", "id", "Last_Activity_Time"]) {
    expect(isCampaignInlineEditable(campaignField(name))).toBe(false);
  }
});
