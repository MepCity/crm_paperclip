import { getChatService } from "@crm/core/chat";
import { apiRoute } from "@/lib/api/server";
import { parseBody, setPresenceSchema } from "@/lib/api/wire/chat";

export const PUT = apiRoute(
  async ({ ctx, request }) => {
    const body = await parseBody(request, setPresenceSchema);
    await getChatService().setPresence(ctx, body.status);
    return null;
  },
  { permission: { memberOnly: "Internal chat is organisation-wide by design (ADR 0017 §7.3)." } },
);
