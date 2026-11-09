import { apiRoute } from "@/lib/api/server";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(
  async ({ ctx, request, params }) => {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const location = searchParams.get("location") ?? undefined;

    const analytics = await getWebforms().getFormAnalytics(ctx, params.id, {
      startDate,
      endDate,
      location,
    });
    return { analytics };
  },
  { permission: { admin: "manageWebforms" } },
);
