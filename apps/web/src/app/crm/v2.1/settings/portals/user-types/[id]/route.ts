import { apiRoute } from "@/lib/api/server";
import { getPortalAdmin } from "@/lib/portals";

export const dynamic = "force-dynamic";

export const PATCH = apiRoute<{ id: string }>(
  async ({ ctx, request, params }) => ({
    userType: await getPortalAdmin().updateUserType(
      ctx,
      params.id,
      await request.json().catch(() => null),
    ),
  }),
  { permission: { admin: "managePortals" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getPortalAdmin().deleteUserType(ctx, params.id);
    return null;
  },
  { permission: { admin: "managePortals" } },
);
