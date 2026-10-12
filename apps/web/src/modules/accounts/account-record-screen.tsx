"use client";

import type { RecordData } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
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
import { accountsScreenDefinition } from "./definition";

export type AccountRecordScreenProps = Omit<
  RecordDetailScreenProps,
  "definition" | "buildRelatedLists"
>;

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

export function AccountRecordScreen(props: AccountRecordScreenProps) {
  const router = useRouter();
  const badges = useAccountRelatedBadges(props.recordId);

  const buildRelatedLists = useCallback(
    (record: RecordData) =>
      createAccountsRelatedLists({
        badges,
        handlers: {
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

  return (
    <RecordDetailScreen
      {...props}
      definition={accountsScreenDefinition}
      buildRelatedLists={buildRelatedLists}
      linkedContactSummaryPath={contactRecordPath}
    />
  );
}
