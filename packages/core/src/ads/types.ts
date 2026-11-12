import { z } from "zod";

export const campaignStatusSchema = z.enum(["active", "paused"]);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const adGroupStatusSchema = z.enum(["active", "paused"]);
export type AdGroupStatus = z.infer<typeof adGroupStatusSchema>;

export const adKeywordStatusSchema = z.enum(["active", "paused"]);
export type AdKeywordStatus = z.infer<typeof adKeywordStatusSchema>;

export const adItemStatusSchema = z.enum(["active", "paused"]);
export type AdItemStatus = z.infer<typeof adItemStatusSchema>;

export const keywordMatchTypeSchema = z.enum(["exact", "phrase", "broad"]);
export type KeywordMatchType = z.infer<typeof keywordMatchTypeSchema>;

export const attributionSourceSchema = z.enum(["webform", "manual", "conversion"]);
export type AttributionSource = z.infer<typeof attributionSourceSchema>;

export const attributionModuleSchema = z.enum(["Leads", "Contacts", "Deals", "Accounts", "Cases"]);
export type AttributionModule = z.infer<typeof attributionModuleSchema>;

export const adsSettingsSchema = z.object({
  status: z.literal("disconnected"),
});
export type AdsSettingsInput = z.infer<typeof adsSettingsSchema>;

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  status: campaignStatusSchema.default("active"),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  status: campaignStatusSchema.optional(),
});
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const createAdGroupSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  status: adGroupStatusSchema.default("active"),
});
export type CreateAdGroupInput = z.infer<typeof createAdGroupSchema>;

export const updateAdGroupSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  status: adGroupStatusSchema.optional(),
});
export type UpdateAdGroupInput = z.infer<typeof updateAdGroupSchema>;

export const createAdKeywordSchema = z.object({
  campaignId: z.string().uuid(),
  adGroupId: z.string().uuid(),
  name: z.string().trim().min(1, "Keyword text is required").max(255, "Keyword text is too long"),
  matchType: keywordMatchTypeSchema.default("broad"),
  status: adKeywordStatusSchema.default("active"),
});
export type CreateAdKeywordInput = z.infer<typeof createAdKeywordSchema>;

export const updateAdKeywordSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  matchType: keywordMatchTypeSchema.optional(),
  status: adKeywordStatusSchema.optional(),
});
export type UpdateAdKeywordInput = z.infer<typeof updateAdKeywordSchema>;

export const createAdItemSchema = z.object({
  campaignId: z.string().uuid(),
  adGroupId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(255, "Name is too long"),
  status: adItemStatusSchema.default("active"),
});
export type CreateAdItemInput = z.infer<typeof createAdItemSchema>;

export const updateAdItemSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  status: adItemStatusSchema.optional(),
});
export type UpdateAdItemInput = z.infer<typeof updateAdItemSchema>;

export const recordAttributionInputSchema = z.object({
  recordModule: attributionModuleSchema,
  recordId: z.string().min(1),
  gclid: z.string().max(255).nullable().optional(),
  utmSource: z.string().max(255).nullable().optional(),
  utmMedium: z.string().max(255).nullable().optional(),
  utmCampaign: z.string().max(255).nullable().optional(),
  utmTerm: z.string().max(255).nullable().optional(),
  utmContent: z.string().max(255).nullable().optional(),
  campaignId: z.string().uuid().nullable().optional(),
  adGroupId: z.string().uuid().nullable().optional(),
  keywordId: z.string().uuid().nullable().optional(),
  adItemId: z.string().uuid().nullable().optional(),
  source: attributionSourceSchema.default("webform"),
});
export type RecordAttributionInput = z.infer<typeof recordAttributionInputSchema>;

export interface AdsSettings {
  organizationId: string;
  status: "disconnected";
  createdAt: string;
  updatedAt: string;
}

export interface AdCampaign {
  id: string;
  organizationId: string;
  name: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdGroup {
  id: string;
  organizationId: string;
  campaignId: string;
  name: string;
  status: AdGroupStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdKeyword {
  id: string;
  organizationId: string;
  campaignId: string;
  adGroupId: string;
  name: string;
  matchType: KeywordMatchType;
  status: AdKeywordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdItem {
  id: string;
  organizationId: string;
  campaignId: string;
  adGroupId: string;
  name: string;
  status: AdItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecordAttribution {
  id: string;
  organizationId: string;
  recordModule: string;
  recordId: string;
  gclid: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  campaignId: string | null;
  adGroupId: string | null;
  keywordId: string | null;
  adItemId: string | null;
  source: AttributionSource;
  createdAt: string;
  updatedAt: string;
}
