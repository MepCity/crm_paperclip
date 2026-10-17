import { createElement } from "react";
import { AttachmentsCardContainer } from "@/components/records/attachments/attachments-card-container";
import type { RelatedListDefinition } from "./types";

/** Card renderer for the Attachments card of a parent record's detail page. */
export function attachmentsCard(
  parentModule: "Leads" | "Contacts" | "Accounts" | "Deals",
): NonNullable<RelatedListDefinition["renderCard"]> {
  return ({ record, definition }) =>
    record
      ? createElement(AttachmentsCardContainer, {
          parentModule,
          parentId: record.id,
          targetId: definition.targetId,
        })
      : undefined;
}
