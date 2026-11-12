import { loadAdsSummary } from "@/lib/ads-summary";
import { apiRoute } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, request }) => {
    const url = new URL(request.url);
    return {
      summary: await loadAdsSummary(ctx, {
        from: url.searchParams.get("from"),
        to: url.searchParams.get("to"),
      }),
    };
  },
  { permission: { feature: "reports", action: "view" } },
);
