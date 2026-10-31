import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { parseBody, updateConversationSchema } from "@/lib/api/wire/chat";

export const GET = apiRoute<{ id: string }>(async ({ ctx, params }) => {
  return getChatService().getConversation(ctx, params.id);
});

export const PATCH = apiRoute<{ id: string }>(async ({ ctx, params, request }) => {
  const body = await parseBody(request, updateConversationSchema);
  return getChatService().updateConversation(ctx, params.id, body);
});
