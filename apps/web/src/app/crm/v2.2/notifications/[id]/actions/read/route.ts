import { getNotificationService } from "@crm/core/notifications";
import { apiRoute } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const POST = apiRoute<{ id: string }>(async ({ ctx, params }) =>
  getNotificationService().markRead(ctx, params.id),
);
