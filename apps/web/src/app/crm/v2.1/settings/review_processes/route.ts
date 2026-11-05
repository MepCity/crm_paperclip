import { createProcessSchema } from "@crm/core/approvals";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/approvals";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx }) => ({
    review_processes: await getApprovals().processes.list(ctx, "review"),
  }),
  { permission: { admin: "manageAutomation" } },
);

export const POST = apiRoute(
  async ({ ctx, request }) =>
    getApprovals().processes.create(ctx, "review", await parseBody(request, createProcessSchema)),
  { permission: { admin: "manageAutomation" } },
);
