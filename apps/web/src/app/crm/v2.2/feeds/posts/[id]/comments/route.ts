import { apiRoute } from "@/lib/api/server";
import { commentSchema, parseBody } from "@/lib/api/wire/feeds";
import { getFeedService } from "@/lib/feeds";

export const POST = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, commentSchema);
    return getFeedService(ctx).commentOnPost(params.id, input);
  },
  {
    permission: { feature: "feeds", action: "view" },
  },
);
