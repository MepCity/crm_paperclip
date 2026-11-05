import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";

export const PUT = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getChatService().pinConversation(ctx, params.id, true);
    return null;
  },
  { permission: { memberOnly: "Internal chat is organisation-wide by design (ADR 0017 §7.3)." } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getChatService().pinConversation(ctx, params.id, false);
    return null;
  },
  { permission: { memberOnly: "Internal chat is organisation-wide by design (ADR 0017 §7.3)." } },
);
