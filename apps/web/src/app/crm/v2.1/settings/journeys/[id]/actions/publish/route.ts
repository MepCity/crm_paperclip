import { apiRoute } from "@/lib/api/server";
import { getJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";

export const POST = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    const journey = await getJourneys().publishJourney(ctx, params.id);
    return { journey };
  },
  { permission: { admin: "manageJourneys" } },
);
