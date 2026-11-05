import * as access from "@crm/core/access";
import { accessRoute, jsonBody } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx }) => ({
  module_defaults: await access.getModuleDefaults(ctx),
}));

export const PUT = accessRoute(async ({ ctx, request }) => {
  const body = await jsonBody(request);
  return {
    module_defaults: await access.putModuleDefaults(ctx, {
      defaults: body.module_defaults as { module: string; level: access.DefaultAccess }[],
    }),
  };
});
