import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ module: string; recordId: string }>(
  async ({ ctx, params }) => {
    const attributions = await getAds().getRecordAttributions(ctx, params.module, params.recordId);
    return { attributions };
  },
  { permission: { module: "$module", action: "view" } },
);
