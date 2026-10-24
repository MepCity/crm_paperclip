import { expect, test } from "vitest";
import { buildCampaignsDetailSections } from "./campaigns-detail-sections";
import { campaignField, campaignMetadata, campaignRecord } from "./test-metadata";

test("builds layout sections; description spans the full width", () => {
  const metadata = {
    ...campaignMetadata([
      campaignField("Campaign_Name"),
      campaignField("Type"),
      campaignField("Description"),
    ]),
    layout: [
      {
        label: "Campaign Information",
        columnCount: 2,
        columns: [["Campaign_Name"], ["Type"]],
        fields: ["Campaign_Name", "Type"],
      },
      {
        label: "Description Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
    ],
  };
  const sections = buildCampaignsDetailSections(
    metadata,
    campaignRecord({ Campaign_Name: "A", Type: "Email", Description: "d" }),
  );
  expect(sections.map((s) => s.title)).toEqual(["Campaign Information", "Description Information"]);
  expect(sections[0]?.fields.map((f) => f.column)).toEqual(["left", "right"]);
  expect(sections[1]?.fields[0]?.column).toBe("full");
});
