import {
  createAutoResponseRuleSchema,
  WEBFORM_MODULES,
  type WebformModule,
} from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, request }) => {
    const url = new URL(request.url);
    const mod = url.searchParams.get("module") as WebformModule | null;
    const moduleFilter = mod && WEBFORM_MODULES.includes(mod) ? mod : undefined;
    return {
      rules: await getWebforms().listAutoResponseRules(ctx, moduleFilter),
    };
  },
  { permission: { admin: "manageWebforms" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, createAutoResponseRuleSchema);
    const rule = await getWebforms().createAutoResponseRule(ctx, input);
    return { rule };
  },
  { permission: { admin: "manageWebforms" } },
);
