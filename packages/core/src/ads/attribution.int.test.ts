import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "../database";
import { ValidationError } from "../errors";
import { createFixtureRecordService } from "../records/fixture";
import { withOrg } from "../tenancy";
import { createTestOrganization } from "../testing";
import { createAttributionService } from "./attribution";
import { createAdsService } from "./service";
import { aggregateAdsSummary } from "./summary";

async function seedTree(ctx: Awaited<ReturnType<typeof createTestOrganization>>["ctx"]) {
  const ads = createAdsService();
  const campaign = await ads.createCampaign(ctx, { name: "Autumn Search" });
  const group = await ads.createAdGroup(ctx, { campaignId: campaign.id, name: "Brand" });
  const keyword = await ads.createAdKeyword(ctx, {
    campaignId: campaign.id,
    adGroupId: group.id,
    name: "crm software",
  });
  const item = await ads.createAdItem(ctx, {
    campaignId: campaign.id,
    adGroupId: group.id,
    name: "Text ad A",
  });
  const otherCampaign = await ads.createCampaign(ctx, { name: "Other" });
  const otherGroup = await ads.createAdGroup(ctx, {
    campaignId: otherCampaign.id,
    name: "Other group",
  });
  return { ads, campaign, group, keyword, item, otherCampaign, otherGroup };
}

