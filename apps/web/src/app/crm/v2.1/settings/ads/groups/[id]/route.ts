import { updateAdGroupSchema } from "@crm/core/ads";
import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => ({
    group: await getAds().getAdGroup(ctx, params.id),
  }),
  { permission: { admin: "manageIntegrations" } },
);

export const PUT = apiRoute<{ id: string }>(
  async ({ ctx, request, params }) => {
    const input = await parseBody(request, updateAdGroupSchema);
    const group = await getAds().updateAdGroup(ctx, params.id, input);
    return { group };
  },
  { permission: { admin: "manageIntegrations" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getAds().deleteAdGroup(ctx, params.id);
    return { success: true };
  },
  { permission: { admin: "manageIntegrations" } },
);
