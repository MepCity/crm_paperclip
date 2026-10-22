import { createElement } from "react";
import type { RelatedListDefinition } from "@/modules/types";
import { EmailsRecordCard } from "./emails-record-card";
import type { EmailParentModule } from "./types";

/** Card renderer for the Emails card of a parent record's detail page. */
export function emailsCard(
  parentModule: EmailParentModule,
): NonNullable<RelatedListDefinition["renderCard"]> {
  return ({ record, definition }) =>
    createElement(EmailsRecordCard, {
      parentModule,
      recordId: record?.id,
      recipientEmail: typeof record?.fields.Email === "string" ? record.fields.Email : undefined,
      targetId: definition.targetId,
      subtabRowEndControl: definition.subtabRowEndControl,
    });
}
