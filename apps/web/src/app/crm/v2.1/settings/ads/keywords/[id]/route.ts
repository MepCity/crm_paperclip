import { updateAdKeywordSchema } from "@crm/core/ads";
import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => ({
    keyword: await getAds().getAdKeyword(ctx, params.id),
  }),
  { permission: { admin: "manageIntegrations" } },
);

export const PUT = apiRoute<{ id: string }>(
  async ({ ctx, request, params }) => {
    const input = await parseBody(request, updateAdKeywordSchema);
    const keyword = await getAds().updateAdKeyword(ctx, params.id, input);
    return { keyword };
  },
  { permission: { admin: "manageIntegrations" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getAds().deleteAdKeyword(ctx, params.id);
    return { success: true };
  },
  { permission: { admin: "manageIntegrations" } },
);
