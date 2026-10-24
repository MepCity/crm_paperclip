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
import { useParentActivityBadges } from "@/lib/records/use-parent-activities";
import { AccountDealsAssignDialog } from "./account-deals-assign-dialog";
import {
  openAccountCreateWithParentAccount,
  openCaseCreateWithAccountName,
  openContactCreateWithAccountName,
  openDealCreateWithAccountName,
} from "./accounts-record-create";
import { createAccountsRelatedLists } from "./accounts-related-lists";
export type AccountRecordScreenProps = Omit<RecordDetailScreenProps, "buildRelatedLists">;

function useAccountRelatedBadges(accountId: string) {
  const contactsViews = useViews("Contacts");
  const contactsViewId = useMemo(
    () => contactsViews.data?.find((view) => view.isDefault)?.id ?? null,
    [contactsViews.data],
  );
  const dealsViews = useViews("Deals");
  const dealsViewId = useMemo(
    () => dealsViews.data?.find((view) => view.isDefault)?.id ?? "all-deals",
    [dealsViews.data],
  );
  const contactsCountQuery = useRecordCount("Contacts", {
    viewId: contactsViewId ?? "all-contacts",
    filters: { field: "Account_Name", comparator: "equal", value: accountId },
  });
  const dealsCountQuery = useRecordCount("Deals", {
    viewId: dealsViewId,
    filters: { field: "Account_Name", comparator: "equal", value: accountId },
  });
  return useMemo(
    () => ({
      notes: 0,
      contacts: contactsCountQuery.data ?? 0,
      deals: dealsCountQuery.data ?? 0,
    }),
    [contactsCountQuery.data, dealsCountQuery.data],
  );
}

export function AccountRecordScreen({ definition, ...props }: AccountRecordScreenProps) {
  const router = useRouter();
  const relatedBadges = useAccountRelatedBadges(props.recordId);
  const activityBadges = useParentActivityBadges("Accounts", props.recordId);
  const badges = useMemo(
    () => ({ ...relatedBadges, ...activityBadges }),
    [relatedBadges, activityBadges],
  );
  const [hierarchyOpen, setHierarchyOpen] = useState(false);
  const [dealsAssignOpen, setDealsAssignOpen] = useState(false);
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
          onCasesNew: () =>
            openCaseCreateWithAccountName(props.orgSlug, record, (path) => router.push(path)),
          onDealsAssign: () => {
            setActiveRecord(record);
            setDealsAssignOpen(true);
          },
          onDealsNew: () =>
            openDealCreateWithAccountName(props.orgSlug, record, (path) => router.push(path)),
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
      {dealsAssignOpen ? (
        <AccountDealsAssignDialog
          isOpen
          onClose={() => setDealsAssignOpen(false)}
          account={{ id: props.recordId, name: accountName }}
        />
      ) : null}
      {hierarchyOpen ? (
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
      ) : null}
    </>
  );
}
