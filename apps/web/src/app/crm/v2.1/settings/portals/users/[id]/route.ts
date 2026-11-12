import { apiRoute } from "@/lib/api/server";
import { getPortalAdmin } from "@/server/portals";

export const dynamic = "force-dynamic";

/** Change the user type: `{ userTypeId }`; revokes the user's portal sessions. */
export const PATCH = apiRoute<{ id: string }>(
  async ({ ctx, request, params }) => ({
    user: await getPortalAdmin().changeUserType(
      ctx,
      params.id,
      await request.json().catch(() => null),
    ),
  }),
  { permission: { admin: "managePortals" } },
);
