import { NotFoundError } from "@crm/core/errors";
import { apiRoute } from "@/lib/api/server";
import { getPortalAdmin, getPortalMailer } from "@/server/portals";

export const dynamic = "force-dynamic";

/** `reinvite`, `send-reset`, `disable`, `enable` on one portal user. */
export const POST = apiRoute<{ id: string; action: string }>(
  async ({ ctx, params }) => {
    const admin = getPortalAdmin();
    switch (params.action) {
      case "reinvite": {
        const user = await admin.reinvite(ctx, params.id);
        const mailer = getPortalMailer();
        const mail = [...mailer.outbox.values()].at(-1);
        const token = mail?.text.match(/#t=([A-Za-z0-9_-]{43})/)?.[1];
        return { user, ...(token ? { inviteToken: token } : {}) };
      }
      case "send-reset": {
        await admin.sendReset(ctx, params.id);
        const mailer = getPortalMailer();
        const mail = [...mailer.outbox.values()].at(-1);
        const token = mail?.text.match(/#t=([A-Za-z0-9_-]{43})/)?.[1];
        return { ok: true, ...(token ? { resetToken: token } : {}) };
      }
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
