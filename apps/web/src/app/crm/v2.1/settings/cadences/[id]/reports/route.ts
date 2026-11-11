import { apiRoute } from "@/lib/api/server";
import { getCadences } from "@/lib/cadences";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;

    const report = await getCadences().getCadenceReport(ctx, params.id, {
      startDate,
      endDate,
    });

    return { report };
  },
  { permission: { feature: "cadences", action: "view" } },
);
