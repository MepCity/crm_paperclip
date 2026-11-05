import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { parseBody, updateConversationSchema } from "@/lib/api/wire/chat";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    return getChatService().getConversation(ctx, params.id);
  },
  { permission: { memberOnly: "Internal chat is organisation-wide by design (ADR 0017 §7.3)." } },
);

export const PATCH = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const body = await parseBody(request, updateConversationSchema);
    return getChatService().updateConversation(ctx, params.id, body);
  },
  { permission: { memberOnly: "Internal chat is organisation-wide by design (ADR 0017 §7.3)." } },
);
