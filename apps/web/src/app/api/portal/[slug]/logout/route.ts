import { exemptRoute } from "@/lib/access/route-permission";
import { clearedCookie, getPortalAuth, portalHandler, portalJson } from "@/lib/portals";

export const dynamic = "force-dynamic";

export const POST = exemptRoute(
  "portal",
  "Portal sign-out revokes the presented portal session.",
  portalHandler(async ({ slug, token, ip }) => {
    await getPortalAuth().logout(slug, token, { ip });
    return portalJson(null, 204, { setCookie: clearedCookie() });
  }),
);
