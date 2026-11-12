import { apiRoute } from "@/lib/api/server";
import { getPortalAdmin } from "@/lib/portals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, query }) => ({
    events: await getPortalAdmin().listAuthEvents(ctx, {
      limit: query.limit ? Number.parseInt(query.limit, 10) || 100 : 100,
    }),
  }),
  { permission: { admin: "managePortals" } },
);
