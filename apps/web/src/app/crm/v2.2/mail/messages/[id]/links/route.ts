import { apiRoute } from "@/lib/api/server";
import { mutateMail, readMailJson } from "@/server/mail/write";

export const dynamic = "force-dynamic";
export const POST = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) =>
    mutateMail(ctx, params.id, "link", await readMailJson(request)),
  { permission: { memberOnly: "Mailbox ownership rules apply in the mail service (ADR 0009)." } },
);
export const DELETE = apiRoute<{ id: string }>(
  async ({ ctx, params, request }) =>
    mutateMail(ctx, params.id, "unlink", await readMailJson(request)),
  { permission: { memberOnly: "Mailbox ownership rules apply in the mail service (ADR 0009)." } },
);
