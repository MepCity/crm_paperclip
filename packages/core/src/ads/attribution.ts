import { schema as dbSchema } from "@crm/db";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { ValidationError } from "../errors";
import { withOrg } from "../tenancy";
import type { OrgContext, Transaction } from "../tenancy/types";
import { mapAttribution } from "./service";
import type { RecordAttribution } from "./types";

/** Record surfaces that show the "Ad attribution" section (ADR 0019 §7, spec §5 A2). */
export const ATTRIBUTION_RECORD_MODULES = ["Leads", "Contacts", "Deals"] as const;
export type AttributionRecordModule = (typeof ATTRIBUTION_RECORD_MODULES)[number];

export function isAttributionRecordModule(module: string): module is AttributionRecordModule {
  return (ATTRIBUTION_RECORD_MODULES as readonly string[]).includes(module);
}

const optionalText = z
  .string()
  .trim()
  .max(255, "Use at most 255 characters.")
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));
const optionalId = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().uuid("Choose a valid value.").nullable());

/** Manual attribution edit (`source = manual`). Empty strings clear a value. */
export const manualAttributionSchema = z.object({
  gclid: optionalText,
  utmSource: optionalText,
  utmMedium: optionalText,
  utmCampaign: optionalText,
  utmTerm: optionalText,
  utmContent: optionalText,
  campaignId: optionalId,
  adGroupId: optionalId,
  keywordId: optionalId,
  adItemId: optionalId,
});
export type ManualAttributionInput = z.infer<typeof manualAttributionSchema>;

/** The record's current attribution: the most recently written row. */
export async function latestRecordAttribution(
  tx: Transaction,
  orgId: string,
  recordModule: string,
  recordId: string,
): Promise<RecordAttribution | null> {
  const [row] = await tx
    .select()
    .from(dbSchema.recordAttributions)
    .where(
      and(
        eq(dbSchema.recordAttributions.organizationId, orgId),
        eq(dbSchema.recordAttributions.recordModule, recordModule),
        eq(dbSchema.recordAttributions.recordId, recordId),
      ),
    )
    .orderBy(desc(dbSchema.recordAttributions.createdAt), desc(dbSchema.recordAttributions.id))
    .limit(1);
  return row ? mapAttribution(row) : null;
}

/**
 * Lead conversion: copies the lead's current attribution to the created/reused
 * Contact and Deal with `source = conversion`. Values and campaign links are
 * copied as they are (no re-matching). Returns the written rows.
 */
export async function copyAttributionOnConversion(
  tx: Transaction,
  orgId: string,
  leadId: string,
  targets: { contactId?: string | null; dealId?: string | null },
): Promise<RecordAttribution[]> {
  const source = await latestRecordAttribution(tx, orgId, "Leads", leadId);
  if (!source) return [];
  const written: RecordAttribution[] = [];
  for (const [module, recordId] of [
    ["Contacts", targets.contactId],
    ["Deals", targets.dealId],
  ] as const) {
    if (!recordId) continue;
    const [row] = await tx
      .insert(dbSchema.recordAttributions)
      .values({
        organizationId: orgId,
        recordModule: module,
        recordId,
        gclid: source.gclid,
        utmSource: source.utmSource,
        utmMedium: source.utmMedium,
        utmCampaign: source.utmCampaign,
        utmTerm: source.utmTerm,
        utmContent: source.utmContent,
        campaignId: source.campaignId,
        adGroupId: source.adGroupId,
        keywordId: source.keywordId,
        adItemId: source.adItemId,
        source: "conversion",
      })
      .returning();
    if (row) written.push(mapAttribution(row));
  }
  return written;
}

