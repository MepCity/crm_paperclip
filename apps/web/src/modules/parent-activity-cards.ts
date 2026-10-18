import { createElement } from "react";
import { ParentActivitiesCardBody } from "@/components/records/detail/parent-activities-card-body";
import type { RelatedListDefinition } from "./types";

/** Body renderer for the Open / Closed Activities cards of a parent record's detail page. */
export function parentActivitiesBody(
  parentModule: "Leads" | "Contacts" | "Accounts" | "Deals" | "Campaigns",
  variant: "open" | "closed",
): NonNullable<RelatedListDefinition["renderBody"]> {
  return ({ record, recordPath }) =>
    record
      ? createElement(ParentActivitiesCardBody, {
          parentModule,
          parentRecord: record,
          variant,
          recordPath,
        })
      : undefined;
}
