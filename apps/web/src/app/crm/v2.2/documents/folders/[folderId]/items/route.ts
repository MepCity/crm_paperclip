import { ValidationError } from "@crm/core/errors";
import { apiRoute } from "@/lib/api/server";
import { getDocumentsService } from "@/server/documents/service";

export const dynamic = "force-dynamic";

export const GET = apiRoute<{ folderId: string }>(async ({ ctx, params, query }) => {
  const service = getDocumentsService(ctx);
  const field = query.sort_by ?? "modifiedAt";
  const direction = query.sort_order ?? "desc";
  if (direction !== "asc" && direction !== "desc")
    throw new ValidationError({ sort_order: ["Invalid sort direction."] });
  if (field === "name") {
    if (!service.listItemsByName) throw new ValidationError({ sort_by: ["Invalid sort field."] });
    return { data: await service.listItemsByName(params.folderId, { direction }) };
  }
  if (field !== "modifiedAt") throw new ValidationError({ sort_by: ["Invalid sort field."] });
  return { data: await service.listItems(params.folderId, { field, direction }) };
});
