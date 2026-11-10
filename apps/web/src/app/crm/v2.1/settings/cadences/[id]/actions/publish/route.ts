import { apiRoute } from "@/lib/api/server";
import { getCadences } from "@/lib/cadences";

export const dynamic = "force-dynamic";

export const POST = apiRoute<{ id: string }>(
  async ({ ctx, params }) => {
    const cadence = await getCadences().publishCadence(ctx, params.id);
    return { cadence };
  },
  { permission: { feature: "cadences", action: "manage" } },
);
