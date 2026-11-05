import { apiRoute } from "@/lib/api/server";
import { createPostSchema, parseBody } from "@/lib/api/wire/feeds";
import { getFeedService } from "@/lib/feeds";

export const POST = apiRoute(async ({ ctx, request }) => {
  const input = await parseBody(request, createPostSchema);
  return getFeedService(ctx).createPost(input);
});
