import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { createConversationSchema, parseBody } from "@/lib/api/wire/chat";

export const GET = apiRoute(async ({ ctx }) => {
  return getChatService().listConversations(ctx);
});

export const POST = apiRoute(async ({ ctx, request }) => {
  const body = await parseBody(request, createConversationSchema);
  return getChatService().createConversation(ctx, body);
});
