import { apiRoute } from "@/lib/api/server";
import { getDocumentsService } from "@/server/documents/service";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ itemId: string }>(async ({ ctx, params }) => ({
  data: [await getDocumentsService(ctx).getItem(params.itemId)],
}));
