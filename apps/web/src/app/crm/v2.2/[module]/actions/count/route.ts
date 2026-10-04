import { ValidationError } from "@crm/core/errors";
import { apiRoute } from "../../../../../../lib/api/server";
import { getRecordService } from "../../../../../../lib/records";

export const dynamic = "force-dynamic";

export const POST = apiRoute<{ module: string }>(async ({ ctx, params, query }) => {
  const viewId = query.cvid;
  if (!viewId) throw new ValidationError({ cvid: ["Choose a view."] });
  return { count: await getRecordService(ctx).count(params.module, { viewId }) };
});
