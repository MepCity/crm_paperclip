import { apiRoute } from "@/lib/api/server";
import { getPortalAdmin } from "@/lib/portals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx }) => ({ portal: await getPortalAdmin().getPortal(ctx) }),
  { permission: { admin: "managePortals" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => ({
    portal: await getPortalAdmin().createPortal(ctx, await request.json().catch(() => null)),
  }),
  { permission: { admin: "managePortals" } },
);

export const PATCH = apiRoute(
  async ({ ctx, request }) => ({
    portal: await getPortalAdmin().updatePortal(ctx, await request.json().catch(() => null)),
  }),
  { permission: { admin: "managePortals" } },
);

export const DELETE = apiRoute(
  async ({ ctx }) => {
    await getPortalAdmin().deletePortal(ctx);
    return null;
  },
  { permission: { admin: "managePortals" } },
);
