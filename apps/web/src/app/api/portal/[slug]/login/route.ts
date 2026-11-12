import { exemptRoute } from "@/lib/access/route-permission";
import { getPortalAuth, portalHandler, portalJson, sessionCookie } from "@/server/portals";

export const dynamic = "force-dynamic";

export const POST = exemptRoute(
  "portal",
  "Portal sign-in with the portal's own identity store (ADR 0019a §2.5).",
  portalHandler(async ({ slug, body, ip, token }) => {
    const result = await getPortalAuth().login(
      slug,
      { email: body.email, password: body.password },
      { ip, previousToken: token },
    );
    if (!result.ok) return portalJson({ message: result.message }, result.status);
    return portalJson(
      { user: { email: result.principal.email, name: result.principal.displayName } },
      200,
      { setCookie: sessionCookie(result.token) },
    );
  }),
);
