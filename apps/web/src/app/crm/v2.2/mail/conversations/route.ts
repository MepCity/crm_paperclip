import { apiRoute } from "@/lib/api/server";
import { emailFolders } from "@/modules/emails/inbox/view-model";
import { listMailConversations } from "@/server/mail/service";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx, query }) => {
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
