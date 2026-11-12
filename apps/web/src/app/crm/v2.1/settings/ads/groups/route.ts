import { createAdGroupSchema } from "@crm/core/ads";
import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, query }) => ({
    groups: await getAds().listAdGroups(ctx, query.campaignId),
  }),
  { permission: { admin: "manageIntegrations" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, createAdGroupSchema);
    const group = await getAds().createAdGroup(ctx, input);
    return { group };
  },
  { permission: { admin: "manageIntegrations" } },
);
