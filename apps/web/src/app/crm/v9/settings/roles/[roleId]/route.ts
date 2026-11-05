import * as access from "@crm/core/access";
import { accessRoute, jsonBody } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx, params }) => ({
  role: await access.getRole(ctx, params.roleId as string),
}));

export const PUT = accessRoute(async ({ ctx, params, request }) => {
  const body = await jsonBody(request);
  return {
    role: await access.updateRole(ctx, {
      roleId: params.roleId as string,
      name: body.name as string | undefined,
      parentRoleId: body.parent_role_id as string | undefined,
      shareWithPeers: body.share_with_peers as boolean | undefined,
      description: body.description as string | undefined,
    }),
  };
});

/** Query: `transfer_role_id` receives the users and child roles. */
export const DELETE = accessRoute(async ({ ctx, params, query }) => {
  await access.deleteRole(ctx, {
    roleId: params.roleId as string,
    transferRoleId: query.transfer_role_id as string,
  });
  return null;
});
