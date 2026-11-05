import { apiRoute } from "@/lib/api/server";
import { editSchema, parseBody } from "@/lib/api/wire/feeds";
import { getFeedService } from "@/lib/feeds";

export const PATCH = apiRoute<{ id: string }>(async ({ ctx, params, request }) => {
  const input = await parseBody(request, editSchema);
  return getFeedService(ctx).editComment(params.id, input);
});

export const DELETE = apiRoute<{ id: string }>(async ({ ctx, params }) => {
  await getFeedService(ctx).deleteComment(params.id);
  return null;
});
