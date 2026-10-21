import { listMembers } from "@crm/core";
import { NotFoundError } from "@crm/core/errors";
import { getRecordService } from "@/lib/records";
import { apiRoute } from "./server";
import type { Operation } from "./wire/operations";

/** Binds a wire operation to the authenticated, organization-scoped services. */
export function operationRoute(operation: Operation) {
  return apiRoute(async (input) => {
    if (input.params.module?.toLowerCase() === "documents") throw new NotFoundError();
    return (
      await operation.run(
        { records: getRecordService(input.ctx), members: () => listMembers(input.ctx) },
        input,
      )
    ).body;
  });
}
