import { exemptRoute } from "@/lib/access/route-permission";
import { clearedCookie, getPortalAuth, portalHandler, portalJson } from "@/server/portals";

export const dynamic = "force-dynamic";

export const GET = exemptRoute(
  "portal",
  "Current portal user from the portal session cookie only.",
  portalHandler(async ({ slug, token, ip }) => {
    const result = await getPortalAuth().authenticate(slug, token, { ip });
    if (!result.ok) {
      return portalJson(
        { message: result.message },
        result.status,
        result.status === 401 ? { setCookie: clearedCookie() } : {},
      );
    }
    const p = result.principal;
    return portalJson({
      user: { email: p.email, name: p.displayName, userTypeId: p.userTypeId },
    });
  }),
);
