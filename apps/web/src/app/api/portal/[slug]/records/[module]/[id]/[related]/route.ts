import { exemptRoute } from "@/lib/access/route-permission";
import { getPortalData, portalHandler, withPortalSession } from "@/server/portals";

export const dynamic = "force-dynamic";

type Params = { slug: string; module: string; id: string; related: string };

export const GET = exemptRoute(
  "portal",
  "Portal related list: the child module's own proof, never the parent's (ADR 0019a §3).",
  async (request: Request, context: { params: Promise<Params> }) => {
    const { module, id, related } = await context.params;
    const q = new URL(request.url).searchParams;
    return portalHandler((ctx) =>
      withPortalSession(ctx, (principal) =>
        getPortalData().related(principal, module, id, related, {
          page: q.get("page"),
          perPage: q.get("per_page"),
          sortBy: q.get("sort_by"),
          sortOrder: q.get("sort_order"),
          search: q.get("search"),
          filters: q.get("filters"),
        }),
      ),
    )(request, context);
  },
);
