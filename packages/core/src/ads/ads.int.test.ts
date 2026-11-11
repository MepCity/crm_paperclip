import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getAccessSnapshot, toClientPermissions } from "../access";
import { getDb } from "../database";
import { ConflictError } from "../errors";
import { addTestMember, createTestOrganization } from "../testing";
import { createRenderToken, createWebformService, submitWebform } from "../webforms";
import { createAdsService } from "./service";

describe("Ads integration and webform attribution", () => {
  it("manages campaigns, groups, keywords, and items under tenant isolation with case-insensitive unique names", async () => {
    const { ctx: ctxA } = await createTestOrganization();
    const { ctx: ctxB } = await createTestOrganization();
    const service = createAdsService();

    // 1. Settings default row
    const settings = await service.getSettings(ctxA);
    expect(settings.status).toBe("disconnected");

    // 2. Campaign CRUD
    const camp1 = await service.createCampaign(ctxA, {
      name: "Spring Sale 2026",
      status: "active",
    });
    expect(camp1.name).toBe("Spring Sale 2026");
    expect(camp1.status).toBe("active");

    // Case-insensitive duplicate name in same org rejected
    await expect(service.createCampaign(ctxA, { name: "spring sale 2026" })).rejects.toBeInstanceOf(
      ConflictError,
    );

    // Same campaign name in another org allowed
    const campB = await service.createCampaign(ctxB, {
      name: "Spring Sale 2026",
    });
    expect(campB.id).toBeDefined();

    // Update campaign
    const updatedCamp = await service.updateCampaign(ctxA, camp1.id, {
      name: "Spring Promo 2026",
      status: "paused",
    });
    expect(updatedCamp.name).toBe("Spring Promo 2026");
    expect(updatedCamp.status).toBe("paused");

    // 3. Ad Group CRUD
    const group1 = await service.createAdGroup(ctxA, {
      campaignId: camp1.id,
      name: "Search High Intent",
      status: "active",
    });
    expect(group1.name).toBe("Search High Intent");

    // Duplicate group name in same campaign rejected
    await expect(
      service.createAdGroup(ctxA, {
        campaignId: camp1.id,
        name: "search high intent",
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    // 4. Keyword CRUD
    const kw1 = await service.createAdKeyword(ctxA, {
      campaignId: camp1.id,
      adGroupId: group1.id,
      name: "best crm for sales",
      matchType: "phrase",
      status: "active",
    });
    expect(kw1.name).toBe("best crm for sales");
    expect(kw1.matchType).toBe("phrase");

    // Duplicate keyword in same group rejected
    await expect(
      service.createAdKeyword(ctxA, {
        campaignId: camp1.id,
        adGroupId: group1.id,
        name: "Best CRM For Sales",
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    // 5. Ad Item CRUD
    const item1 = await service.createAdItem(ctxA, {
      campaignId: camp1.id,
      adGroupId: group1.id,
      name: "Grow your business with our CRM",
      status: "active",
    });
    expect(item1.name).toBe("Grow your business with our CRM");

    // Duplicate ad item in same group rejected
    await expect(
      service.createAdItem(ctxA, {
        campaignId: camp1.id,
        adGroupId: group1.id,
        name: "grow your business with our crm",
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    // 6. Tree query
    const tree = await service.getTree(ctxA);
    expect(tree.campaigns).toHaveLength(1);
    expect(tree.groups).toHaveLength(1);
    expect(tree.keywords).toHaveLength(1);
    expect(tree.items).toHaveLength(1);

    // 7. Cascading delete
    await service.deleteCampaign(ctxA, camp1.id);
    const emptyTree = await service.getTree(ctxA);
    expect(emptyTree.campaigns).toHaveLength(0);
    expect(emptyTree.groups).toHaveLength(0);
    expect(emptyTree.keywords).toHaveLength(0);
    expect(emptyTree.items).toHaveLength(0);
  });

  it("handles webform attribution: writes attribution when enabled, ignores when disabled, and rejects over-length parameters", async () => {
    const { ctx } = await createTestOrganization();
    const adsService = createAdsService();
    const webformsService = createWebformService();
    const db = getDb();

    // 1. Create a campaign and keyword for attribution matching
    const campaign = await adsService.createCampaign(ctx, {
      name: "Google Q4 Promo",
      status: "active",
    });
    const group = await adsService.createAdGroup(ctx, {
      campaignId: campaign.id,
      name: "Search Promo Group",
      status: "active",
    });
    const keyword = await adsService.createAdKeyword(ctx, {
      campaignId: campaign.id,
      adGroupId: group.id,
      name: "enterprise crm solution",
      matchType: "broad",
      status: "active",
    });

    // 2. Create webform with captureAttribution: true
    const formEnabled = await webformsService.createForm(ctx, {
      name: "Contact Us - Ads Enabled",
      module: "Leads",
    });

    const fields = [
      {
        fieldApiName: "Last_Name",
        label: "Last Name",
        required: true,
        hidden: false,
      },
      {
        fieldApiName: "Company",
        label: "Company",
        required: true,
        hidden: false,
      },
      {
        fieldApiName: "Email",
        label: "Email",
        required: false,
        hidden: false,
      },
    ];

    await webformsService.updateDraft(ctx, formEnabled.id, {
      fields,
      settings: {
        buttonLabel: "Submit",
        ownerKind: "user",
        ownerRef: ctx.userId,
        notifyOwner: false,
        acknowledgement: { kind: "message", text: "Thank you!" },
        challenge: false,
        restrictLocations: false,
        captureAttribution: true,
        approval: "none",
        doubleOptIn: false,
      },
    });

    const publishedEnabled = await webformsService.publish(ctx, formEnabled.id);
    const { publicKey: keyEnabled } = await webformsService.regeneratePublicKey(
      ctx,
      formEnabled.id,
    );
    const versionIdEnabled = publishedEnabled.publishedVersion?.id ?? "";

    const makeTokenEnabled = () =>
      createRenderToken({
        orgId: ctx.orgId,
        formId: formEnabled.id,
        versionId: versionIdEnabled,
        issuedAt: Date.now() - 5000,
      });

    // A. Submit with over-length UTM parameter (> 255 chars) -> rejected with outcome "invalid"
    const overLengthResult = await submitWebform({
      publicKey: keyEnabled,
      data: {
        _token: makeTokenEnabled(),
        Last_Name: "Johnson",
        Company: "Acme Inc",
        utm_campaign: "c".repeat(256),
      },
      origin: "https://example.com",
      ip: "127.0.0.1",
    });
    expect(overLengthResult.outcome).toBe("invalid");
    expect(overLengthResult.errors?.utm_campaign).toBeDefined();

    // B. Submit with valid attribution -> Lead created and attribution row linked to campaign & keyword
    const validResult = await submitWebform({
      publicKey: keyEnabled,
      data: {
        _token: makeTokenEnabled(),
        Last_Name: "Johnson",
        Company: "Acme Inc",
        Email: "johnson@example.com",
        gclid: "test-click-id-12345",
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "google q4 promo", // case-insensitive match to campaign
        utm_term: "enterprise crm solution", // case-insensitive match to keyword
        utm_content: "header-link",
      },
      origin: "https://example.com",
      ip: "127.0.0.1",
    });
    expect(validResult.outcome).toBe("accepted");

    // Verify record_attributions in database
    const attributions = await db
      .select()
      .from(schema.recordAttributions)
      .where(
        and(
          eq(schema.recordAttributions.organizationId, ctx.orgId),
          eq(schema.recordAttributions.recordModule, "Leads"),
        ),
      );
    expect(attributions).toHaveLength(1);
    const attr = attributions[0];
    if (!attr) throw new Error("Expected attribution row");
    expect(attr.gclid).toBe("test-click-id-12345");
    expect(attr.utmSource).toBe("google");
    expect(attr.utmMedium).toBe("cpc");
    expect(attr.utmCampaign).toBe("google q4 promo");
    expect(attr.utmTerm).toBe("enterprise crm solution");
    expect(attr.utmContent).toBe("header-link");
    expect(attr.campaignId).toBe(campaign.id);
    expect(attr.adGroupId).toBe(group.id);
    expect(attr.keywordId).toBe(keyword.id);
    expect(attr.source).toBe("webform");

    // 3. Create webform with captureAttribution: false
    const formDisabled = await webformsService.createForm(ctx, {
      name: "Contact Us - Ads Disabled",
      module: "Leads",
    });

    await webformsService.updateDraft(ctx, formDisabled.id, {
      fields,
      settings: {
        buttonLabel: "Submit",
        ownerKind: "user",
        ownerRef: ctx.userId,
        notifyOwner: false,
        acknowledgement: { kind: "message", text: "Thank you!" },
        challenge: false,
        restrictLocations: false,
        captureAttribution: false,
        approval: "none",
        doubleOptIn: false,
      },
    });

    const publishedDisabled = await webformsService.publish(ctx, formDisabled.id);
    const { publicKey: keyDisabled } = await webformsService.regeneratePublicKey(
      ctx,
      formDisabled.id,
    );
    const versionIdDisabled = publishedDisabled.publishedVersion?.id ?? "";

    const makeTokenDisabled = () =>
      createRenderToken({
        orgId: ctx.orgId,
        formId: formDisabled.id,
        versionId: versionIdDisabled,
        issuedAt: Date.now() - 5000,
      });

    // C. Submit with attribution params when disabled -> Lead created, attribution ignored, NO record_attributions added
    const disabledResult = await submitWebform({
      publicKey: keyDisabled,
      data: {
        _token: makeTokenDisabled(),
        Last_Name: "Williams",
        Company: "Beta Corp",
        gclid: "another-gclid",
        utm_campaign: "google q4 promo",
      },
      origin: "https://example.com",
      ip: "127.0.0.1",
    });
    expect(disabledResult.outcome).toBe("accepted");

    // Verify still only 1 attribution row in database
    const attributionsAfter = await db
      .select()
      .from(schema.recordAttributions)
      .where(eq(schema.recordAttributions.organizationId, ctx.orgId));
    expect(attributionsAfter).toHaveLength(1);
  });

  it("admin.manageIntegrations permission: administrator has true, standard member has false", async () => {
    const { ctx } = await createTestOrganization();
    const standardMember = await addTestMember(ctx, "member");

    const adminSnapshot = await getAccessSnapshot(ctx);
    const standardSnapshot = await getAccessSnapshot(standardMember.ctx);

    const adminClient = toClientPermissions(adminSnapshot, ["Leads"]);
    const standardClient = toClientPermissions(standardSnapshot, ["Leads"]);

    expect(adminClient.admin.manageIntegrations).toBe(true);
    expect(standardClient.admin.manageIntegrations).toBe(false);
  });
});
