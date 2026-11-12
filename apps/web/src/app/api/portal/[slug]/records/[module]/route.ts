import { exemptRoute } from "@/lib/access/route-permission";
import { getPortalData, portalHandler, withPortalSession } from "@/server/portals";

export const dynamic = "force-dynamic";

type Params = { slug: string; module: string };

function listParams(request: Request) {
  const q = new URL(request.url).searchParams;
  return {
    page: q.get("page"),
    perPage: q.get("per_page"),
    sortBy: q.get("sort_by"),
    sortOrder: q.get("sort_order"),
    search: q.get("search"),
    filters: q.get("filters"),
  };
}

export const GET = exemptRoute(
  "portal",
  "Portal record list: portal session, relationship proof and projection (ADR 0019a §3–§4).",
  async (request: Request, context: { params: Promise<Params> }) => {
    const { module } = await context.params;
    return portalHandler((ctx) =>
      withPortalSession(ctx, (principal) =>
        getPortalData().list(principal, module, listParams(request)),
      ),
    )(request, context);
  },
);

export const POST = exemptRoute(
  "portal",
  "Portal Case create as the portal actor (ADR 0019a §4.3).",
  async (request: Request, context: { params: Promise<Params> }) => {
    const { module } = await context.params;
    return portalHandler((ctx) =>
      withPortalSession(ctx, (principal) => getPortalData().create(principal, module, ctx.body)),
    )(request, context);
  },
);
