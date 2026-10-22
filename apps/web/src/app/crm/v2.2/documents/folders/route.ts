import { apiRoute } from "@/lib/api/server";
import { getDocumentsService } from "@/server/documents/service";

export const dynamic = "force-dynamic";

export const GET = apiRoute(async ({ ctx }) => ({
  data: await getDocumentsService(ctx).listFolders(),
}));
