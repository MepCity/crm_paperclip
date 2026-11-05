import { listMembers } from "@crm/core";
import { type ApprovalService, getApprovalService } from "@crm/core/approvals";
import type { OrgContext } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";

import { getCustomizationCoordinator } from "./customization";

/**
 * The shared approval service. Its record access is the system actor's: a service
 * created without the write observer, so on-approve and on-reject field updates
 * neither hit the approval lock nor open new requests.
 */
export function getApprovals(): ApprovalService {
  return getApprovalService({
    systemRecords: (ctx: OrgContext) =>
      createFixtureRecordService(ctx, {
        schema: getCustomizationCoordinator(),
        listMemberIds: async () => (await listMembers(ctx)).map((member) => member.userId),
      }),
  });
}
