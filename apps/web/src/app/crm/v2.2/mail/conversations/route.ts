import { ValidationError } from "@crm/core/errors";
import { apiRoute } from "@/lib/api/server";
import { emailFolders } from "@/modules/emails/inbox/view-model";
import { listMailConversations, type MailRecordName } from "@/server/mail/service";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx, query }) => {
  if (query.module !== undefined || query.recordId !== undefined) {
    if (
      query.folder !== undefined ||
      !["Leads", "Contacts", "Accounts", "Deals"].includes(query.module ?? "") ||
      !query.recordId?.trim() ||
      query.recordId.length > 256
    )
      throw new ValidationError({
        module: ["Supply a valid module and recordId without folder."],
        recordId: ["Supply a valid module and recordId without folder."],
      });
    return listMailConversations(ctx, {
      module: query.module as MailRecordName,
      recordId: query.recordId,
    });
  }
  const folder = emailFolders.find((item) => item.id === query.folder)?.id;
  if (!folder)
    return Response.json(
      {
        code: "INVALID_FOLDER",
        status: "error",
        message: "A valid mail folder is required.",
        details: { fields: { folder: ["Invalid folder."] } },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  return listMailConversations(ctx, folder);
});
