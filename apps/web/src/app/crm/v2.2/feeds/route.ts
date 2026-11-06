import { ValidationError } from "@crm/core/errors";
import { apiRoute } from "@/lib/api/server";
import { feedListQuerySchema } from "@/lib/api/wire/feeds";
import { getFeedService } from "@/lib/feeds";

export const dynamic = "force-dynamic";

export const GET = apiRoute(
  async ({ ctx, query }) => {
    const parsed = feedListQuerySchema.safeParse(query);
    if (!parsed.success) throw new ValidationError({ query: ["Invalid feed query."] });
    return getFeedService(ctx).list(parsed.data);
  },
  {
    permission: { feature: "feeds", action: "view" },
  },
);
