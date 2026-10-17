import { listMembers } from "@crm/core";
import type { OrgContext, RecordService, TagService } from "@crm/core/records";
import { createFixtureRecordService, createFixtureTagService } from "@crm/core/records/fixture";

/** The single application adapter selection point for record data. */
export function getRecordService(ctx: OrgContext): RecordService {
  return createFixtureRecordService(ctx, {
    listMemberIds: async () => (await listMembers(ctx)).map((member) => member.userId),
  });
}

export function getTagService(ctx: OrgContext): TagService {
  return createFixtureTagService(ctx);
}
