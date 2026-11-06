import { apiRoute } from "@/lib/api/server";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const POST = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    const form = await getWebforms().activate(ctx, params.id);
    return { webform: form };
  },
  { permission: { admin: "manageWebforms" } },
);
