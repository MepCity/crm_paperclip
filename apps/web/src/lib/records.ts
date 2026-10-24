import { listMembers } from "@crm/core";
import type {
  ModuleMetadataReader,
  OrgContext,
  RecordHistoryService,
  RecordService,
  TagService,
} from "@crm/core/records";
import {
  createFixtureRecordHistoryService,
  createFixtureRecordService,
  createFixtureTagService,
} from "@crm/core/records/fixture";

/** The single application adapter selection point for record data. */
export function getRecordService(ctx: OrgContext): RecordService & ModuleMetadataReader {
  return createFixtureRecordService(ctx, {
    listMemberIds: async () => (await listMembers(ctx)).map((member) => member.userId),
  });
}

/** Read-only record history facade sharing the tenant's record state. */
export function getRecordHistoryService(ctx: OrgContext): RecordHistoryService {
  return createFixtureRecordHistoryService(ctx, {
    listMemberIds: async () => (await listMembers(ctx)).map((member) => member.userId),
  });
}

export function getTagService(ctx: OrgContext): TagService {
  return createFixtureTagService(ctx);
}
