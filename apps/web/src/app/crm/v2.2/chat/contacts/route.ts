import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";

export const GET = apiRoute(async ({ ctx, query }) => {
  const category = query.category === "recent" ? "recent" : "frequent";
  return getChatService().listContacts(ctx, category);
});
