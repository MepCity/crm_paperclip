import { expect, test } from "vitest";
import { buildCampaignsFilterGroups, campaignsFilterGroups } from "./list-filters";
import { campaignField } from "./test-metadata";

test("system rows are exactly the four reference rows in order (CL-17 - CL-20)", () => {
  expect(campaignsFilterGroups[0]?.items.map((row) => row.label)).toEqual([
    "Record Action",
    "Related Records Action",
    "Touched Records",
    "Untouched Records",
  ]);
});

test("first ten field rows follow CL-22 - CL-31, the rest are alphabetical", () => {
  const groups = buildCampaignsFilterGroups({
    fields: [
      campaignField("Type", { label: "Type", dataType: "picklist" }),
      campaignField("Campaign_Name", { label: "Campaign Name" }),
      campaignField("Expected_Revenue", { label: "Expected Revenue", dataType: "currency" }),
      campaignField("Status", { label: "Status", dataType: "picklist" }),
      campaignField("Start_Date", { label: "Start Date", dataType: "date" }),
      campaignField("Connected_To__s", { label: "Connected To", dataType: "multi_module_lookup" }),
      campaignField("Tag", { label: "Tag" }),
      campaignField("Expected_Response", { label: "Expected Response", dataType: "bigint" }),
    ],
    users: [],
    linkField: "Campaign_Name",
    currencyCode: "TRY",
  });
  const labels = groups[1]?.items.map((row) => row.label) ?? [];
  expect(labels.slice(0, 10)).toEqual([
    "Actual Cost",
    "Budgeted Cost",
    "Campaign Name",
    "Campaign Owner",
    "Connected To",
    "Created By",
    "Created Time",
    "End Date",
    "Expected Response",
    "Expected Revenue",
  ]);
  expect(labels.slice(10)).toEqual(["Start Date", "Status", "Tag", "Type"]);
  expect(labels).not.toContain("Common Status");
  const items = groups[1]?.items ?? [];
  expect(items.find((i) => i.id === "Connected_To__s")?.editor?.fieldType).toBe("multilookup");
  expect(items.find((i) => i.id === "Tag")?.editor?.fieldType).toBe("tag");
  expect(items.find((i) => i.id === "Expected_Revenue")?.editor?.currencyCode).toBe("TRY");
  expect(items.find((i) => i.id === "Type")?.editor?.fieldType).toBe("picklist");
  expect(items.find((i) => i.id === "Expected_Response")?.editor?.fieldType).toBe("integer");
});
