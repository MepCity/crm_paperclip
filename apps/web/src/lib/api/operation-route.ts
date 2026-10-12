import { listMembers } from "@crm/core";
import { getRecordService } from "@/lib/records";
import { apiRoute } from "./server";
import type { Operation } from "./wire/operations";

/** Binds a wire operation to the authenticated, organization-scoped services. */
export function operationRoute(operation: Operation) {
  return apiRoute(
    async (input) =>
      (
        await operation.run(
          { records: getRecordService(input.ctx), members: () => listMembers(input.ctx) },
          input,
        )
      ).body,
  );
}
