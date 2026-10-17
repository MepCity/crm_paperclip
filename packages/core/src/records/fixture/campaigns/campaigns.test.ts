import { describe, expect, it } from "vitest";
import { describeCampaignMembershipContract } from "../../campaign-contract-suite";
import { describeRecordServiceContract } from "../../contract-suite";
import { campaignsRecordServiceContractModule } from "../../contract-suite-module";
import { campaignMemberStatuses } from "../campaign-members/picklists";
import { generateFixtureCampaignMembers } from "../campaign-members/seed";
import { createFixtureRecordService } from "../index";
import { fixtureModules, supportedModules } from "../registry";
import { campaignsMetadata } from "./metadata";
import { campaignsPicklists } from "./picklists";
import { generateFixtureCampaigns } from "./seed";
import source from "./source-table.json";
import { campaignsViews } from "./views";

describeRecordServiceContract(
  "fixture Campaigns",
  createFixtureRecordService,
  campaignsRecordServiceContractModule,
);
describeCampaignMembershipContract("fixture", createFixtureRecordService);
describe("Campaigns source and seed", () => {
  it("matches the sanitized export field/type/flags, layout, picklists and four criteria tables", () => {
    expect(campaignsMetadata.fields).toEqual(
      source.fields.map((field) => ({
        ...field,
        ...(field.dataType === "picklist" ? { picklist: campaignsPicklists[field.apiName] } : {}),
      })),
    );
    expect(campaignsMetadata.layout).toEqual(source.layout);
    expect(campaignsPicklists).toEqual(source.picklists);
    expect(campaignsViews).toEqual(source.views);
    expect(campaignsMetadata.fields).toHaveLength(21);
    expect(campaignsPicklists.Type).toHaveLength(13);
    expect(campaignsPicklists.Status).toHaveLength(5);
  });
  it("keeps seeds deterministic with date ranges, hierarchy and every member status", () => {
    const rows = generateFixtureCampaigns();
    expect(rows).toEqual(generateFixtureCampaigns());
    expect(rows).toHaveLength(250);
    const dates = rows.map((row) => String(row.fields.Start_Date));
    expect(dates.some((date) => date < "2026-01-15")).toBe(true);
    expect(dates).toContain("2026-01-15");
    expect(dates.some((date) => date > "2026-01-15")).toBe(true);
    expect(rows[2]?.fields.Parent_Campaign).toMatchObject({ id: rows[1]?.id });
    const members = generateFixtureCampaignMembers();
    expect(members).toEqual(generateFixtureCampaignMembers());
    expect(members.map((row) => row.fields.Member_Status)).toEqual(campaignMemberStatuses);
    for (const row of members)
      for (const field of ["Campaign", "Lead", "Contact"]) {
        const ref = row.fields[field];
        if (ref && typeof ref === "object" && "module" in ref && "id" in ref)
          expect(
            fixtureModules[String(ref.module)]
              ?.generateSeed(new Date("2026-01-15T12:00:00Z"))
              .some((target) => target.id === ref.id),
          ).toBe(true);
      }
    expect(supportedModules).not.toContain("Campaign_Members");
  });
});
