import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { addMemberSchema, parseBody } from "@/lib/api/wire/chat";

export const POST = apiRoute<{ id: string }>(async ({ ctx, params, request }) => {
  const body = await parseBody(request, addMemberSchema);
  return getChatService().addMember(ctx, params.id, body);
});
