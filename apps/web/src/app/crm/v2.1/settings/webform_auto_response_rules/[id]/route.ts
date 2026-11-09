import { updateAutoResponseRuleSchema } from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => ({
    rule: await getWebforms().getAutoResponseRule(ctx, params.id),
  }),
  { permission: { admin: "manageWebforms" } },
);

export const PUT = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, updateAutoResponseRuleSchema);
    const rule = await getWebforms().updateAutoResponseRule(ctx, params.id, input);
    return { rule };
  },
  { permission: { admin: "manageWebforms" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getWebforms().deleteAutoResponseRule(ctx, params.id);
    return { ok: true };
  },
  { permission: { admin: "manageWebforms" } },
);
