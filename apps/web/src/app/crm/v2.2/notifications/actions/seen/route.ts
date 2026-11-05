import { getNotificationService } from "@crm/core/notifications";
import { apiRoute } from "@/lib/api/server";
import { parseOptionalBody, seenBodySchema } from "@/lib/api/wire/approvals";

export const dynamic = "force-dynamic";

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const body = await parseOptionalBody(request, seenBodySchema);
    return getNotificationService().markSeen(ctx, body.ids);
  },
  {
    permission: {
      memberOnly: "Scoped to the signed-in actor by the service (approvals and notifications).",
    },
  },
);
