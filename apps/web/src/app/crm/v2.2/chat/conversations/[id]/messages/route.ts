import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { parseBody, postMessageSchema } from "@/lib/api/wire/chat";

export const GET = apiRoute<{ id: string }>(async ({ ctx, params, query }) => {
  const before = query.before ? Number(query.before) : undefined;
  const limit = query.limit ? Number(query.limit) : undefined;
  return getChatService().getMessages(ctx, params.id, { before, limit });
});

export const POST = apiRoute<{ id: string }>(async ({ ctx, params, request }) => {
  const body = await parseBody(request, postMessageSchema);
  return getChatService().postMessage(ctx, params.id, body);
});
