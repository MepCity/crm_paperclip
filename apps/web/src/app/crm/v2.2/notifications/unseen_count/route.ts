import { getNotificationService } from "@crm/core/notifications";
import { apiRoute } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx }) => getNotificationService().unseenCount(ctx), {
  permission: {
    memberOnly: "Scoped to the signed-in actor by the service (approvals and notifications).",
  },
});
