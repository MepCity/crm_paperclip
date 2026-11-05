import { type FeedDeps, FeedService } from "@crm/core/feeds";
import { getNotificationService } from "@crm/core/notifications";
import type { OrgContext } from "@crm/core/records";
import { getRecordHistoryService, getRecordService } from "@/lib/records";

/** The single application adapter selection point for feeds. */
export function getFeedService(ctx: OrgContext, extra: Partial<FeedDeps> = {}): FeedService {
  return new FeedService(ctx, {
    records: getRecordService(ctx),
    history: getRecordHistoryService(ctx),
    notify: async (tx, list) => {
      const service = getNotificationService();
      for (const n of list) {
        await service.notify(tx, ctx.orgId, {
          recipients: [n.recipientUserId],
          kind: n.kind,
          subject: n.subject as Record<string, string>,
          actorUserId: n.actorUserId,
        });
      }
    },
    ...extra,
  });
}
