import { createElement } from "react";
import type { RelatedListDefinition } from "@/modules/types";
import { EmailsRecordCard } from "./emails-record-card";
import type { EmailParentModule, EmailRecordCardLoader } from "./types";

/** Card renderer for the Emails card of a parent record's detail page. */
export function emailsCard(
  parentModule: EmailParentModule,
  loader?: EmailRecordCardLoader,
): NonNullable<RelatedListDefinition["renderCard"]> {
  return ({ record, definition }) =>
    createElement(EmailsRecordCard, {
      parentModule,
      recordId: record?.id,
      targetId: definition.targetId,
      subtabRowEndControl: definition.subtabRowEndControl,
      ...(loader ? { loader } : {}),
    });
}
