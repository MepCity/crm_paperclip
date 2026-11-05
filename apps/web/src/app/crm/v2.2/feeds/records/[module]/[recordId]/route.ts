import { ValidationError } from "@crm/core/errors";
import { apiRoute } from "@/lib/api/server";
import { feedListQuerySchema } from "@/lib/api/wire/feeds";
import { getFeedService } from "@/lib/feeds";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ module: string; recordId: string }>(
  async ({ ctx, params, query }) => {
    const parsed = feedListQuerySchema.safeParse(query);
    if (!parsed.success) throw new ValidationError({ query: ["Invalid feed query."] });
    return getFeedService(ctx).listForRecord(params.module, params.recordId, parsed.data);
  },
);
