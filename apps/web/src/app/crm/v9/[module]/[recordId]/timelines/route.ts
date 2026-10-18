import { apiRoute } from "@/lib/api/server";
import { decodeTimelineQuery, encodeTimelinesPage } from "@/lib/api/wire/timelines";
import { getRecordHistoryService } from "@/lib/records";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ module: string; recordId: string }>(
  async ({ ctx, request, params }) => {
    const query = decodeTimelineQuery(new URL(request.url).searchParams);
    const page = await getRecordHistoryService(ctx).list(params.module, params.recordId, {
      perPage: query.perPage,
      pageToken: query.pageToken,
      modules: query.modules,
      actorId: query.actorId,
      from: query.from,
      to: query.to,
      sources: query.sources,
    });
    return encodeTimelinesPage(page, query);
  },
);
