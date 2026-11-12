import { apiRoute } from "@/lib/api/server";
import { getPortalAdmin } from "@/server/portals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx }) => ({ userTypes: await getPortalAdmin().listUserTypes(ctx) }),
  { permission: { admin: "managePortals" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => ({
    userType: await getPortalAdmin().createUserType(ctx, await request.json().catch(() => null)),
  }),
  { permission: { admin: "managePortals" } },
);
