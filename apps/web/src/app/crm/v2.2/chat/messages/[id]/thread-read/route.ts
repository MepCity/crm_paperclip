import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";

export const POST = apiRoute<{ id: string }>(async ({ ctx, params }) => {
  await getChatService().markThreadRead(ctx, params.id);
  return null;
});
