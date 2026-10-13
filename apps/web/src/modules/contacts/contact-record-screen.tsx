"use client";

import type { RecordData } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ContactHierarchyModal } from "@/components/records/detail/contact-hierarchy-modal";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
} from "@/components/records/detail/record-detail-screen";
import { openContactCreateWithReportingTo } from "./contacts-record-create";
import { createContactsRelatedLists } from "./contacts-related-lists";

export type ContactRecordScreenProps = Omit<RecordDetailScreenProps, "buildRelatedLists">;

export function ContactRecordScreen({ definition, ...props }: ContactRecordScreenProps) {
  const router = useRouter();
  const [hierarchyOpen, setHierarchyOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<RecordData | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const buildRelatedLists = useCallback(
    (record: RecordData) =>
      createContactsRelatedLists({
        onHierarchyView: () => {
          triggerRef.current = document.activeElement as HTMLElement | null;
          setActiveRecord(record);
          setHierarchyOpen(true);
        },
        onNewReportingContact: () =>
          openContactCreateWithReportingTo(props.orgSlug, record, (path) => router.push(path)),
        onAddReportingContact: () =>
          openContactCreateWithReportingTo(props.orgSlug, record, (path) => router.push(path)),
      }),
    [props.orgSlug, router],
  );

  return (
    <>
      <RecordDetailScreen
        {...props}
        definition={definition}
        buildRelatedLists={buildRelatedLists}
      />
      {hierarchyOpen ? (
        <ContactHierarchyModal
          isOpen={hierarchyOpen}
          onClose={() => {
            setHierarchyOpen(false);
            triggerRef.current?.focus?.();
          }}
          orgSlug={props.orgSlug}
          contact={{
            id: props.recordId,
            record: activeRecord,
          }}
          triggerElement={triggerRef.current}
        />
      ) : null}
    </>
  );
}
