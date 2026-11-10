import { createCadenceSchema } from "@crm/core/cadences";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/chat";
import { getCadences } from "@/lib/cadences";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const module = url.searchParams.get("module") || undefined;
    const status = url.searchParams.get("status") || undefined;

    const cadences = await getCadences().listCadences(ctx, { search, module, status });
    return { cadences };
  },
  { permission: { feature: "cadences", action: "view" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const input = await parseBody(request, createCadenceSchema);
    const cadence = await getCadences().createCadence(ctx, input);
    return { cadence };
  },
  { permission: { feature: "cadences", action: "manage" } },
);
