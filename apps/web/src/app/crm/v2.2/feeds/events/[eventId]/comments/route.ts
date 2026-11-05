import { apiRoute } from "@/lib/api/server";
import { eventCommentSchema, parseBody } from "@/lib/api/wire/feeds";
import { getFeedService } from "@/lib/feeds";

export const POST = apiRoute<{ eventId: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, eventCommentSchema);
    return getFeedService(ctx).commentOnEvent(params.eventId, input);
  },
  {
    permission: {
      memberOnly: "Scoped to the signed-in actor; the feed service applies record visibility.",
    },
  },
);
