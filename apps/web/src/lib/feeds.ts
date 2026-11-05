import { type FeedDeps, FeedService } from "@crm/core/feeds";
import type { OrgContext } from "@crm/core/records";
import { getRecordHistoryService, getRecordService } from "@/lib/records";

/** The single application adapter selection point for feeds. */
export function getFeedService(ctx: OrgContext, extra: Partial<FeedDeps> = {}): FeedService {
  return new FeedService(ctx, {
    records: getRecordService(ctx),
    history: getRecordHistoryService(ctx),
    ...extra,
  });
}
