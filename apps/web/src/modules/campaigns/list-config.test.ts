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
  const actions = campaignsListPageConfig.inventory?.actions ?? [];
  expect(actions.find((a) => a.id === "tags")?.laterModule).toBeUndefined();
  expect(actions.find((a) => a.id === "export")?.laterModule).toBeUndefined();
  expect(actions.find((a) => a.id === "print")?.submenu?.map((a) => a.label)).toEqual([
    "Print Default view",
    "Print Using Canvas",
  ]);
  expect(campaignsListPageConfig.paths.tags).toBeDefined();
  expect(rows).not.toContain("Deduplicate Campaigns");
});
