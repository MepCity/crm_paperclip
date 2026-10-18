import { listMembers } from "@crm/core";
import type { OrgContext } from "@crm/core/records";
import { createFixtureRecycleBinService } from "@crm/core/records/fixture";

export function getRecycleBinService(context: OrgContext) {
  return createFixtureRecycleBinService(context, {
    listMemberIds: async () => (await listMembers(context)).map((member) => member.userId),
  });
}
