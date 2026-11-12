import { exemptRoute } from "@/lib/access/route-permission";
import {
  getPortalAuth,
  hasQueryToken,
  portalHandler,
  portalJson,
  sessionCookie,
} from "@/lib/portals";

export const dynamic = "force-dynamic";

export const POST = exemptRoute(
  "portal",
  "Portal invitation acceptance with a single-use token from the link fragment.",
  portalHandler(async ({ request, slug, body, ip }) => {
    if (hasQueryToken(request)) return portalJson({ message: "Invalid request." }, 400);
    const result = await getPortalAuth().acceptInvitation(
      slug,
      { token: body.token, password: body.password },
      { ip },
    );
    if (!result.ok) return portalJson({ message: result.message }, result.status);
    return portalJson({ user: { email: result.principal.email } }, 200, {
      setCookie: sessionCookie(result.token),
    });
  }),
);
