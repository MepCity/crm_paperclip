import { updateProcessSchema } from "@crm/core/approvals";
import { apiRoute } from "@/lib/api/server";
import { parseBody } from "@/lib/api/wire/approvals";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>(async ({ ctx, params }) =>
  getApprovals().processes.get(ctx, "approval", params.id),
);

export const PATCH = apiRoute<{ id: string }>(async ({ ctx, params, request }) =>
  getApprovals().processes.update(
    ctx,
    "approval",
    params.id,
    await parseBody(request, updateProcessSchema),
  ),
);

export const DELETE = apiRoute<{ id: string }>(async ({ ctx, params }) =>
  getApprovals().processes.remove(ctx, "approval", params.id),
);
