import { apiRoute } from "@/lib/api/server";
import { getFeedService } from "@/lib/feeds";

type Params = { userId: string };

export const PUT = apiRoute<Params>(
  async ({ ctx, params }) => {
    await getFeedService(ctx).follow("user", params.userId);
    return null;
  },
  {
    permission: {
      memberOnly: "Scoped to the signed-in actor; the feed service applies record visibility.",
    },
  },
);

export const DELETE = apiRoute<Params>(
  async ({ ctx, params }) => {
    await getFeedService(ctx).unfollow("user", params.userId);
    return null;
  },
  {
    permission: {
      memberOnly: "Scoped to the signed-in actor; the feed service applies record visibility.",
    },
  },
);
