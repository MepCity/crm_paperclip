import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { parseBody, postReplySchema } from "@/lib/api/wire/chat";

export const GET = apiRoute<{ id: string }>(async ({ ctx, params }) => {
  return getChatService().getReplies(ctx, params.id);
});

export const POST = apiRoute<{ id: string }>(async ({ ctx, params, request }) => {
  const body = await parseBody(request, postReplySchema);
  return getChatService().postReply(ctx, params.id, body);
});
