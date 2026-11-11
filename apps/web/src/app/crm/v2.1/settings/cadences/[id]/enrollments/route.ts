import { apiRoute } from "@/lib/api/server";
import { getCadences } from "@/lib/cadences";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) => {
    const url = new URL(request.url);
    const recordId = url.searchParams.get("recordId") || undefined;
    const state = url.searchParams.get("state") || undefined;
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;
    const offset = url.searchParams.get("offset")
      ? Number(url.searchParams.get("offset"))
      : undefined;

    const enrollments = await getCadences().listEnrollments(ctx, {
      cadenceId: params.id,
      recordId,
      state,
      limit,
      offset,
    });

    return { enrollments };
  },
  { permission: { feature: "cadences", action: "view" } },
);
