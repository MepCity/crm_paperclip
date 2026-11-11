import { apiRoute } from "@/lib/api/server";
import { getJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const url = new URL(request.url);
    const stateId = url.searchParams.get("stateId") || url.searchParams.get("state") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const enteredBefore = url.searchParams.get("enteredBefore") || undefined;
    const enteredAfter = url.searchParams.get("enteredAfter") || undefined;
    const deadlineBefore = url.searchParams.get("deadlineBefore") || undefined;
    const deadlineAfter = url.searchParams.get("deadlineAfter") || undefined;
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const page = pageParam ? Number.parseInt(pageParam, 10) : undefined;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const result = await getJourneys().listJourneyInstances(ctx, params.id, {
      stateId,
      status,
      enteredBefore,
      enteredAfter,
      deadlineBefore,
      deadlineAfter,
      page: Number.isNaN(page) ? undefined : page,
      limit: Number.isNaN(limit) ? undefined : limit,
    });

    return result;
  },
  {
    permission: {
      anyOf: [{ feature: "journeys", action: "view" }, { admin: "manageJourneys" }],
    },
  },
);
