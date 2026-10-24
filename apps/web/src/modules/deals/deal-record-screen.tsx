"use client";

import type { ModuleMetadata, RecordData, RecordInput } from "@crm/core/records";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { contactRolesOfDeal } from "@/components/records/detail/contact-roles-card-body";
import {
  RecordDetailScreen,
  type RecordDetailScreenProps,
  type RecordDetailSlotsContext,
} from "@/components/records/detail/record-detail-screen";
import { StageChangeDialog } from "@/components/records/detail/stage-bar";
import type { StageChangeFormValues } from "@/components/records/detail/stage-bar/types";
import { useHomeCurrency, useRecordCount, useUpdateRecord } from "@/lib/api/client/hooks";
import { useOrgSlug } from "@/lib/api/client/provider";
import { countQueriesPrefix, listQueriesPrefix } from "@/lib/api/client/query-keys";
import { moduleRecordPath } from "@/lib/crm-paths";
import { useParentActivityBadges } from "@/lib/records/use-parent-activities";
import { DealsContactPersonSummary } from "./deals-contact-person-summary";
import { DealsNextActionSummary } from "./deals-next-action-summary";
import { openCaseCreateWithDeal } from "./deals-record-create";
import { createDealsRelatedLists } from "./deals-related-lists";
import { DealsSalesSummary } from "./deals-sales-summary";
import { DealsStageOverview } from "./deals-stage-overview";
import {
  buildStageBarStages,
  buildStageChangeInitialValues,
  isClosedStageKind,
  mapStageChangeError,
  readStageValue,
  reasonForLossPicklist,
  stageChangeToRecordInput,
  stageOptionKind,
} from "./deals-stage-utils";

export type DealRecordScreenProps = Omit<
  RecordDetailScreenProps,
  "buildRelatedLists" | "buildDetailSlots" | "saveRecord"
>;

function useDealStageHistoryCount(dealId: string) {
  return useRecordCount("DealHistory", {
    viewId: "all-deal-history",
    filters: { field: "Potential_Name", comparator: "equal", value: dealId },
  });
}

function useContactRolesCount(dealId: string) {
  return useRecordCount("Contact_Roles", {
    viewId: "all-contact-roles",
    filters: contactRolesOfDeal(dealId),
  });
}

export function DealRecordScreen({
  definition,
  recordId,
  orgSlug,
  ...props
}: DealRecordScreenProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedOrgSlug = useOrgSlug();
  const historyCount = useDealStageHistoryCount(recordId);
  const contactRolesCount = useContactRolesCount(recordId);
  const updateRecord = useUpdateRecord("Deals");
  const homeCurrency = useHomeCurrency();

  const moduleRef = useRef<ModuleMetadata | null>(null);
  const recordRef = useRef<RecordData | null>(null);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyValues, setVerifyValues] = useState<StageChangeFormValues | null>(null);
  const [verifyLost, setVerifyLost] = useState(false);

  const activityBadges = useParentActivityBadges("Deals", recordId);
  const badges = useMemo(
    () => ({
      stageHistory: historyCount.data ?? 0,
      contactRoles: contactRolesCount.data ?? 0,
      ...activityBadges,
    }),
    [historyCount.data, contactRolesCount.data, activityBadges],
  );

  const buildRelatedLists = useCallback(
    (record: RecordData) =>
      createDealsRelatedLists({
        badges,
        handlers: {
          onCasesNew: () => openCaseCreateWithDeal(orgSlug, record, (path) => router.push(path)),
        },
      }),
    [badges, orgSlug, router],
  );

  const invalidateHistory = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: countQueriesPrefix(resolvedOrgSlug, "DealHistory"),
    });
    void queryClient.invalidateQueries({
      queryKey: listQueriesPrefix(resolvedOrgSlug, "DealHistory"),
    });
  }, [queryClient, resolvedOrgSlug]);

  const persistDeal = useCallback(
    async (input: RecordInput) => {
      await updateRecord.mutateAsync({ id: recordId, input });
      invalidateHistory();
    },
    [invalidateHistory, recordId, updateRecord],
  );

  const saveRecord = useCallback(
    async (input: RecordInput) => {
      const module = moduleRef.current;
      const record = recordRef.current;
      if (!module || !record) {
        await persistDeal(input);
        return;
      }
      const fromVerifyDialog =
        Object.hasOwn(input, "Amount") ||
        Object.hasOwn(input, "Closing_Date") ||
        Object.hasOwn(input, "Reason_For_Loss__s");
      if (!fromVerifyDialog && typeof input.Stage === "string" && Object.hasOwn(input, "Stage")) {
        const next = input.Stage;
        const current = readStageValue(record);
        const kind = stageOptionKind(module, next);
        if (next !== current && isClosedStageKind(kind)) {
          const initial = buildStageChangeInitialValues(record);
          setVerifyValues({
            ...initial,
            stage: next,
            amount: typeof input.Amount === "number" ? input.Amount : initial.amount,
            closingDate:
              typeof input.Closing_Date === "string" ? input.Closing_Date : initial.closingDate,
            reasonForLoss:
              typeof input.Reason_For_Loss__s === "string"
                ? input.Reason_For_Loss__s
                : initial.reasonForLoss,
          });
          setVerifyLost(kind === "lost");
          setVerifyOpen(true);
          return;
        }
      }
      await persistDeal(input);
    },
    [persistDeal],
  );

  const buildDetailSlots = useCallback(
    ({ module, record, orgSlug: slotOrgSlug }: RecordDetailSlotsContext) => {
      moduleRef.current = module;
      recordRef.current = record;
      return {
        overviewPrefix: (
          <DealsStageOverview
            module={module}
            record={record}
            saveRecord={saveRecord}
            isSaving={updateRecord.isPending}
          />
        ),
        contactSummary: (
          <>
            <DealsContactPersonSummary
              dealRecord={record}
              contactRecordPath={(id) => moduleRecordPath(slotOrgSlug, "Contacts", id)}
              accountRecordPath={(id) => moduleRecordPath(slotOrgSlug, "Accounts", id)}
            />
            <DealsNextActionSummary
              dealId={record.id}
              recordPath={(module, id) => moduleRecordPath(slotOrgSlug, module, id)}
            />
          </>
        ),
        relatedRailAfterFooter: <DealsSalesSummary record={record} />,
      };
    },
    [saveRecord, updateRecord.isPending],
  );

  const verifyModule = moduleRef.current;
  const verifyStages = verifyModule ? buildStageBarStages(verifyModule) : [];

  return (
    <>
      {verifyOpen && verifyValues && verifyModule ? (
        <StageChangeDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) {
              setVerifyOpen(false);
              setVerifyValues(null);
            }
          }}
          stages={verifyStages}
          initialValues={verifyValues}
          reasonForLossOptions={reasonForLossPicklist(verifyModule)}
          showReasonForLoss={verifyLost}
          onSubmit={async (values) => {
            try {
              await persistDeal(stageChangeToRecordInput(values, verifyModule));
            } catch (error) {
              throw mapStageChangeError(error);
            }
            setVerifyOpen(false);
            setVerifyValues(null);
          }}
          isPending={updateRecord.isPending}
          currencyPrefix={homeCurrency.data?.symbol ?? "TL"}
        />
      ) : null}
      <RecordDetailScreen
        {...props}
        orgSlug={orgSlug}
        recordId={recordId}
        definition={definition}
        buildRelatedLists={buildRelatedLists}
        buildDetailSlots={buildDetailSlots}
        saveRecord={saveRecord}
      />
    </>
  );
}
