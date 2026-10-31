import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";

export const DELETE = apiRoute<{ id: string; userId: string }>(async ({ ctx, params }) => {
  await getChatService().removeMember(ctx, params.id, params.userId);
  return null;
});
