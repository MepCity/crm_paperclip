import { getNotificationService } from "@crm/core/notifications";
import { apiRoute } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx }) => getNotificationService().unseenCount(ctx));
