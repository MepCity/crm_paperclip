"use client";

import type { RecordData } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { ContactHierarchyModal } from "@/components/records/detail/contact-hierarchy-modal";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
} from "@/components/records/detail/record-detail-screen";
import { useRecordCount, useViews } from "@/lib/api/client/hooks";
import { moduleRecordPath } from "@/lib/crm-paths";
import {
  openAccountCreateWithParentAccount,
  openContactCreateWithAccountName,
} from "./accounts-record-create";
import { createAccountsRelatedLists } from "./accounts-related-lists";
export type AccountRecordScreenProps = Omit<RecordDetailScreenProps, "buildRelatedLists">;

function useAccountRelatedBadges(accountId: string) {
  const contactsViews = useViews("Contacts");
  const contactsViewId = useMemo(
    () => contactsViews.data?.find((view) => view.isDefault)?.id ?? null,
    [contactsViews.data],
  );
  const contactsCountQuery = useRecordCount("Contacts", {
    viewId: contactsViewId ?? "all-contacts",
    filters: { field: "Account_Name", comparator: "equal", value: accountId },
  });
  return useMemo(
    () => ({
      notes: 0,
      contacts: contactsCountQuery.data ?? 0,
    }),
    [contactsCountQuery.data],
  );
}

export function AccountRecordScreen({ definition, ...props }: AccountRecordScreenProps) {
  const router = useRouter();
  const badges = useAccountRelatedBadges(props.recordId);
  const [hierarchyOpen, setHierarchyOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<RecordData | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const buildRelatedLists = useCallback(
    (record: RecordData) =>
      createAccountsRelatedLists({
        badges,
        handlers: {
          onHierarchyView: () => {
            triggerRef.current = document.activeElement as HTMLElement | null;
            setActiveRecord(record);
            setHierarchyOpen(true);
          },
          onContactsNew: () =>
            openContactCreateWithAccountName(props.orgSlug, record, (path) => router.push(path)),
          onMemberAccountNew: () =>
            openAccountCreateWithParentAccount(props.orgSlug, record, (path) => router.push(path)),
        },
      }),
    [badges, props.orgSlug, router],
  );

  const contactRecordPath = useCallback(
    (contactId: string) => moduleRecordPath(props.orgSlug, "Contacts", contactId),
    [props.orgSlug],
  );

  const accountName = (activeRecord?.fields.Account_Name as string | undefined) ?? props.recordId;

  return (
    <>
      <RecordDetailScreen
        {...props}
        definition={definition}
        buildRelatedLists={buildRelatedLists}
        linkedContactSummaryPath={contactRecordPath}
      />
      <ContactHierarchyModal
        isOpen={hierarchyOpen}
        onClose={() => {
          setHierarchyOpen(false);
          triggerRef.current?.focus?.();
        }}
        orgSlug={props.orgSlug}
        account={{
          id: props.recordId,
          name: accountName,
        }}
        triggerElement={triggerRef.current}
      />
    </>
  );
}
