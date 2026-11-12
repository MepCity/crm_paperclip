import { exemptRoute } from "@/lib/access/route-permission";
import { getPortalAuth, portalHandler, portalJson } from "@/lib/portals";

export const dynamic = "force-dynamic";

export const POST = exemptRoute(
  "portal",
  "Portal password-reset request; always the same 202 answer (no account oracle).",
  portalHandler(async ({ slug, body, ip }) => {
    const result = await getPortalAuth().requestReset(slug, { email: body.email }, { ip });
    return portalJson({ message: result.message }, result.status);
  }),
);
