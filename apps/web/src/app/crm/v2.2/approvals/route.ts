import { apiRoute } from "@/lib/api/server";
import { pageLimit } from "@/lib/api/wire/approvals";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, query }) =>
    getApprovals().listQueue(ctx, {
      type: query.type ?? "approval",
      status: query.status,
      module: query.module,
      scope: query.scope,
      cursor: query.cursor,
      limit: pageLimit(query.limit),
    }),
  {
    permission: {
      memberOnly: "Scoped to the signed-in actor by the service (approvals and notifications).",
    },
  },
);
