import { getNotificationService } from "@crm/core/notifications";
import { apiRoute } from "@/lib/api/server";
import { pageLimit } from "@/lib/api/wire/approvals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, query }) =>
    getNotificationService().list(ctx, { cursor: query.cursor, limit: pageLimit(query.limit) }),
  {
    permission: {
      memberOnly: "Scoped to the signed-in actor by the service (approvals and notifications).",
    },
  },
);
