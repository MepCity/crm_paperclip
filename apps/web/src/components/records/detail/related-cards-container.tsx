"use client";

import type { RecordData, RecordId } from "@crm/core/records";
import type { RelatedListDefinition } from "@/modules/types";
import { RecordPageFooter } from "./record-page-footer";
import { RelatedListCard } from "./related-list-card";

export interface RelatedCardsContainerProps {
  relatedLists: readonly RelatedListDefinition[];
  orgSlug?: string;
  managerRecord?: RecordData;
  recordPath?: (recordId: RecordId) => string;
  contactRecordPath?: (recordId: RecordId) => string;
  dealRecordPath?: (recordId: RecordId) => string;
}

export function RelatedCardsContainer({
  relatedLists,
  orgSlug,
  managerRecord,
  recordPath,
  contactRecordPath,
  dealRecordPath,
}: RelatedCardsContainerProps) {
  if (!relatedLists || relatedLists.length === 0) return null;

  return (
    <div data-related-cards-container className="flex flex-col gap-3">
      {relatedLists.map((def) => (
        <RelatedListCard
          key={def.id}
          definition={def}
          reportingContacts={
            def.id === "reporting-contacts" && managerRecord && recordPath
              ? { managerRecord, orgSlug: orgSlug ?? "", recordPath }
              : undefined
          }
          accountContacts={
            def.id === "contacts" && managerRecord && contactRecordPath
              ? { accountRecord: managerRecord, orgSlug: orgSlug ?? "", contactRecordPath }
              : undefined
          }
          memberAccounts={
            def.id === "member-accounts" && managerRecord && recordPath
              ? {
                  parentRecord: managerRecord,
                  orgSlug: orgSlug ?? "",
                  accountRecordPath: recordPath,
                }
              : undefined
          }
          dealStageHistory={
            def.id === "stage-history" && managerRecord ? { dealId: managerRecord.id } : undefined
          }
          managerDeals={
            def.id === "deals" && managerRecord && def.recordFilterField && dealRecordPath
              ? {
                  managerRecord,
                  filterField: def.recordFilterField,
                  dealRecordPath,
                }
              : undefined
          }
        />
      ))}
      <RecordPageFooter />
    </div>
  );
}
