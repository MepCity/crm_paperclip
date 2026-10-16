import { createTransferService, listMembers, type TransferService } from "@crm/core";
import { ForbiddenError } from "@crm/core/errors";
import { getRecordService } from "@/lib/records";
import { apiRoute } from "./server";
import type { TransferOperation } from "./wire/transfer";

const globalForTransfer = globalThis as { __crmTransferService?: TransferService };

/** One process-local service: import and export history lives in its memory. */
export function getTransferService(): TransferService {
  globalForTransfer.__crmTransferService ??= createTransferService({
    records: getRecordService,
    // Membership is the only permission today; module profiles do not exist yet.
    authorize: async (ctx) => {
      const members = await listMembers(ctx);
      if (!members.some((member) => member.userId === ctx.userId)) throw new ForbiddenError();
    },
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
  return apiRoute<Record<string, string>>(
    (input) => operation.run(getTransferService(), input),
    options,
  );
}
