import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";

export const GET = apiRoute(async ({ ctx, query }) => {
  return getChatService().search(ctx, {
    q: query.q,
    from: query.from,
    in: query.in,
    type: query.type,
    after: query.after,
    before: query.before,
    hasLink: query.hasLink === "true" || query.hasLink === "1",
    hasMention: query.hasMention === "true" || query.hasMention === "1",
    limit: query.limit ? Number(query.limit) : undefined,
    offset: query.offset ? Number(query.offset) : undefined,
  });
});
