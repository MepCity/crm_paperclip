import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { parseBody, updateMessageSchema } from "@/lib/api/wire/chat";

export const PATCH = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const body = await parseBody(request, updateMessageSchema);
    return getChatService().editMessage(ctx, params.id, body);
  },
  { permission: { memberOnly: "Internal chat is organisation-wide by design (ADR 0017 §7.3)." } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getChatService().deleteMessage(ctx, params.id);
    return null;
  },
  { permission: { memberOnly: "Internal chat is organisation-wide by design (ADR 0017 §7.3)." } },
);
