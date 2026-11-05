import { apiRoute } from "@/lib/api/server";
import { parseBody, reorderBodySchema } from "@/lib/api/wire/approvals";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const POST = apiRoute(
  async ({ ctx, request }) => {
    const body = await parseBody(request, reorderBodySchema);
    return {
      review_processes: await getApprovals().processes.reorder(ctx, "review", body.ids),
    };
  },
  { permission: { admin: "manageAutomation" } },
);
