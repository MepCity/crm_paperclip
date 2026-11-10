import { matchesCondition } from "../approvals/criteria";
import type { MailRepository } from "../mail/types";
import type { RecordData, RecordService } from "../records";
import type { CadenceExitRule, CadenceModule } from "./types";

export interface ExitRuleContext {
  record: RecordData;
  recordModule: CadenceModule;
  recordId: string;
  enrollmentCreatedAt: Date;
  orgId?: string;
  recordService?: RecordService;
  mailRepository?: MailRepository;
}

/**
 * Evaluates cadence exit rules against the record state and history.
 * Exit rules win over simultaneous steps (ADR 0019 §6, spec C3).
 */
export async function evaluateExitRules(
  exitRules: readonly CadenceExitRule[],
  context: ExitRuleContext,
): Promise<CadenceExitRule | null> {
  for (const rule of exitRules) {
    if (rule.kind === "field_condition") {
      if (matchesCondition(context.record.fields, rule.condition)) {
        return rule;
      }
    } else if (rule.kind === "reply" || rule.kind === "on_reply") {
      if (context.mailRepository) {
        try {
          const orgId =
            context.orgId ??
            (context.record as unknown as { organizationId?: string }).organizationId ??
            "";
          const snapshot = await context.mailRepository.read(orgId);
          const email =
            typeof context.record.fields.Email === "string"
              ? context.record.fields.Email.toLowerCase().trim()
              : null;
          const matchingLink = snapshot.links.find(
            (l) =>
              l.module.toLowerCase() === context.recordModule.toLowerCase() &&
              l.recordId === context.recordId,
          );
          const hasReply = snapshot.messages.some((msg) => {
            if (msg.folder !== "inbox") return false;
            if (
              msg.receivedAt &&
              new Date(msg.receivedAt).getTime() < context.enrollmentCreatedAt.getTime()
            ) {
              return false;
            }
            if (matchingLink && msg.id === matchingLink.messageId) return true;
            if (email && msg.from.some((p) => p.address.toLowerCase().trim() === email))
              return true;
            return false;
          });
          if (hasReply) {
            return rule;
          }
        } catch {
          // Ignore mail repository read error in exit evaluation
        }
      }
    } else if (rule.kind === "meeting_booked") {
      if (context.recordService) {
        try {
          const eventsResult = await context.recordService.list("Events", {
            viewId: "all-events",
            page: 1,
            perPage: 50,
          });
          const eventsList =
            (eventsResult as unknown as { records?: readonly RecordData[] })?.records ?? [];
          const hasMeeting = eventsList.some((event) => {
            const createdTime = event.fields.Created_Time
              ? new Date(event.fields.Created_Time as string).getTime()
              : 0;
            if (createdTime && createdTime < context.enrollmentCreatedAt.getTime()) return false;
            const whatId = event.fields.What_Id as { module?: string; id?: string } | undefined;
            const whoId = event.fields.Who_Id as { module?: string; id?: string } | undefined;
            if (whatId?.id === context.recordId || whoId?.id === context.recordId) return true;
            return false;
          });
          if (hasMeeting) {
            return rule;
          }
        } catch {
          // Ignore event list error
        }
      }
    }
  }
  return null;
}
