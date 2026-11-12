import { exemptRoute } from "@/lib/access/route-permission";
import { getPortalData, portalHandler, withPortalSession } from "@/server/portals";

export const dynamic = "force-dynamic";

type Params = { slug: string; module: string; id: string };

export const GET = exemptRoute(
  "portal",
  "Portal record detail: proof and projection in one query (ADR 0019a §3–§4).",
  async (request: Request, context: { params: Promise<Params> }) => {
    const { module, id } = await context.params;
    return portalHandler((ctx) =>
      withPortalSession(ctx, (principal) => getPortalData().get(principal, module, id)),
    )(request, context);
  },
);

export const PATCH = exemptRoute(
  "portal",
  "Portal self-edit of the identity's own Contact (ADR 0019a §4.3).",
  async (request: Request, context: { params: Promise<Params> }) => {
    const { module, id } = await context.params;
    return portalHandler((ctx) =>
      withPortalSession(ctx, (principal) =>
        getPortalData().update(principal, module, id, ctx.body),
      ),
    )(request, context);
  },
);
