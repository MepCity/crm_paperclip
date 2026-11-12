import { can, getAccessSnapshot, levelAllows, recordLevel } from "@crm/core/access";
import {
  ATTRIBUTION_RECORD_MODULES,
  type AttributionRecordModule,
  manualAttributionSchema,
} from "@crm/core/ads";
import { ForbiddenError, NotFoundError } from "@crm/core/errors";
import type { OrgContext } from "@crm/core/records";
import { getAds, getAttribution } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getRecordService } from "@/lib/records";

export const dynamic = "force-dynamic";

function attributionModule(raw: string): AttributionRecordModule {
  const found = ATTRIBUTION_RECORD_MODULES.find((m) => m.toLowerCase() === raw.toLowerCase());
  if (!found) throw new NotFoundError("Module does not support ad attribution");
  return found;
}

function ownerIdOf(owner: unknown): string | null {
  if (typeof owner === "string") return owner;
  if (owner && typeof owner === "object" && "id" in owner && typeof owner.id === "string")
    return owner.id;
  return null;
}

/** Reads the record through the record service (record-level read) and resolves edit right. */
async function recordAccess(ctx: OrgContext, module: AttributionRecordModule, recordId: string) {
  const record = await getRecordService(ctx).get(module, recordId);
  const snapshot = await getAccessSnapshot(ctx);
  const canEdit =
    can(snapshot, module, "edit") &&
    levelAllows(recordLevel(snapshot, module, ownerIdOf(record.fields.Owner)), "edit");
  return { canEdit };
}

async function payload(ctx: OrgContext, module: AttributionRecordModule, recordId: string) {
  const { canEdit } = await recordAccess(ctx, module, recordId);
  const [attribution, tree] = await Promise.all([
    getAttribution().latest(ctx, module, recordId),
    getAds().getTree(ctx),
  ]);
  const named = (rows: readonly { id: string; name: string }[], id: string | null | undefined) => {
    const row = id ? rows.find((r) => r.id === id) : undefined;
    return row ? { id: row.id, name: row.name } : null;
  };
  return {
    attribution: attribution
      ? {
          gclid: attribution.gclid,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          utmTerm: attribution.utmTerm,
          utmContent: attribution.utmContent,
          source: attribution.source,
          modifiedTime: attribution.createdAt,
          campaign: named(tree.campaigns, attribution.campaignId),
          adGroup: named(tree.groups, attribution.adGroupId),
          keyword: named(tree.keywords, attribution.keywordId),
          ad: named(tree.items, attribution.adItemId),
        }
      : null,
    canEdit,
    // Pick lists for the manual edit form; only users who may edit receive them.
    options: canEdit
      ? {
          campaigns: tree.campaigns.map(({ id, name }) => ({ id, name })),
          adGroups: tree.groups.map(({ id, name, campaignId }) => ({ id, name, campaignId })),
          keywords: tree.keywords.map(({ id, name, adGroupId }) => ({ id, name, adGroupId })),
          ads: tree.items.map(({ id, name, adGroupId }) => ({ id, name, adGroupId })),
        }
      : null,
  };
}

export const GET = apiRoute<{ module: string; recordId: string }>(
  async ({ ctx, params }) => payload(ctx, attributionModule(params.module), params.recordId),
  { permission: { module: "$module", action: "view" } },
);

export const PUT = apiRoute<{ module: string; recordId: string }>(
  async ({ ctx, params, request }) => {
    const module = attributionModule(params.module);
    const { canEdit } = await recordAccess(ctx, module, params.recordId);
    if (!canEdit) throw new ForbiddenError(undefined, "permission_denied");
    const body = await parseBody(request, manualAttributionSchema);
    await getAttribution().setManual(ctx, module, params.recordId, body);
    return payload(ctx, module, params.recordId);
  },
  { permission: { module: "$module", action: "edit" } },
);
