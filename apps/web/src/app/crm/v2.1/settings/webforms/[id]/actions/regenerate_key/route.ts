import { apiRoute } from "@/lib/api/server";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const POST = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    const result = await getWebforms().regeneratePublicKey(ctx, params.id);
    return result;
  },
  { permission: { admin: "manageWebforms" } },
);
