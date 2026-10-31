import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";

export const PUT = apiRoute<{ id: string }>(async ({ ctx, params }) => {
  await getChatService().pinConversation(ctx, params.id, true);
  return null;
});

export const DELETE = apiRoute<{ id: string }>(async ({ ctx, params }) => {
  await getChatService().pinConversation(ctx, params.id, false);
  return null;
});
