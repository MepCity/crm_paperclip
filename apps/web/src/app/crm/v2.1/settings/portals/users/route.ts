import { apiRoute } from "@/lib/api/server";
import { getPortalAdmin } from "@/server/portals";

export const dynamic = "force-dynamic";

/** `?contactId=` returns the portal user linked to one Contact (or null). */
export const GET = apiRoute(
  async ({ ctx, query }) => {
    if (query.contactId) {
      return { user: await getPortalAdmin().getIdentityForContact(ctx, query.contactId) };
    }
    return { users: await getPortalAdmin().listIdentities(ctx) };
  },
  { permission: { admin: "managePortals" } },
);

/** Invite a Contact: `{ contactId, userTypeId }`. */
export const POST = apiRoute(
  async ({ ctx, request }) => {
    const user = await getPortalAdmin().invite(ctx, await request.json().catch(() => null));
    return { user };
  },
  { permission: { admin: "managePortals" } },
);
