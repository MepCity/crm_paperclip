import { NotFoundError } from "@crm/core/errors";
import { JOURNEY_MODULES, type JourneyModule } from "@crm/core/journeys";
import { apiRoute } from "@/lib/api/server";
import { getJourneys } from "@/lib/journeys";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ module: string; recordId: string }>(
  async ({ ctx, params }) => {
    if (!JOURNEY_MODULES.includes(params.module as JourneyModule)) {
      throw new NotFoundError("Module does not support journeys");
    }

    const instances = await getJourneys().listRecordInstances(
      ctx,
      params.module as JourneyModule,
      params.recordId,
    );
    return { instances, data: instances };
  },
  { permission: { module: "$module", action: "view" } },
);
