import * as access from "@crm/core/access";
import { accessRoute, jsonBody, requiredFieldsFor } from "@/server/access/route";

export const dynamic = "force-dynamic";

export const GET = accessRoute(async ({ ctx, params }) => ({
  field_permissions: await access.getFieldPermissions(ctx, {
    profileId: params.profileId as string,
    module: params.module as string,
  }),
}));

/** Body: `field_permissions: [{ field, access: "read_only" | "hidden" }]` replaces the set. */
export const PUT = accessRoute(async ({ ctx, params, request }) => {
  const body = await jsonBody(request);
  return {
    field_permissions: await access.putFieldPermissions(
      ctx,
      {
        profileId: params.profileId as string,
        module: params.module as string,
        fields: (body.field_permissions ?? []) as access.FieldPermissionRow[],
      },
      requiredFieldsFor(ctx.orgId),
    ),
  };
});
