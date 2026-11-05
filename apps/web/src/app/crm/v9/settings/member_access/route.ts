import * as access from "@crm/core/access";
import { accessRoute } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx }) => ({
  members: await access.listMemberAccess(ctx),
}));