async function assertHierarchy(tx: Transaction, orgId: string, input: ManualAttributionInput) {
  const errors: Record<string, string[]> = {};
  if (input.adGroupId && !input.campaignId) errors.campaignId = ["Choose a campaign first."];
  if ((input.keywordId || input.adItemId) && !input.adGroupId)
    errors.adGroupId = ["Choose an ad group first."];
  if (Object.keys(errors).length) throw new ValidationError(errors);

  if (input.campaignId) {
    const [campaign] = await tx
      .select({ id: dbSchema.adCampaigns.id })
      .from(dbSchema.adCampaigns)
      .where(
        and(
          eq(dbSchema.adCampaigns.organizationId, orgId),
          eq(dbSchema.adCampaigns.id, input.campaignId),
        ),
      );
    if (!campaign) errors.campaignId = ["Choose a valid campaign."];
  }
  if (input.adGroupId) {
    const [group] = await tx
      .select({ campaignId: dbSchema.adGroups.campaignId })
      .from(dbSchema.adGroups)
      .where(
        and(eq(dbSchema.adGroups.organizationId, orgId), eq(dbSchema.adGroups.id, input.adGroupId)),
      );
    if (!group || group.campaignId !== input.campaignId)
      errors.adGroupId = ["Choose an ad group of the selected campaign."];
  }
  if (input.keywordId) {
    const [keyword] = await tx
      .select({ adGroupId: dbSchema.adKeywords.adGroupId })
      .from(dbSchema.adKeywords)
      .where(
        and(
          eq(dbSchema.adKeywords.organizationId, orgId),
          eq(dbSchema.adKeywords.id, input.keywordId),
        ),
      );
    if (!keyword || keyword.adGroupId !== input.adGroupId)
      errors.keywordId = ["Choose a keyword of the selected ad group."];
  }
  if (input.adItemId) {
    const [item] = await tx
      .select({ adGroupId: dbSchema.adItems.adGroupId })
      .from(dbSchema.adItems)
      .where(
        and(eq(dbSchema.adItems.organizationId, orgId), eq(dbSchema.adItems.id, input.adItemId)),
      );
    if (!item || item.adGroupId !== input.adGroupId)
      errors.adItemId = ["Choose an ad of the selected ad group."];
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
}

/** Writes a manual attribution as the record's new current row (`source = manual`). */
export async function setManualAttribution(
  tx: Transaction,
  orgId: string,
  recordModule: AttributionRecordModule,
  recordId: string,
  raw: unknown,
): Promise<RecordAttribution> {
  const input = manualAttributionSchema.parse(raw);
  await assertHierarchy(tx, orgId, input);
  const [row] = await tx
    .insert(dbSchema.recordAttributions)
    .values({ organizationId: orgId, recordModule, recordId, ...input, source: "manual" })
    .returning();
  if (!row) throw new Error("Failed to write attribution");
  return mapAttribution(row);
}

/**
 * The current attribution of every Lead/Contact/Deal whose current row was
 * written inside `[from, to)` (both optional, ISO timestamps).
 */
export async function listCurrentAttributions(
  tx: Transaction,
  orgId: string,
  range: { from?: Date | null; to?: Date | null } = {},
): Promise<RecordAttribution[]> {
  const t = dbSchema.recordAttributions;
  const latest = tx
    .selectDistinctOn([t.recordModule, t.recordId])
    .from(t)
    .where(
      and(eq(t.organizationId, orgId), inArray(t.recordModule, [...ATTRIBUTION_RECORD_MODULES])),
    )
    .orderBy(t.recordModule, t.recordId, desc(t.createdAt), desc(t.id))
    .as("latest");
  const rows = await tx
    .select()
    .from(latest)
    .where(
      and(
        range.from ? gte(latest.createdAt, range.from) : sql`true`,
        range.to ? lt(latest.createdAt, range.to) : sql`true`,
      ),
    );
  return rows.map(mapAttribution);
}

export function createAttributionService() {
  return {
    latest(ctx: OrgContext, module: string, recordId: string) {
      return withOrg(ctx, (tx) => latestRecordAttribution(tx, ctx.orgId, module, recordId));
    },
    setManual(ctx: OrgContext, module: AttributionRecordModule, recordId: string, input: unknown) {
      return withOrg(ctx, (tx) => setManualAttribution(tx, ctx.orgId, module, recordId, input));
    },
    copyOnConversion(
      ctx: OrgContext,
      leadId: string,
      targets: { contactId?: string | null; dealId?: string | null },
    ) {
      return withOrg(ctx, (tx) => copyAttributionOnConversion(tx, ctx.orgId, leadId, targets));
    },
    listCurrent(ctx: OrgContext, range: { from?: Date | null; to?: Date | null } = {}) {
      return withOrg(ctx, (tx) => listCurrentAttributions(tx, ctx.orgId, range));
    },
  };
}
export type AttributionService = ReturnType<typeof createAttributionService>;
