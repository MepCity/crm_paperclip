import { apiRoute } from "@/lib/api/server";
import { decisionAction, decisionSchema, parseOptionalBody } from "@/lib/api/wire/approvals";
import { getApprovals } from "@/lib/approvals";

export const dynamic = "force-dynamic";

export const POST = apiRoute<{ id: string; action: string }>(async ({ ctx, params, request }) => {
  const action = decisionAction(params.action);
  const body = await parseOptionalBody(request, decisionSchema);
  return getApprovals().decide(ctx, params.id, action, body);
});
