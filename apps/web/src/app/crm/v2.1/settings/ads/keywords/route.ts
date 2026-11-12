import { createAdKeywordSchema } from "@crm/core/ads";
import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, query }) => ({
    keywords: await getAds().listAdKeywords(ctx, query.adGroupId),
  }),
  { permission: { admin: "manageIntegrations" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, createAdKeywordSchema);
    const keyword = await getAds().createAdKeyword(ctx, input);
    return { keyword };
  },
  { permission: { admin: "manageIntegrations" } },
);
