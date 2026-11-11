import { updateAdItemSchema } from "@crm/core/ads";
import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => ({
    item: await getAds().getAdItem(ctx, params.id),
  }),
  { permission: { admin: "manageIntegrations" } },
);

export const PUT = apiRoute<{ id: string }>(
  async ({ ctx, request, params }) => {
    const input = await parseBody(request, updateAdItemSchema);
    const item = await getAds().updateAdItem(ctx, params.id, input);
    return { item };
  },
  { permission: { admin: "manageIntegrations" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getAds().deleteAdItem(ctx, params.id);
    return { success: true };
  },
  { permission: { admin: "manageIntegrations" } },
);
