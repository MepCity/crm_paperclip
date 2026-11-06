import { createWebformSchema } from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx }) => ({
    webforms: await getWebforms().listForms(ctx),
  }),
  { permission: { admin: "manageWebforms" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, createWebformSchema);
    const form = await getWebforms().createForm(ctx, input);
    return { webform: form };
  },
  { permission: { admin: "manageWebforms" } },
);
