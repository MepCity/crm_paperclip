import * as access from "@crm/core/access";
import { accessRoute, jsonBody } from "@/server/access/route";

export const dynamic = "force-dynamic";

/** Body: `profile_id` and/or `role_id`. */
export const PUT = accessRoute(async ({ ctx, params, request }) => {
  const body = await jsonBody(request);
  return {
    member: await access.setMemberAccess(ctx, {
      userId: params.userId as string,
      profileId: body.profile_id as string | undefined,
      roleId: body.role_id as string | undefined,
    }),
  };
});
