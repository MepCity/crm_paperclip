import { expect, test } from "vitest";
import { campaignsListPageConfig } from "./list-config";

test("list config names the link column, labels and Actions rows", () => {
  expect(campaignsListPageConfig).toMatchObject({
    module: "Campaigns",
    linkField: "Campaign_Name",
    pluralLabel: "Campaigns",
    createLabel: "Create Campaign",
  });
  expect(campaignsListPageConfig.sortFieldLabels).toContain("Campaign Name");
  const rows = campaignsListPageConfig.inventory?.actions.map((a) => a.label);
  expect(rows).toContain("Export Campaigns");
  expect(rows).not.toContain("Deduplicate Campaigns");
});
