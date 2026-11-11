import { createJourneySchema } from "@crm/core/journeys";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const module = url.searchParams.get("module") || undefined;
    const status = url.searchParams.get("status") || undefined;

    const journeys = await getJourneys().listJourneys(ctx, { search, module, status });
    return { journeys };
  },
  {
    permission: {
      anyOf: [{ feature: "journeys", action: "view" }, { admin: "manageJourneys" }],
    },
  },
);

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, createJourneySchema);
    const journey = await getJourneys().createJourney(ctx, input);
    return { journey };
  },
  { permission: { admin: "manageJourneys" } },
);
