import { updateDraftSchema } from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => ({
    webform: await getWebforms().getForm(ctx, params.id),
  }),
  { permission: { admin: "manageWebforms" } },
);

export const PUT = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, updateDraftSchema);
    const form = await getWebforms().updateDraft(ctx, params.id, input);
    return { webform: form };
  },
  { permission: { admin: "manageWebforms" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getWebforms().deleteForm(ctx, params.id);
    return { ok: true };
  },
  { permission: { admin: "manageWebforms" } },
);