describe("record ad attribution (ADR 0019 §7)", () => {
  it("copies the lead's current attribution to the converted contact and deal", async () => {
    const { ctx } = await createTestOrganization();
    const { ads, campaign, group, keyword, item } = await seedTree(ctx);
    const attribution = createAttributionService();
    const records = createFixtureRecordService(ctx);

    const lead = await records.create("Leads", { Last_Name: "Attributed", Company: "Example" });
    await ads.writeRecordAttribution(ctx, {
      recordModule: "Leads",
      recordId: lead.id,
      gclid: "test-gclid-1",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "Autumn Search",
      utmTerm: "crm software",
      utmContent: "ad-a",
      adItemId: item.id,
      source: "webform",
    });

    const result = await records.convertLead(lead.id, {
      account: { create: { Account_Name: "Example" } },
      contact: { create: { Last_Name: "Attributed" } },
      deal: {
        create: {
          Deal_Name: "Attributed deal",
          Stage: "Qualification",
          Closing_Date: "2026-12-31",
        },
      },
    });
    const copied = await attribution.copyOnConversion(ctx, lead.id, result);
    expect(copied.map((row) => row.recordModule)).toEqual(["Contacts", "Deals"]);

    for (const [module, id] of [
      ["Contacts", result.contactId],
      ["Deals", result.dealId],
    ] as const) {
      const current = await attribution.latest(ctx, module, id ?? "");
      expect(current).toMatchObject({
        source: "conversion",
        gclid: "test-gclid-1",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "Autumn Search",
        utmTerm: "crm software",
        utmContent: "ad-a",
        campaignId: campaign.id,
        adGroupId: group.id,
        keywordId: keyword.id,
        adItemId: item.id,
      });
    }
    // The lead keeps its own webform row.
    expect((await attribution.latest(ctx, "Leads", lead.id))?.source).toBe("webform");
  });

  it("copies nothing for a lead without attribution and skips targets that were not created", async () => {
    const { ctx } = await createTestOrganization();
    const attribution = createAttributionService();
    expect(
      await attribution.copyOnConversion(ctx, "lead-without", { contactId: "c1", dealId: "d1" }),
    ).toEqual([]);

    await createAdsService().writeRecordAttribution(ctx, {
      recordModule: "Leads",
      recordId: "lead-1",
      utmSource: "google",
      source: "webform",
    });
    const copied = await attribution.copyOnConversion(ctx, "lead-1", {
      contactId: "c1",
      dealId: null,
    });
    expect(copied).toHaveLength(1);
    expect(copied[0]).toMatchObject({ recordModule: "Contacts", recordId: "c1" });
    expect(await attribution.latest(ctx, "Deals", "d1")).toBeNull();
  });

  it("rolls the whole copy back when one insert fails", async () => {
    const { ctx } = await createTestOrganization();
    await createAdsService().writeRecordAttribution(ctx, {
      recordModule: "Leads",
      recordId: "lead-2",
      utmSource: "google",
      source: "webform",
    });
    const { copyAttributionOnConversion } = await import("./attribution");
    await expect(
      withOrg(ctx, async (tx) => {
        await copyAttributionOnConversion(tx, ctx.orgId, "lead-2", { contactId: "c2" });
        throw new Error("abort");
      }),
    ).rejects.toThrow("abort");
    expect(await createAttributionService().latest(ctx, "Contacts", "c2")).toBeNull();
  });

  it("writes a manual attribution as the current row and validates the hierarchy", async () => {
    const { ctx } = await createTestOrganization();
    const { campaign, group, keyword, otherCampaign, otherGroup } = await seedTree(ctx);
    const attribution = createAttributionService();

    const saved = await attribution.setManual(ctx, "Deals", "deal-9", {
      gclid: "  manual-click  ",
      utmSource: "",
      campaignId: campaign.id,
      adGroupId: group.id,
      keywordId: keyword.id,
      adItemId: "",
    });
    expect(saved).toMatchObject({
      source: "manual",
      gclid: "manual-click",
      utmSource: null,
      keywordId: keyword.id,
      adItemId: null,
    });
    expect((await attribution.latest(ctx, "Deals", "deal-9"))?.id).toBe(saved.id);

    // A group of another campaign, a keyword without a group, too long values.
    await expect(
      attribution.setManual(ctx, "Deals", "deal-9", {
        campaignId: campaign.id,
        adGroupId: otherGroup.id,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      attribution.setManual(ctx, "Deals", "deal-9", {
        campaignId: otherCampaign.id,
        keywordId: keyword.id,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      attribution.setManual(ctx, "Deals", "deal-9", { gclid: "x".repeat(256) }),
    ).rejects.toThrow();

    // Another organization cannot reference this organization's campaign.
    const { ctx: other } = await createTestOrganization();
    await expect(
      attribution.setManual(other, "Leads", "lead-x", { campaignId: campaign.id }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await attribution.latest(other, "Deals", "deal-9")).toBeNull();
  });

  it("lists the current row per record inside the date range for the summary", async () => {
    const { ctx } = await createTestOrganization();
    const { ads, campaign, group, keyword } = await seedTree(ctx);
    const attribution = createAttributionService();
    const db = getDb();

    await ads.writeRecordAttribution(ctx, {
      recordModule: "Leads",
      recordId: "l1",
      utmCampaign: "Autumn Search",
      utmTerm: "crm software",
      source: "webform",
    });
    await ads.writeRecordAttribution(ctx, {
      recordModule: "Deals",
      recordId: "d1",
      utmCampaign: "Autumn Search",
      utmTerm: "crm software",
      source: "conversion",
    });
    // An old row for a record, superseded by a newer manual row.
    await ads.writeRecordAttribution(ctx, {
      recordModule: "Contacts",
      recordId: "c1",
      utmCampaign: "nothing",
      source: "webform",
    });
    await attribution.setManual(ctx, "Contacts", "c1", { campaignId: campaign.id });
    // A module the report does not count.
    await ads.writeRecordAttribution(ctx, {
      recordModule: "Accounts",
      recordId: "a1",
      utmCampaign: "Autumn Search",
      source: "webform",
    });
    // Move the lead's row into the past.
    await withOrg(ctx, (tx) =>
      tx
        .update(schema.recordAttributions)
        .set({ createdAt: new Date("2026-01-15T10:00:00Z") })
        .where(
          and(
            eq(schema.recordAttributions.organizationId, ctx.orgId),
            eq(schema.recordAttributions.recordId, "l1"),
          ),
        ),
    );
    expect(db).toBeDefined();

    const all = await attribution.listCurrent(ctx);
    expect(all.map((row) => `${row.recordModule}:${row.recordId}`).sort()).toEqual([
      "Contacts:c1",
      "Deals:d1",
      "Leads:l1",
    ]);
    expect(all.find((row) => row.recordId === "c1")?.source).toBe("manual");

    const recent = await attribution.listCurrent(ctx, { from: new Date("2026-02-01T00:00:00Z") });
    expect(recent.map((row) => row.recordId).sort()).toEqual(["c1", "d1"]);
    const january = await attribution.listCurrent(ctx, {
      from: new Date("2026-01-01T00:00:00Z"),
      to: new Date("2026-02-01T00:00:00Z"),
    });
    expect(january.map((row) => row.recordId)).toEqual(["l1"]);

    const summary = aggregateAdsSummary(
      all,
      {
        campaigns: new Map([[campaign.id, campaign.name]]),
        groups: new Map([[group.id, group.name]]),
        keywords: new Map([[keyword.id, keyword.name]]),
      },
      new Map([["d1", 1200]]),
    );
    expect(summary.totals).toEqual({ leads: 1, contacts: 1, deals: 1, dealAmount: 1200 });
    expect(summary.rows).toEqual([
      expect.objectContaining({
        keywordName: "crm software",
        leads: 1,
        deals: 1,
        dealAmount: 1200,
      }),
      expect.objectContaining({ campaignName: "Autumn Search", adGroupName: null, contacts: 1 }),
    ]);
  });
});
