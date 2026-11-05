import { apiRoute } from "@/lib/api/server";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx }) => getApprovals().counts(ctx), {
  permission: {
    memberOnly: "Scoped to the signed-in actor by the service (approvals and notifications).",
  },
});
