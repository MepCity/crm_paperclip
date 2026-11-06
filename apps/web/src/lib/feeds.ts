import { fieldAccess, getAccessSnapshot } from "@crm/core/access";
import { type FeedDeps, FeedService } from "@crm/core/feeds";
import { getNotificationService } from "@crm/core/notifications";
import type { OrgContext } from "@crm/core/records";
import { getRecordHistoryService, getRecordService } from "@/lib/records";

/** The single application adapter selection point for feeds. */
export function getFeedService(ctx: OrgContext, extra: Partial<FeedDeps> = {}): FeedService {
  return new FeedService(ctx, {
    records: getRecordService(ctx),
    history: getRecordHistoryService(ctx),
    // ADR 0017 §4.2: fields hidden from the viewer never show up in event changes.
    hiddenFields: async (module) => {
      const snapshot = await getAccessSnapshot(ctx);
      const name = module === "Events" ? "Meetings" : module;
      const fields = snapshot.fieldAccess.get(name)?.keys() ?? [];
      return new Set([...fields].filter((f) => fieldAccess(snapshot, name, f) === "hidden"));
    },
    // ADR 0018 §4.2: a mentioned user who cannot read the record gets no notification.
    canUserRead: async (userId, module, recordId) => {
      try {
        await getRecordService({ ...ctx, userId, role: "member", accessVersion: undefined }).get(
          module,
          recordId,
        );
        return true;
      } catch {
        return false;
      }
    },
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
