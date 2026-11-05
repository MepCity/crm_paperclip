import * as access from "@crm/core/access";
import { accessRoute, jsonBody } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx, params }) => ({
  profile: await access.getProfile(ctx, params.profileId as string),
}));

export const PUT = accessRoute(async ({ ctx, params, request }) => {
  const body = await jsonBody(request);
  return {
    profile: await access.updateProfile(ctx, {
      profileId: params.profileId as string,
      name: body.name as string | undefined,
      description: body.description as string | undefined,
      permissions: body.permissions,
    }),
  };
});

/** Query: `replacement_profile_id` when the profile is in use. */
export const DELETE = accessRoute(async ({ ctx, params, query }) => {
  await access.deleteProfile(ctx, {
    profileId: params.profileId as string,
    replacementProfileId: query.replacement_profile_id,
  });
  return null;
});
