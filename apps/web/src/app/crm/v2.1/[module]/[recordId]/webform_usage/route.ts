import { NotFoundError } from "@crm/core/errors";
import { WEBFORM_MODULES } from "@crm/core/webforms";
import { apiRoute } from "@/lib/api/server";
import { getWebforms } from "@/lib/webforms";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ module: string; recordId: string }>(
  async ({ ctx, params }) => {
    if (!WEBFORM_MODULES.includes(params.module as (typeof WEBFORM_MODULES)[number])) {
      throw new NotFoundError("Module does not support webforms");
    }

    const submissions = await getWebforms().getRecordWebformUsage(
      ctx,
      params.module,
      params.recordId,
    );
    return { submissions };
  },
  { permission: { module: "$module", action: "view" } },
);
