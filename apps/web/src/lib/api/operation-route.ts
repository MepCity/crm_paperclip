import { listMembers } from "@crm/core";
import { NotFoundError } from "@crm/core/errors";
import { getCustomizationService } from "@/lib/customization";
import { getRecordService } from "@/lib/records";
import { apiRoute } from "./server";
import type { Operation } from "./wire/operations";

/** Binds a wire operation to the authenticated, organization-scoped services. */
export function operationRoute(operation: Operation) {
  return apiRoute(async (input) => {
    if (input.params.module?.toLowerCase() === "documents") throw new NotFoundError();
    return (
      await operation.run(
        {
          records: getRecordService(input.ctx),
          members: () => listMembers(input.ctx),
          customization: () => getCustomizationService(input.ctx),
        },
        input,
      )
    ).body;
  });
}
