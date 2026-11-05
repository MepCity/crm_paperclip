import { apiRoute } from "@/lib/api/server";
import { composeMail, readMailJson } from "@/server/mail/write";

export const dynamic = "force-dynamic";
export const POST = apiRoute(
  async ({ ctx, request }) => composeMail(ctx, await readMailJson(request)),
  { permission: { memberOnly: "Mailbox ownership rules apply in the mail service (ADR 0009)." } },
);
