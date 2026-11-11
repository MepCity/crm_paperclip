import { createCampaignSchema } from "@crm/core/ads";
import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx }) => ({
    campaigns: await getAds().listCampaigns(ctx),
  }),
  { permission: { admin: "manageIntegrations" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, createCampaignSchema);
    const campaign = await getAds().createCampaign(ctx, input);
    return { campaign };
  },
  { permission: { admin: "manageIntegrations" } },
);
