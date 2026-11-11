import { updateJourneyDraftSchema } from "@crm/core/journeys";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    const journey = await getJourneys().getJourney(ctx, params.id);
    return { journey };
  },
  {
    permission: {
      anyOf: [{ feature: "journeys", action: "view" }, { admin: "manageJourneys" }],
    },
  },
);

export const PUT = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, updateJourneyDraftSchema);
    const journey = await getJourneys().updateJourneyDraft(ctx, params.id, input);
    return { journey };
  },
  { permission: { admin: "manageJourneys" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getJourneys().deleteJourney(ctx, params.id);
    return { ok: true };
  },
  { permission: { admin: "manageJourneys" } },
);
