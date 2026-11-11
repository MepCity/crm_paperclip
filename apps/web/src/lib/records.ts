import { listMembers } from "@crm/core";
import { getAccessSnapshot } from "@crm/core/access";
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
import { combineWriteObservers } from "@crm/core/records/write-observer";

import { getApprovals } from "./approvals";
import { getCustomizationCoordinator } from "./customization";
import { getJourneys } from "./journeys";

/** The single application adapter selection point for record data. */
export function getRecordService(ctx: OrgContext): RecordService & ModuleMetadataReader {
  return createFixtureRecordService(ctx, {
    schema: getCustomizationCoordinator(),
    access: () => getAccessSnapshot(ctx),
    listMemberIds: async () => (await listMembers(ctx)).map((member) => member.userId),
    writeObserver: combineWriteObservers(
      getApprovals().writeObserver(ctx),
      getJourneys().writeObserver(ctx),
    ),
  });
}

/** Read-only record history facade sharing the tenant's record state. */
export function getRecordHistoryService(ctx: OrgContext): RecordHistoryService {
  return createFixtureRecordHistoryService(ctx, {
    schema: getCustomizationCoordinator(),
    access: () => getAccessSnapshot(ctx),
    listMemberIds: async () => (await listMembers(ctx)).map((member) => member.userId),
  });
}

export function getTagService(ctx: OrgContext): TagService {
  return createFixtureTagService(ctx, {
    schema: getCustomizationCoordinator(),
    access: () => getAccessSnapshot(ctx),
  });
}
