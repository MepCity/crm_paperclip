import { listMembers } from "@crm/core";
import { getAccessSnapshot } from "@crm/core/access";
import type { OrgContext } from "@crm/core/records";
import { createFixtureRecycleBinService } from "@crm/core/records/fixture";

export function getRecycleBinService(context: OrgContext) {
  return createFixtureRecycleBinService(context, {
    access: () => getAccessSnapshot(context),
    listMemberIds: async () => (await listMembers(context)).map((member) => member.userId),
  });
}
