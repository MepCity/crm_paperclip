import * as access from "@crm/core/access";
import { accessRoute, jsonBody } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx, params }) => ({
  group: await access.getGroup(ctx, params.groupId as string),
}));

export const PUT = accessRoute(async ({ ctx, params, request }) => {
  const body = await jsonBody(request);
  return {
    group: await access.updateGroup(ctx, {
      groupId: params.groupId as string,
      name: body.name as string | undefined,
      description: body.description as string | undefined,
      members: body.members as access.GroupMemberRef[] | undefined,
    }),
  };
});

export const DELETE = accessRoute(async ({ ctx, params }) => {
  await access.deleteGroup(ctx, { groupId: params.groupId as string });
  return null;
});
