import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";

export const GET = apiRoute(async ({ ctx, query }) => {
  const cursor = query.cursor ? Number(query.cursor) : 0;
  return getChatService().sync(ctx, Number.isFinite(cursor) ? cursor : 0);
});
