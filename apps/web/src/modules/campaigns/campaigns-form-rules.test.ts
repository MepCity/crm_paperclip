import { expect, test } from "vitest";
import {
  buildCampaignsFormDefaults,
  CAMPAIGNS_FORM_SYSTEM_FIELDS,
  campaignsFormRules,
} from "./campaigns-form-rules";

test("form rules carry owner, currency prefix, defaults and omitted system fields", () => {
  expect(campaignsFormRules.owner).toBe("Owner");
  expect(campaignsFormRules.currencies).toEqual([
    "Expected_Revenue",
    "Budgeted_Cost",
    "Actual_Cost",
  ]);
  expect(buildCampaignsFormDefaults()).toEqual({ Type: "-None-", Status: "-None-" });
  for (const name of CAMPAIGNS_FORM_SYSTEM_FIELDS) {
    expect(campaignsFormRules.omitted).toContain(name);
  }
});
