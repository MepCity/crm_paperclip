import * as access from "@crm/core/access";
import { accessRoute, jsonBody } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx }) => ({ groups: await access.listGroups(ctx) }));

export const POST = accessRoute(async ({ ctx, request }) => {
  const body = await jsonBody(request);
  return {
    group: await access.createGroup(ctx, {
      name: body.name as string,
      description: body.description as string | undefined,
      members: body.members as access.GroupMemberRef[] | undefined,
    }),
  };
});
