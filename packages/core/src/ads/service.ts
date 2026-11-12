import { schema as dbSchema } from "@crm/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { ConflictError, NotFoundError } from "../errors";
import { withOrg } from "../tenancy";
import type { OrgContext, Transaction } from "../tenancy/types";
import { matchAttribution } from "./matching";
import {
  type AdCampaign,
  type AdGroup,
  type AdItem,
  type AdKeyword,
  type AdsSettings,
  type CreateAdGroupInput,
  type CreateAdItemInput,
  type CreateAdKeywordInput,
  type CreateCampaignInput,
  createAdGroupSchema,
  createAdItemSchema,
  createAdKeywordSchema,
  createCampaignSchema,
  type RecordAttribution,
  type RecordAttributionInput,
  recordAttributionInputSchema,
  type UpdateAdGroupInput,
  type UpdateAdItemInput,
  type UpdateAdKeywordInput,
  type UpdateCampaignInput,
  updateAdGroupSchema,
  updateAdItemSchema,
  updateAdKeywordSchema,
  updateCampaignSchema,
} from "./types";

function mapCampaign(row: typeof dbSchema.adCampaigns.$inferSelect): AdCampaign {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    status: row.status as AdCampaign["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAdGroup(row: typeof dbSchema.adGroups.$inferSelect): AdGroup {
  return {
    id: row.id,
    organizationId: row.organizationId,
    campaignId: row.campaignId,
    name: row.name,
    status: row.status as AdGroup["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapKeyword(row: typeof dbSchema.adKeywords.$inferSelect): AdKeyword {
  return {
    id: row.id,
    organizationId: row.organizationId,
    campaignId: row.campaignId,
    adGroupId: row.adGroupId,
    name: row.name,
    matchType: row.matchType as AdKeyword["matchType"],
    status: row.status as AdKeyword["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAdItem(row: typeof dbSchema.adItems.$inferSelect): AdItem {
  return {
    id: row.id,
    organizationId: row.organizationId,
    campaignId: row.campaignId,
    adGroupId: row.adGroupId,
    name: row.name,
    status: row.status as AdItem["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapAttribution(
  row: typeof dbSchema.recordAttributions.$inferSelect,
): RecordAttribution {
  return {
    id: row.id,
    organizationId: row.organizationId,
    recordModule: row.recordModule,
    recordId: row.recordId,
    gclid: row.gclid,
    utmSource: row.utmSource,
    utmMedium: row.utmMedium,
    utmCampaign: row.utmCampaign,
    utmTerm: row.utmTerm,
    utmContent: row.utmContent,
    campaignId: row.campaignId,
    adGroupId: row.adGroupId,
    keywordId: row.keywordId,
    adItemId: row.adItemId,
    source: row.source as RecordAttribution["source"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function assertRow<T>(row: T | undefined, message = "Operation failed"): T {
  if (!row) throw new Error(message);
  return row;
}

// -------------------------------------------------------------
// Settings
// -------------------------------------------------------------

export async function getAdsSettings(tx: Transaction, orgId: string): Promise<AdsSettings> {
  const [row] = await tx
    .select()
    .from(dbSchema.adsSettings)
    .where(eq(dbSchema.adsSettings.organizationId, orgId));

  if (row) {
    return {
      organizationId: row.organizationId,
      status: "disconnected",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // Ensure default row exists
  const now = new Date();
  await tx
    .insert(dbSchema.adsSettings)
    .values({
      organizationId: orgId,
      status: "disconnected",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  return {
    organizationId: orgId,
    status: "disconnected",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// -------------------------------------------------------------
// Campaigns
// -------------------------------------------------------------

export async function listCampaigns(tx: Transaction, orgId: string): Promise<AdCampaign[]> {
  const rows = await tx
    .select()
    .from(dbSchema.adCampaigns)
    .where(eq(dbSchema.adCampaigns.organizationId, orgId))
    .orderBy(asc(dbSchema.adCampaigns.name));

  return rows.map(mapCampaign);
}

export async function getCampaign(tx: Transaction, orgId: string, id: string): Promise<AdCampaign> {
  const [row] = await tx
    .select()
    .from(dbSchema.adCampaigns)
    .where(and(eq(dbSchema.adCampaigns.organizationId, orgId), eq(dbSchema.adCampaigns.id, id)));

  if (!row) {
    throw new NotFoundError("Campaign not found.");
  }
  return mapCampaign(row);
}

export async function createCampaign(
  tx: Transaction,
  orgId: string,
  raw: unknown,
): Promise<AdCampaign> {
  const parsed: CreateCampaignInput = createCampaignSchema.parse(raw);

  // Check unique name per org (case-insensitive)
  const [existing] = await tx
    .select({ id: dbSchema.adCampaigns.id })
    .from(dbSchema.adCampaigns)
    .where(
      and(
        eq(dbSchema.adCampaigns.organizationId, orgId),
        sql`lower(${dbSchema.adCampaigns.name}) = lower(${parsed.name})`,
      ),
    );

  if (existing) {
    throw new ConflictError(`Campaign with name '${parsed.name}' already exists.`);
  }

  const [row] = await tx
    .insert(dbSchema.adCampaigns)
    .values({
      organizationId: orgId,
      name: parsed.name,
      status: parsed.status,
    })
    .returning();

  return mapCampaign(assertRow(row));
}

export async function updateCampaign(
  tx: Transaction,
  orgId: string,
  id: string,
  raw: unknown,
): Promise<AdCampaign> {
  const parsed: UpdateCampaignInput = updateCampaignSchema.parse(raw);
  const current = await getCampaign(tx, orgId, id);

  if (parsed.name && parsed.name.toLowerCase() !== current.name.toLowerCase()) {
    const [existing] = await tx
      .select({ id: dbSchema.adCampaigns.id })
      .from(dbSchema.adCampaigns)
      .where(
        and(
          eq(dbSchema.adCampaigns.organizationId, orgId),
          sql`lower(${dbSchema.adCampaigns.name}) = lower(${parsed.name})`,
        ),
      );
    if (existing && existing.id !== id) {
      throw new ConflictError(`Campaign with name '${parsed.name}' already exists.`);
    }
  }

  const [updated] = await tx
    .update(dbSchema.adCampaigns)
    .set({
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(dbSchema.adCampaigns.organizationId, orgId), eq(dbSchema.adCampaigns.id, id)))
    .returning();

  return mapCampaign(assertRow(updated));
}

export async function deleteCampaign(tx: Transaction, orgId: string, id: string): Promise<void> {
  await getCampaign(tx, orgId, id);
  await tx
    .delete(dbSchema.adCampaigns)
    .where(and(eq(dbSchema.adCampaigns.organizationId, orgId), eq(dbSchema.adCampaigns.id, id)));
}

// -------------------------------------------------------------
// Ad Groups
// -------------------------------------------------------------

export async function listAdGroups(
  tx: Transaction,
  orgId: string,
  campaignId?: string,
): Promise<AdGroup[]> {
  const conditions = [eq(dbSchema.adGroups.organizationId, orgId)];
  if (campaignId) {
    conditions.push(eq(dbSchema.adGroups.campaignId, campaignId));
  }

  const rows = await tx
    .select()
    .from(dbSchema.adGroups)
    .where(and(...conditions))
    .orderBy(asc(dbSchema.adGroups.name));

  return rows.map(mapAdGroup);
}

export async function getAdGroup(tx: Transaction, orgId: string, id: string): Promise<AdGroup> {
  const [row] = await tx
    .select()
    .from(dbSchema.adGroups)
    .where(and(eq(dbSchema.adGroups.organizationId, orgId), eq(dbSchema.adGroups.id, id)));

  if (!row) {
    throw new NotFoundError("Ad Group not found.");
  }
  return mapAdGroup(row);
}

export async function createAdGroup(
  tx: Transaction,
  orgId: string,
  raw: unknown,
): Promise<AdGroup> {
  const parsed: CreateAdGroupInput = createAdGroupSchema.parse(raw);
  await getCampaign(tx, orgId, parsed.campaignId);

  // Check unique name per campaign (case-insensitive)
  const [existing] = await tx
    .select({ id: dbSchema.adGroups.id })
    .from(dbSchema.adGroups)
    .where(
      and(
        eq(dbSchema.adGroups.organizationId, orgId),
        eq(dbSchema.adGroups.campaignId, parsed.campaignId),
        sql`lower(${dbSchema.adGroups.name}) = lower(${parsed.name})`,
      ),
    );

  if (existing) {
    throw new ConflictError(`Ad group with name '${parsed.name}' already exists in this campaign.`);
  }

  const [row] = await tx
    .insert(dbSchema.adGroups)
    .values({
      organizationId: orgId,
      campaignId: parsed.campaignId,
      name: parsed.name,
      status: parsed.status,
    })
    .returning();

  return mapAdGroup(assertRow(row));
}

export async function updateAdGroup(
  tx: Transaction,
  orgId: string,
  id: string,
  raw: unknown,
): Promise<AdGroup> {
  const parsed: UpdateAdGroupInput = updateAdGroupSchema.parse(raw);
  const current = await getAdGroup(tx, orgId, id);

  if (parsed.name && parsed.name.toLowerCase() !== current.name.toLowerCase()) {
    const [existing] = await tx
      .select({ id: dbSchema.adGroups.id })
      .from(dbSchema.adGroups)
      .where(
        and(
          eq(dbSchema.adGroups.organizationId, orgId),
          eq(dbSchema.adGroups.campaignId, current.campaignId),
          sql`lower(${dbSchema.adGroups.name}) = lower(${parsed.name})`,
        ),
      );
    if (existing && existing.id !== id) {
      throw new ConflictError(
        `Ad group with name '${parsed.name}' already exists in this campaign.`,
      );
    }
  }

  const [updated] = await tx
    .update(dbSchema.adGroups)
    .set({
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(dbSchema.adGroups.organizationId, orgId), eq(dbSchema.adGroups.id, id)))
    .returning();

  return mapAdGroup(assertRow(updated));
}

export async function deleteAdGroup(tx: Transaction, orgId: string, id: string): Promise<void> {
  await getAdGroup(tx, orgId, id);
  await tx
    .delete(dbSchema.adGroups)
    .where(and(eq(dbSchema.adGroups.organizationId, orgId), eq(dbSchema.adGroups.id, id)));
}

// -------------------------------------------------------------
// Keywords
// -------------------------------------------------------------

export async function listAdKeywords(
  tx: Transaction,
  orgId: string,
  adGroupId?: string,
): Promise<AdKeyword[]> {
  const conditions = [eq(dbSchema.adKeywords.organizationId, orgId)];
  if (adGroupId) {
    conditions.push(eq(dbSchema.adKeywords.adGroupId, adGroupId));
  }

  const rows = await tx
    .select()
    .from(dbSchema.adKeywords)
    .where(and(...conditions))
    .orderBy(asc(dbSchema.adKeywords.name));

  return rows.map(mapKeyword);
}

export async function getAdKeyword(tx: Transaction, orgId: string, id: string): Promise<AdKeyword> {
  const [row] = await tx
    .select()
    .from(dbSchema.adKeywords)
    .where(and(eq(dbSchema.adKeywords.organizationId, orgId), eq(dbSchema.adKeywords.id, id)));

  if (!row) {
    throw new NotFoundError("Keyword not found.");
  }
  return mapKeyword(row);
}

export async function createAdKeyword(
  tx: Transaction,
  orgId: string,
  raw: unknown,
): Promise<AdKeyword> {
  const parsed: CreateAdKeywordInput = createAdKeywordSchema.parse(raw);
  const group = await getAdGroup(tx, orgId, parsed.adGroupId);

  const [existing] = await tx
    .select({ id: dbSchema.adKeywords.id })
    .from(dbSchema.adKeywords)
    .where(
      and(
        eq(dbSchema.adKeywords.organizationId, orgId),
        eq(dbSchema.adKeywords.adGroupId, parsed.adGroupId),
        sql`lower(${dbSchema.adKeywords.name}) = lower(${parsed.name})`,
      ),
    );

  if (existing) {
    throw new ConflictError(`Keyword '${parsed.name}' already exists in this ad group.`);
  }

  const [row] = await tx
    .insert(dbSchema.adKeywords)
    .values({
      organizationId: orgId,
      campaignId: group.campaignId,
      adGroupId: parsed.adGroupId,
      name: parsed.name,
      matchType: parsed.matchType,
      status: parsed.status,
    })
    .returning();

  return mapKeyword(assertRow(row));
}

export async function updateAdKeyword(
  tx: Transaction,
  orgId: string,
  id: string,
  raw: unknown,
): Promise<AdKeyword> {
  const parsed: UpdateAdKeywordInput = updateAdKeywordSchema.parse(raw);
  const current = await getAdKeyword(tx, orgId, id);

  if (parsed.name && parsed.name.toLowerCase() !== current.name.toLowerCase()) {
    const [existing] = await tx
      .select({ id: dbSchema.adKeywords.id })
      .from(dbSchema.adKeywords)
      .where(
        and(
          eq(dbSchema.adKeywords.organizationId, orgId),
          eq(dbSchema.adKeywords.adGroupId, current.adGroupId),
          sql`lower(${dbSchema.adKeywords.name}) = lower(${parsed.name})`,
        ),
      );
    if (existing && existing.id !== id) {
      throw new ConflictError(`Keyword '${parsed.name}' already exists in this ad group.`);
    }
  }

  const [updated] = await tx
    .update(dbSchema.adKeywords)
    .set({
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.matchType !== undefined ? { matchType: parsed.matchType } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(dbSchema.adKeywords.organizationId, orgId), eq(dbSchema.adKeywords.id, id)))
    .returning();

  return mapKeyword(assertRow(updated));
}

export async function deleteAdKeyword(tx: Transaction, orgId: string, id: string): Promise<void> {
  await getAdKeyword(tx, orgId, id);
  await tx
    .delete(dbSchema.adKeywords)
    .where(and(eq(dbSchema.adKeywords.organizationId, orgId), eq(dbSchema.adKeywords.id, id)));
}

// -------------------------------------------------------------
// Ad Items
// -------------------------------------------------------------

export async function listAdItems(
  tx: Transaction,
  orgId: string,
  adGroupId?: string,
): Promise<AdItem[]> {
  const conditions = [eq(dbSchema.adItems.organizationId, orgId)];
  if (adGroupId) {
    conditions.push(eq(dbSchema.adItems.adGroupId, adGroupId));
  }

  const rows = await tx
    .select()
    .from(dbSchema.adItems)
    .where(and(...conditions))
    .orderBy(asc(dbSchema.adItems.name));

  return rows.map(mapAdItem);
}

export async function getAdItem(tx: Transaction, orgId: string, id: string): Promise<AdItem> {
  const [row] = await tx
    .select()
    .from(dbSchema.adItems)
    .where(and(eq(dbSchema.adItems.organizationId, orgId), eq(dbSchema.adItems.id, id)));

  if (!row) {
    throw new NotFoundError("Ad not found.");
  }
  return mapAdItem(row);
}

export async function createAdItem(tx: Transaction, orgId: string, raw: unknown): Promise<AdItem> {
  const parsed: CreateAdItemInput = createAdItemSchema.parse(raw);
  const group = await getAdGroup(tx, orgId, parsed.adGroupId);

  const [existing] = await tx
    .select({ id: dbSchema.adItems.id })
    .from(dbSchema.adItems)
    .where(
      and(
        eq(dbSchema.adItems.organizationId, orgId),
        eq(dbSchema.adItems.adGroupId, parsed.adGroupId),
        sql`lower(${dbSchema.adItems.name}) = lower(${parsed.name})`,
      ),
    );

  if (existing) {
    throw new ConflictError(`Ad with name '${parsed.name}' already exists in this ad group.`);
  }

  const [row] = await tx
    .insert(dbSchema.adItems)
    .values({
      organizationId: orgId,
      campaignId: group.campaignId,
      adGroupId: parsed.adGroupId,
      name: parsed.name,
      status: parsed.status,
    })
    .returning();

  return mapAdItem(assertRow(row));
}

export async function updateAdItem(
  tx: Transaction,
  orgId: string,
  id: string,
  raw: unknown,
): Promise<AdItem> {
  const parsed: UpdateAdItemInput = updateAdItemSchema.parse(raw);
  const current = await getAdItem(tx, orgId, id);

  if (parsed.name && parsed.name.toLowerCase() !== current.name.toLowerCase()) {
    const [existing] = await tx
      .select({ id: dbSchema.adItems.id })
      .from(dbSchema.adItems)
      .where(
        and(
          eq(dbSchema.adItems.organizationId, orgId),
          eq(dbSchema.adItems.adGroupId, current.adGroupId),
          sql`lower(${dbSchema.adItems.name}) = lower(${parsed.name})`,
        ),
      );
    if (existing && existing.id !== id) {
      throw new ConflictError(`Ad with name '${parsed.name}' already exists in this ad group.`);
    }
  }

  const [updated] = await tx
    .update(dbSchema.adItems)
    .set({
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(dbSchema.adItems.organizationId, orgId), eq(dbSchema.adItems.id, id)))
    .returning();

  return mapAdItem(assertRow(updated));
}

export async function deleteAdItem(tx: Transaction, orgId: string, id: string): Promise<void> {
  await getAdItem(tx, orgId, id);
  await tx
    .delete(dbSchema.adItems)
    .where(and(eq(dbSchema.adItems.organizationId, orgId), eq(dbSchema.adItems.id, id)));
}

// -------------------------------------------------------------
// Attributions
// -------------------------------------------------------------

export async function writeRecordAttribution(
  tx: Transaction,
  orgId: string,
  raw: unknown,
): Promise<RecordAttribution> {
  const parsed: RecordAttributionInput = recordAttributionInputSchema.parse(raw);

  let campaignId = parsed.campaignId ?? null;
  let adGroupId = parsed.adGroupId ?? null;
  let keywordId = parsed.keywordId ?? null;
  const adItemId = parsed.adItemId ?? null;

  // If campaign/keyword not explicitly provided, attempt matching from UTM parameters
  if (!campaignId || !keywordId) {
    const match = await matchAttribution(tx, orgId, {
      utmCampaign: parsed.utmCampaign,
      utmTerm: parsed.utmTerm,
    });
    if (!campaignId && match.campaignId) campaignId = match.campaignId;
    if (!adGroupId && match.adGroupId) adGroupId = match.adGroupId;
    if (!keywordId && match.keywordId) keywordId = match.keywordId;
  }

  const [row] = await tx
    .insert(dbSchema.recordAttributions)
    .values({
      organizationId: orgId,
      recordModule: parsed.recordModule,
      recordId: parsed.recordId,
      gclid: parsed.gclid ?? null,
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
      utmTerm: parsed.utmTerm ?? null,
      utmContent: parsed.utmContent ?? null,
      campaignId,
      adGroupId,
      keywordId,
      adItemId,
      source: parsed.source,
    })
    .returning();

  return mapAttribution(assertRow(row));
}

export async function getRecordAttributions(
  tx: Transaction,
  orgId: string,
  recordModule: string,
  recordId: string,
): Promise<RecordAttribution[]> {
  const rows = await tx
    .select()
    .from(dbSchema.recordAttributions)
    .where(
      and(
        eq(dbSchema.recordAttributions.organizationId, orgId),
        eq(dbSchema.recordAttributions.recordModule, recordModule),
        eq(dbSchema.recordAttributions.recordId, recordId),
      ),
    )
    .orderBy(desc(dbSchema.recordAttributions.createdAt));

  return rows.map(mapAttribution);
}

export async function listRecordAttributions(
  tx: Transaction,
  orgId: string,
  limit = 50,
  offset = 0,
): Promise<RecordAttribution[]> {
  const rows = await tx
    .select()
    .from(dbSchema.recordAttributions)
    .where(eq(dbSchema.recordAttributions.organizationId, orgId))
    .orderBy(desc(dbSchema.recordAttributions.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(mapAttribution);
}

export function createAdsService() {
  return {
    async getSettings(ctx: OrgContext): Promise<AdsSettings> {
      return withOrg(ctx, (tx) => getAdsSettings(tx, ctx.orgId));
    },

    async listCampaigns(ctx: OrgContext): Promise<AdCampaign[]> {
      return withOrg(ctx, (tx) => listCampaigns(tx, ctx.orgId));
    },

    async getCampaign(ctx: OrgContext, id: string): Promise<AdCampaign> {
      return withOrg(ctx, (tx) => getCampaign(tx, ctx.orgId, id));
    },

    async createCampaign(ctx: OrgContext, input: unknown): Promise<AdCampaign> {
      return withOrg(ctx, (tx) => createCampaign(tx, ctx.orgId, input));
    },

    async updateCampaign(ctx: OrgContext, id: string, input: unknown): Promise<AdCampaign> {
      return withOrg(ctx, (tx) => updateCampaign(tx, ctx.orgId, id, input));
    },

    async deleteCampaign(ctx: OrgContext, id: string): Promise<void> {
      return withOrg(ctx, (tx) => deleteCampaign(tx, ctx.orgId, id));
    },

    async listAdGroups(ctx: OrgContext, campaignId?: string): Promise<AdGroup[]> {
      return withOrg(ctx, (tx) => listAdGroups(tx, ctx.orgId, campaignId));
    },

    async getAdGroup(ctx: OrgContext, id: string): Promise<AdGroup> {
      return withOrg(ctx, (tx) => getAdGroup(tx, ctx.orgId, id));
    },

    async createAdGroup(ctx: OrgContext, input: unknown): Promise<AdGroup> {
      return withOrg(ctx, (tx) => createAdGroup(tx, ctx.orgId, input));
    },

    async updateAdGroup(ctx: OrgContext, id: string, input: unknown): Promise<AdGroup> {
      return withOrg(ctx, (tx) => updateAdGroup(tx, ctx.orgId, id, input));
    },

    async deleteAdGroup(ctx: OrgContext, id: string): Promise<void> {
      return withOrg(ctx, (tx) => deleteAdGroup(tx, ctx.orgId, id));
    },

    async listAdKeywords(ctx: OrgContext, adGroupId?: string): Promise<AdKeyword[]> {
      return withOrg(ctx, (tx) => listAdKeywords(tx, ctx.orgId, adGroupId));
    },

    async getAdKeyword(ctx: OrgContext, id: string): Promise<AdKeyword> {
      return withOrg(ctx, (tx) => getAdKeyword(tx, ctx.orgId, id));
    },

    async createAdKeyword(ctx: OrgContext, input: unknown): Promise<AdKeyword> {
      return withOrg(ctx, (tx) => createAdKeyword(tx, ctx.orgId, input));
    },

    async updateAdKeyword(ctx: OrgContext, id: string, input: unknown): Promise<AdKeyword> {
      return withOrg(ctx, (tx) => updateAdKeyword(tx, ctx.orgId, id, input));
    },

    async deleteAdKeyword(ctx: OrgContext, id: string): Promise<void> {
      return withOrg(ctx, (tx) => deleteAdKeyword(tx, ctx.orgId, id));
    },

    async listAdItems(ctx: OrgContext, adGroupId?: string): Promise<AdItem[]> {
      return withOrg(ctx, (tx) => listAdItems(tx, ctx.orgId, adGroupId));
    },

    async getAdItem(ctx: OrgContext, id: string): Promise<AdItem> {
      return withOrg(ctx, (tx) => getAdItem(tx, ctx.orgId, id));
    },

    async createAdItem(ctx: OrgContext, input: unknown): Promise<AdItem> {
      return withOrg(ctx, (tx) => createAdItem(tx, ctx.orgId, input));
    },

    async updateAdItem(ctx: OrgContext, id: string, input: unknown): Promise<AdItem> {
      return withOrg(ctx, (tx) => updateAdItem(tx, ctx.orgId, id, input));
    },

    async deleteAdItem(ctx: OrgContext, id: string): Promise<void> {
      return withOrg(ctx, (tx) => deleteAdItem(tx, ctx.orgId, id));
    },

    async getRecordAttributions(
      ctx: OrgContext,
      module: string,
      recordId: string,
    ): Promise<RecordAttribution[]> {
      return withOrg(ctx, (tx) => getRecordAttributions(tx, ctx.orgId, module, recordId));
    },

    async writeRecordAttribution(ctx: OrgContext, input: unknown): Promise<RecordAttribution> {
      return withOrg(ctx, (tx) => writeRecordAttribution(tx, ctx.orgId, input));
    },

    async getTree(ctx: OrgContext): Promise<{
      settings: AdsSettings;
      campaigns: AdCampaign[];
      groups: AdGroup[];
      keywords: AdKeyword[];
      items: AdItem[];
    }> {
      return withOrg(ctx, async (tx) => {
        const [settings, campaigns, groups, keywords, items] = await Promise.all([
          getAdsSettings(tx, ctx.orgId),
          listCampaigns(tx, ctx.orgId),
          listAdGroups(tx, ctx.orgId),
          listAdKeywords(tx, ctx.orgId),
          listAdItems(tx, ctx.orgId),
        ]);
        return { settings, campaigns, groups, keywords, items };
      });
    },
  };
}

export type AdsService = ReturnType<typeof createAdsService>;
