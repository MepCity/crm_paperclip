"use client";

import type { RecordData } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
} from "@/components/records/detail/record-detail-screen";
import { openContactCreateWithReportingTo } from "./contacts-record-create";
import { createContactsRelatedLists } from "./contacts-related-lists";
import { contactsScreenDefinition } from "./definition";

export type ContactRecordScreenProps = Omit<
  RecordDetailScreenProps,
  "definition" | "buildRelatedLists"
>;

export function ContactRecordScreen(props: ContactRecordScreenProps) {
  const router = useRouter();
  const buildRelatedLists = useCallback(
    (record: RecordData) =>
      createContactsRelatedLists({
        onNewReportingContact: () =>
          openContactCreateWithReportingTo(props.orgSlug, record, (path) => router.push(path)),
        onAddReportingContact: () =>
          openContactCreateWithReportingTo(props.orgSlug, record, (path) => router.push(path)),
      }),
    [props.orgSlug, router],
  );

  return (
    <RecordDetailScreen
      {...props}
      definition={contactsScreenDefinition}
      buildRelatedLists={buildRelatedLists}
    />
  );
}
