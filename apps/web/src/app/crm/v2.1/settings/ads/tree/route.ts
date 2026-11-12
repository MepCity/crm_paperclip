import { getAds } from "@/lib/ads";
import { apiRoute } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx }) => {
    return getAds().getTree(ctx);
  },
  { permission: { admin: "manageIntegrations" } },
);
