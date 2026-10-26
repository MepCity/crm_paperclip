import { apiRoute } from "@/lib/api/server";
import { mutateMail, readMailJson } from "@/server/mail/write";

export const dynamic = "force-dynamic";
export const PATCH = apiRoute<{ id: string }>(async ({ ctx, params, request }) =>
  mutateMail(ctx, params.id, "sharing", await readMailJson(request)),
);
