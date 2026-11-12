import { listMembers } from "@crm/core";
import { getAccessSnapshot } from "@crm/core/access";
import { NotFoundError } from "@crm/core/errors";
import { getAttribution } from "@/lib/ads";
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
            afterLeadConvert: async (leadId, result) => {
              // The record store commits first; the copy must not turn a committed
              // conversion into an error response (same rule as write observers).
              try {
                await getAttribution().copyOnConversion(input.ctx, leadId, result);
              } catch (error) {
                console.error("Ad attribution copy on lead conversion failed", error);
              }
            },
          },
          input,
        )
      ).body;
    },
    { permission: operationPermission(operation.method, operation.path) },
  );
}
