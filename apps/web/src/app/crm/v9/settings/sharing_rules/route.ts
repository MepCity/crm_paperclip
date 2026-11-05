import * as access from "@crm/core/access";
import { accessRoute, jsonBody, ruleFrom } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx, query }) => ({
  sharing_rules: await access.listSharingRules(ctx, query.module),
}));

export const POST = accessRoute(async ({ ctx, request }) => ({
  sharing_rule: await access.createSharingRule(ctx, ruleFrom(await jsonBody(request))),
}));
