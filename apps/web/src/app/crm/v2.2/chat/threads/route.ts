import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";

export const GET = apiRoute(async ({ ctx }) => {
  return getChatService().listThreads(ctx);
});
