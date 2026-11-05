import { ValidationError } from "@crm/core/errors";
import { apiRoute } from "@/lib/api/server";
import { eventLikeSchema, likeTargetSchema, parseBody } from "@/lib/api/wire/feeds";
import { getFeedService } from "@/lib/feeds";

type Params = { targetKind: string; targetId: string };

function kindOf(raw: string) {
  const kind = likeTargetSchema.safeParse(raw);
  if (!kind.success) throw new ValidationError({ targetKind: ["Unknown like target."] });
  return kind.data;
}

/** Idempotent like. History events also send their record in the body. */
export const PUT = apiRoute<Params>(
  async ({ ctx, params, request }) => {
    const kind = kindOf(params.targetKind);
    const event = kind === "history_event" ? await parseBody(request, eventLikeSchema) : undefined;
    await getFeedService(ctx).like(kind, params.targetId, event);
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
    await getFeedService(ctx).unlike(kindOf(params.targetKind), params.targetId);
    return null;
  },
  {
    permission: {
      memberOnly: "Scoped to the signed-in actor; the feed service applies record visibility.",
    },
  },
);
