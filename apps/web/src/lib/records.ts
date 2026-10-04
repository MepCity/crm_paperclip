import type { OrgContext, RecordService } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";

/** The single application adapter selection point for record data. */
export function getRecordService(ctx: OrgContext): RecordService {
  return createFixtureRecordService(ctx);
}
