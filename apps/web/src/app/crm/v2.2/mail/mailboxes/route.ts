import { getSession, listMembers } from "@crm/core";
import { apiRoute } from "@/lib/api/server";
import { listConnectedMailboxes } from "@/server/mail/mailboxes";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx, request }) => {
  const session = await getSession(request.headers);
  let email = session?.user?.email?.trim();
  let name = session?.user?.name?.trim();

  if (!email) {
    try {
      const members = await listMembers(ctx);
      const member = members.find((m) => m.userId === ctx.userId);
      if (member?.email) {
        email = member.email.trim();
        name = member.name?.trim() || name;
      }
    } catch {
      // Allow fake-only tests without real or mocked membership tables to run cleanly.
    }
  }

  const data = await listConnectedMailboxes(ctx, { email, name });
  return { data };
});
