import { apiRoute } from "@/lib/api/server";
import { getFeedService } from "@/lib/feeds";

type Params = { module: string; recordId: string };

export const dynamic = "force-dynamic";

export const GET = apiRoute<Params>(
  async ({ ctx, params }) => getFeedService(ctx).followState(params.module, params.recordId),
  {
    permission: { feature: "feeds", action: "view" },
  },
);

export const PUT = apiRoute<Params>(
  async ({ ctx, params }) => {
    await getFeedService(ctx).follow("record", params.recordId, params.module);
    return null;
  },
  {
    permission: { feature: "feeds", action: "view" },
  },
);

export const DELETE = apiRoute<Params>(
  async ({ ctx, params }) => {
    await getFeedService(ctx).unfollow("record", params.recordId, params.module);
    return null;
  },
  {
    permission: { feature: "feeds", action: "view" },
  },
);
