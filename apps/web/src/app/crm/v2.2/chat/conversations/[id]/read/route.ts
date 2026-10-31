import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { markReadSchema, parseBody } from "@/lib/api/wire/chat";

export const POST = apiRoute<{ id: string }>(async ({ ctx, params, request }) => {
  const body = await parseBody(request, markReadSchema);
  await getChatService().markConversationRead(ctx, params.id, body.seq);
  return null;
});
