import { NotFoundError } from "@crm/core/errors";
import { apiRoute } from "@/lib/api/server";
import { getPortalAdmin } from "@/lib/portals";

export const dynamic = "force-dynamic";

/** `reinvite`, `send-reset`, `disable`, `enable` on one portal user. */
export const POST = apiRoute<{ id: string; action: string }>(
  async ({ ctx, params }) => {
    const admin = getPortalAdmin();
    switch (params.action) {
      case "reinvite":
        return { user: await admin.reinvite(ctx, params.id) };
      case "send-reset":
        await admin.sendReset(ctx, params.id);
        return { ok: true };
      case "disable":
        return { user: await admin.disable(ctx, params.id) };
      case "enable":
        return { user: await admin.enable(ctx, params.id) };
      default:
        throw new NotFoundError();
    }
  },
  { permission: { admin: "managePortals" } },
);
