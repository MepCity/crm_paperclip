import { apiRoute } from "@/lib/api/server";
import { getJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string; instanceId: string }>(
  async ({ ctx, params }) => {
    const log = await getJourneys().getJourneyTransitionLog(ctx, params.instanceId);
    return { log, data: log };
  },
  {
    permission: {
      anyOf: [{ feature: "journeys", action: "view" }, { admin: "manageJourneys" }],
    },
  },
);
