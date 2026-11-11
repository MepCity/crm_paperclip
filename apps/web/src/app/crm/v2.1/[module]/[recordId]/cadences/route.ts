import { CADENCE_MODULES, type CadenceModule } from "@crm/core/cadences";
import { NotFoundError } from "@crm/core/errors";
import { apiRoute } from "@/lib/api/server";
import { getCadences } from "@/lib/cadences";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ module: string; recordId: string }>(
  async ({ ctx, params }) => {
    if (!CADENCE_MODULES.includes(params.module as CadenceModule)) {
      throw new NotFoundError("Module does not support cadences");
    }

    const enrollments = await getCadences().listRecordEnrollments(
      ctx,
      params.module as CadenceModule,
      params.recordId,
    );
    return { enrollments };
  },
  { permission: { module: "$module", action: "view" } },
);
