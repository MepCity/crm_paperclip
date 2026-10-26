import { expect, test } from "vitest";
import {
  buildCampaignsFormDefaults,
  CAMPAIGNS_FORM_INFORMATION_COLUMNS,
  CAMPAIGNS_FORM_SYSTEM_FIELDS,
  campaignsFormRules,
} from "./campaigns-form-rules";

test("form rules carry owner, currencies, defaults, searchable picklists and omitted fields", () => {
  expect(campaignsFormRules.owner).toBe("Owner");
  expect(campaignsFormRules.currency).toBe("Expected_Revenue");
  expect(campaignsFormRules.currencies).toEqual([
    "Expected_Revenue",
    "Budgeted_Cost",
    "Actual_Cost",
  ]);
  expect(campaignsFormRules.searchablePicklists).toEqual(["Type"]);
  expect(campaignsFormRules.requiredFields).toEqual(["Type"]);
  expect(campaignsFormRules.omitted).toContain("Parent_Campaign");

  expect(campaignsFormRules.omitted).toContain("Connected_To__s");
  for (const name of CAMPAIGNS_FORM_SYSTEM_FIELDS) {
    expect(campaignsFormRules.omitted).toContain(name);
  }
  expect(buildCampaignsFormDefaults()).toEqual({ Type: "-None-", Status: "-None-" });
});

test("Campaign Information follows the spec two-column order", () => {
  expect(CAMPAIGNS_FORM_INFORMATION_COLUMNS[0]).toEqual([
    "Owner",
    "Campaign_Name",
    "Start_Date",
    "Expected_Revenue",
    "Actual_Cost",
    "Num_sent",
  ]);
  expect(CAMPAIGNS_FORM_INFORMATION_COLUMNS[1]).toEqual([
    "Type",
    "Status",
    "End_Date",
    "Budgeted_Cost",
    "Expected_Response",
  ]);
});
