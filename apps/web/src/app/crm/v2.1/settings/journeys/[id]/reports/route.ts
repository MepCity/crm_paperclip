import { apiRoute } from "@/lib/api/server";
import { getJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;

    const report = await getJourneys().getJourneyReport(ctx, params.id, {
      startDate,
      endDate,
    });

    return { report, data: report };
  },
  {
    permission: {
      anyOf: [{ feature: "journeys", action: "view" }, { admin: "manageJourneys" }],
    },
  },
);
