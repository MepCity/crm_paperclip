import { createTransferService, listMembers, type TransferService } from "@crm/core";
import { can, getAccessSnapshot } from "@crm/core/access";
import { ForbiddenError } from "@crm/core/errors";
import { DEFAULT_TIME_ZONE } from "@/lib/locale";
import { getRecordService } from "@/lib/records";
import { operationPermission } from "./route-permissions";
import { apiRoute } from "./server";
import { transferLocale } from "./transfer-locale";
import type { TransferOperation } from "./wire/transfer";

const globalForTransfer = globalThis as { __crmTransferService?: TransferService };

/** One process-local service: import and export history lives in its memory. */
export function getTransferService(): TransferService {
  globalForTransfer.__crmTransferService ??= createTransferService({
    records: getRecordService,
    // Profile gate of ADR 0017 §7 (import/export module lists + module actions).
    authorize: async (ctx, module, action) => {
      const members = await listMembers(ctx);
      if (!members.some((member) => member.userId === ctx.userId)) throw new ForbiddenError();
      const snapshot = await getAccessSnapshot(ctx);
      if (snapshot.profileKind === "administrator") return;
      const lists = snapshot.permissions;
      const listed = (names: readonly string[]) => names.includes(module);
      const allowed =
        action === "export"
          ? can(snapshot, module, "view") && listed(lists.exportModules)
          : action === "read"
            ? can(snapshot, module, "view") && listed(lists.importModules)
            : action === "create"
              ? can(snapshot, module, "create") && listed(lists.importModules)
              : action === "update"
                ? can(snapshot, module, "edit") && listed(lists.importModules)
                : can(snapshot, module, "delete") || lists.admin.dataManagement;
      if (!allowed) throw new ForbiddenError(undefined, "permission_denied");
    },
    locale: transferLocale,
    // No per-user zone setting exists yet; the app formats and imports in the default zone.
    timeZone: () => DEFAULT_TIME_ZONE,
    listActors: async (ctx) =>
      (await listMembers(ctx)).map((member) => ({ id: member.userId, name: member.name })),
  });
  return globalForTransfer.__crmTransferService;
}

/** Binds a transfer operation to the authenticated, organization-scoped service. */
export function transferRoute(
  operation: TransferOperation,
  options: { orgFromQuery?: boolean } = {},
) {
  return apiRoute<Record<string, string>>((input) => operation.run(getTransferService(), input), {
    ...options,
    permission: operationPermission(operation.method, operation.path),
  });
}
