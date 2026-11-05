import { apiRoute } from "@/lib/api/server";
import { pageLimit } from "@/lib/api/wire/approvals";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, query }) =>
    getApprovals().history(ctx, {
      type: query.type,
      module: query.module,
      user: query.user,
      action: query.action,
      from: query.from,
      to: query.to,
      cursor: query.cursor,
      limit: pageLimit(query.limit),
    }),
  {
    permission: {
      memberOnly: "Scoped to the signed-in actor by the service (approvals and notifications).",
    },
  },
);
