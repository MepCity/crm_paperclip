import { createLocationSchema } from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => ({
    locations: await getWebforms().listLocations(ctx, params.id),
  }),
  { permission: { admin: "manageWebforms" } },
);

export const POST = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, createLocationSchema);
    const location = await getWebforms().addLocation(ctx, params.id, input);
    return { location };
  },
  { permission: { admin: "manageWebforms" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const url = new URL(request.url);
    const origin = url.searchParams.get("origin") ?? "";
    await getWebforms().removeLocation(ctx, params.id, origin);
    return { ok: true };
  },
  { permission: { admin: "manageWebforms" } },
);
