import { createAdItemSchema } from "@crm/core/ads";
import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, query }) => ({
    items: await getAds().listAdItems(ctx, query.adGroupId),
  }),
  { permission: { admin: "manageIntegrations" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, createAdItemSchema);
    const item = await getAds().createAdItem(ctx, input);
    return { item };
  },
  { permission: { admin: "manageIntegrations" } },
);
