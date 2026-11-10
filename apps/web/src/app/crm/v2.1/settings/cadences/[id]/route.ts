import { updateCadenceDraftSchema } from "@crm/core/cadences";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getCadences } from "@/lib/cadences";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    const cadence = await getCadences().getCadence(ctx, params.id);
    return { cadence };
  },
  { permission: { feature: "cadences", action: "view" } },
);

export const PUT = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const input = await parseBody(request, updateCadenceDraftSchema);
    const cadence = await getCadences().updateCadenceDraft(ctx, params.id, input);
    return { cadence };
  },
  { permission: { feature: "cadences", action: "manage" } },
);

export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    await getCadences().deleteCadence(ctx, params.id);
    return { ok: true };
  },
  { permission: { feature: "cadences", action: "manage" } },
);
