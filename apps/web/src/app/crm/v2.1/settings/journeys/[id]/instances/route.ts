import { apiRoute } from "@/lib/api/server";
import { getJourneys } from "@/lib/journeys";
import { getRecordService } from "@/lib/records";

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

    const recordService = getRecordService(ctx);
    const enrichedInstances = await Promise.all(
      result.instances.map(async (inst) => {
        let recordName: string | undefined;
        try {
          const rec = await recordService.get(inst.recordModule, inst.recordId);
          if (rec?.fields) {
            recordName =
              (typeof rec.fields.Full_Name === "string" && rec.fields.Full_Name) ||
              [rec.fields.First_Name, rec.fields.Last_Name].filter(Boolean).join(" ") ||
              (typeof rec.fields.Account_Name === "string" && rec.fields.Account_Name) ||
              (typeof rec.fields.Deal_Name === "string" && rec.fields.Deal_Name) ||
              undefined;
          }
        } catch {
          // Record may have been deleted or inaccessible
        }
        return {
          ...inst,
          recordName: recordName || inst.recordId,
        };
      }),
    );

    return { ...result, instances: enrichedInstances };
  },
  {
    permission: {
      anyOf: [{ feature: "journeys", action: "view" }, { admin: "manageJourneys" }],
    },
  },
);
