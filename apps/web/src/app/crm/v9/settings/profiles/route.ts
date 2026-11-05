import * as access from "@crm/core/access";
import { accessRoute, jsonBody } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx }) => ({ profiles: await access.listProfiles(ctx) }));

/** Body: `source_profile_id`, `name`, `description` (new profiles are clones). */
export const POST = accessRoute(async ({ ctx, request }) => {
  const body = await jsonBody(request);
  return {
    profile: await access.cloneProfile(ctx, {
      sourceProfileId: body.source_profile_id as string,
      name: body.name as string,
      description: body.description as string | undefined,
    }),
  };
});
