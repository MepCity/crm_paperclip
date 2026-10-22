import { apiRoute } from "@/lib/api/server";
import { mutateMail, readMailJson } from "@/server/mail/write";

export const dynamic = "force-dynamic";
export const POST = apiRoute<{ id: string }>(async ({ ctx, params, request }) =>
  mutateMail(ctx, params.id, "link", await readMailJson(request)),
);
export const DELETE = apiRoute<{ id: string }>(async ({ ctx, params, request }) =>
  mutateMail(ctx, params.id, "unlink", await readMailJson(request)),
);
