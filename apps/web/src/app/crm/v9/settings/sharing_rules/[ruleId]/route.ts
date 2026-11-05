import * as access from "@crm/core/access";
import { accessRoute, jsonBody, ruleFrom } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const PUT = accessRoute(async ({ ctx, params, request }) => ({
  sharing_rule: await access.updateSharingRule(
    ctx,
    params.ruleId as string,
    ruleFrom(await jsonBody(request)),
  ),
}));

export const DELETE = accessRoute(async ({ ctx, params }) => {
  await access.deleteSharingRule(ctx, params.ruleId as string);
  return null;
});
