import { apiRoute } from "@/lib/api/server";
import { getJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string; instanceId: string }>(
  async ({ ctx, params }) => {
    const instance = await getJourneys().getJourneyInstance(ctx, params.instanceId);
    return { instance };
  },
  {
    permission: {
      anyOf: [{ feature: "journeys", action: "view" }, { admin: "manageJourneys" }],
    },
  },
);

export const DELETE = apiRoute<{ id: string; instanceId: string }>(
  async ({ ctx, params }) => {
    const instance = await getJourneys().stopJourneyInstance(ctx, params.instanceId);
    return { instance };
  },
  {
    permission: {
      admin: "manageJourneys",
    },
  },
);
