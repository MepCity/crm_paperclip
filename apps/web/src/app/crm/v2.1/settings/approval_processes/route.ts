import { createProcessSchema } from "@crm/core/approvals";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/approvals";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx }) => ({
  approval_processes: await getApprovals().processes.list(ctx, "approval"),
}));

export const POST = apiRoute(async ({ ctx, request }) =>
  getApprovals().processes.create(ctx, "approval", await parseBody(request, createProcessSchema)),
);
