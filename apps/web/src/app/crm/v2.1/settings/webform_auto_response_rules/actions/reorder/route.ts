import { reorderAutoResponseRulesSchema } from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, reorderAutoResponseRulesSchema);
    const rules = await getWebforms().reorderAutoResponseRules(ctx, input.module, input.ids);
    return { rules };
  },
  { permission: { admin: "manageWebforms" } },
);
