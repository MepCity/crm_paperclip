import { schema as dbSchema } from "@crm/db";
import { and, eq, sql } from "drizzle-orm";
import type { Transaction } from "../tenancy/types";

export interface AttributionMatchResult {
  campaignId: string | null;
  adGroupId: string | null;
  keywordId: string | null;
}

export async function matchAttribution(
  tx: Transaction,
  orgId: string,
  input: {
    utmCampaign?: string | null;
    utmTerm?: string | null;
  },
): Promise<AttributionMatchResult> {
  let campaignId: string | null = null;
  let adGroupId: string | null = null;
  let keywordId: string | null = null;

  const cleanCampaign = input.utmCampaign?.trim();
  const cleanTerm = input.utmTerm?.trim();

  if (cleanCampaign) {
    const [foundCampaign] = await tx
      .select({ id: dbSchema.adCampaigns.id })
      .from(dbSchema.adCampaigns)
      .where(
        and(
          eq(dbSchema.adCampaigns.organizationId, orgId),
          sql`lower(${dbSchema.adCampaigns.name}) = lower(${cleanCampaign})`,
        ),
      )
      .limit(1);

    if (foundCampaign) {
      campaignId = foundCampaign.id;
    }
  }

  if (cleanTerm) {
    // If campaign is already found, prefer keyword in that campaign
    if (campaignId) {
      const [matchedKeyword] = await tx
        .select({
          id: dbSchema.adKeywords.id,
          campaignId: dbSchema.adKeywords.campaignId,
          adGroupId: dbSchema.adKeywords.adGroupId,
        })
        .from(dbSchema.adKeywords)
        .where(
          and(
            eq(dbSchema.adKeywords.organizationId, orgId),
            eq(dbSchema.adKeywords.campaignId, campaignId),
            sql`lower(${dbSchema.adKeywords.name}) = lower(${cleanTerm})`,
          ),
        )
        .limit(1);

      if (matchedKeyword) {
        keywordId = matchedKeyword.id;
        adGroupId = matchedKeyword.adGroupId;
      }
    }

    // If still not matched, search across the organization
    if (!keywordId) {
      const [matchedKeyword] = await tx
        .select({
          id: dbSchema.adKeywords.id,
          campaignId: dbSchema.adKeywords.campaignId,
          adGroupId: dbSchema.adKeywords.adGroupId,
        })
        .from(dbSchema.adKeywords)
        .where(
          and(
            eq(dbSchema.adKeywords.organizationId, orgId),
            sql`lower(${dbSchema.adKeywords.name}) = lower(${cleanTerm})`,
          ),
        )
        .limit(1);

      if (matchedKeyword) {
        keywordId = matchedKeyword.id;
        adGroupId = matchedKeyword.adGroupId;
        if (!campaignId) {
          campaignId = matchedKeyword.campaignId;
        }
      }
    }
  }

  return { campaignId, adGroupId, keywordId };
}
