import { listMembers } from "@crm/core";
import { getAccessSnapshot } from "@crm/core/access";
import { NotFoundError } from "@crm/core/errors";
import { getCustomizationService } from "@/lib/customization";
import { getRecordService } from "@/lib/records";
import { operationPermission } from "./route-permissions";
import { apiRoute } from "./server";
import type { Operation } from "./wire/operations";

/** Binds a wire operation to the authenticated, organization-scoped services. */
export function operationRoute(operation: Operation) {
  return apiRoute(
    async (input) => {
      if (input.params.module?.toLowerCase() === "documents") throw new NotFoundError();
      return (
        await operation.run(
          {
            records: getRecordService(input.ctx),
            members: () => listMembers(input.ctx),
            pickableUserIds: async () => {
              const snapshot = await getAccessSnapshot(input.ctx);
              if (
                snapshot.profileKind === "administrator" ||
                !snapshot.permissions.tools.onlyListSubordinates
              )
                return null;
              return new Set([snapshot.userId, ...snapshot.subordinateUserIds]);
            },
            customization: () => getCustomizationService(input.ctx),
          },
          input,
        )
      ).body;
    },
    { permission: operationPermission(operation.method, operation.path) },
  );
}
