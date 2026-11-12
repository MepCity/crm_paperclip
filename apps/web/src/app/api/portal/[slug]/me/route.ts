import { exemptRoute } from "@/lib/access/route-permission";
import { clearedCookie, getPortalAuth, portalHandler, portalJson } from "@/server/portals";
import { systemOrgContext, withOrg } from "@crm/core";
import { and, eq, schema } from "@crm/db";

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
    const details = await withOrg(systemOrgContext(p.orgId), async (tx) => {
      const [portal] = await tx
        .select({
          id: schema.portals.id,
          name: schema.portals.name,
          slug: schema.portals.slug,
          status: schema.portals.status,
          defaultLanguage: schema.portals.defaultLanguage,
        })
        .from(schema.portals)
        .where(and(eq(schema.portals.organizationId, p.orgId), eq(schema.portals.id, p.portalId)));
      const [userType] = await tx
        .select({
          id: schema.portalUserTypes.id,
          name: schema.portalUserTypes.name,
          modules: schema.portalUserTypes.modules,
          settings: schema.portalUserTypes.settings,
        })
        .from(schema.portalUserTypes)
        .where(
          and(
            eq(schema.portalUserTypes.organizationId, p.orgId),
            eq(schema.portalUserTypes.id, p.userTypeId),
          ),
        );
      return { portal, userType };
    });

    return portalJson({
      user: {
        email: p.email,
        name: p.displayName,
        userTypeId: p.userTypeId,
        recordId: p.recordId,
      },
      portal: details?.portal ?? null,
      userType: details?.userType ?? null,
    });
  }),
);
