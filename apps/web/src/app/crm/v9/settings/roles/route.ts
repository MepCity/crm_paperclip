import * as access from "@crm/core/access";
import { accessRoute, jsonBody } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx }) => ({ roles: await access.listRoles(ctx) }));

export const POST = accessRoute(async ({ ctx, request }) => {
  const body = await jsonBody(request);
  return {
    role: await access.createRole(ctx, {
      name: body.name as string,
      parentRoleId: body.parent_role_id as string,
      shareWithPeers: body.share_with_peers as boolean | undefined,
      description: body.description as string | undefined,
    }),
  };
});
