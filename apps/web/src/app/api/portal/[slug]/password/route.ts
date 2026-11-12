import { exemptRoute } from "@/lib/access/route-permission";
import {
  clearedCookie,
  getPortalAuth,
  portalHandler,
  portalJson,
  sessionCookie,
} from "@/server/portals";

export const dynamic = "force-dynamic";

export const POST = exemptRoute(
  "portal",
  "Portal password change; rotates every session of the portal user.",
  portalHandler(async ({ slug, token, body, ip }) => {
    const result = await getPortalAuth().changePassword(
      slug,
      token,
      { currentPassword: body.currentPassword, newPassword: body.newPassword },
      { ip },
    );
    if (!result.ok) {
      return portalJson(
        { message: result.message },
        result.status,
        result.status === 401 ? { setCookie: clearedCookie() } : {},
      );
    }
    return portalJson({ ok: true }, 200, { setCookie: sessionCookie(result.token) });
  }),
);
