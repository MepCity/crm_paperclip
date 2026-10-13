"use client";

import { ValidationError } from "@crm/core/errors";
import { formatCurrency } from "@crm/core/format";
import type { ListQuery, ModuleMetadata, RecordData } from "@crm/core/records";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  type BoardCard,
  type BoardColumn,
  type BoardMoveResult,
  RecordBoard,
  type RecordBoardProps,
} from "@/components/records/board/record-board";
import {
  type StageBarStage,
  StageChangeDialog,
  type StageChangeFormValues,
  StageChangeSubmitError,
} from "@/components/records/detail/stage-bar";
import type { ModuleListBoardProps } from "@/components/records/list/module-list-screen";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { toast } from "@/components/ui/toast";
import { invalidateModuleLists, useRecordSummary } from "@/lib/api/client/hooks";
import { useClientRecordService } from "@/lib/api/client/provider";
import { apiKeys, summarizeQueriesPrefix } from "@/lib/api/client/query-keys";
import { moduleCreatePath, moduleRecordPath } from "@/lib/crm-paths";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { combineCriteriaAnd } from "@/lib/records/filter-criteria";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import { DEALS_LIST_CURRENCY_CODE } from "./list-config";

export const dealsBoardToolbar = (
  <>
    <select
      aria-label="Board grouping"
      className="rounded border border-control-border bg-surface px-2 py-1"
      defaultValue="STAGEVIEW"
    >
      <option value="STAGEVIEW">STAGEVIEW</option>
    </select>
    <Button variant="ghost" aria-label="Board settings">
      <Icons.fieldEdit aria-hidden className="h-4 w-4" />
    </Button>
  </>
);

export function formatClosingDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}.${m}.${y}`;
  }
  return trimmed;
}

export function buildDealCardRows(
  deal: RecordData,
  stageDisplayMap: Readonly<Record<string, string>>,
  ownerNames: Readonly<Record<string, string>>,
  orgSlug: string,
): readonly { text: string; href?: string }[] {
  const rows: { text: string; href?: string }[] = [];

  // 1. Deal Name (link to detail)
  const dealName = typeof deal.fields.Deal_Name === "string" ? deal.fields.Deal_Name.trim() : "";
  if (dealName) {
    rows.push({
      text: dealName,
      href: moduleRecordPath(orgSlug, "Deals", deal.id),
    });
  }

  // 2. Stage (plain text)
  const stageVal = typeof deal.fields.Stage === "string" ? deal.fields.Stage.trim() : "";
  const stageText = stageVal ? (stageDisplayMap[stageVal] ?? stageVal) : "";
  if (stageText) {
    rows.push({ text: stageText });
  }

  // 3. Account Name (link to account if present)
  const accountRef = deal.fields.Account_Name;
  if (accountRef && typeof accountRef === "object" && "id" in accountRef && accountRef.id) {
    const name =
      "name" in accountRef && typeof accountRef.name === "string" && accountRef.name.trim()
        ? accountRef.name.trim()
        : String(accountRef.id);
    rows.push({
      text: name,
      href: moduleRecordPath(orgSlug, "Accounts", String(accountRef.id)),
    });
  } else if (typeof accountRef === "string" && accountRef.trim()) {
    rows.push({
      text: accountRef.trim(),
      href: moduleRecordPath(orgSlug, "Accounts", accountRef.trim()),
    });
  }

  // 4. Deal Owner (plain text)
  const ownerId = typeof deal.fields.Owner === "string" ? deal.fields.Owner.trim() : "";
  const ownerText = ownerId ? (ownerNames[ownerId] ?? ownerId) : "";
  if (ownerText) {
    rows.push({ text: ownerText });
  }

  // 5. Contact Name (link to contact if present)
  const contactRef = deal.fields.Contact_Name;
  if (contactRef && typeof contactRef === "object" && "id" in contactRef && contactRef.id) {
    const name =
      "name" in contactRef && typeof contactRef.name === "string" && contactRef.name.trim()
        ? contactRef.name.trim()
        : String(contactRef.id);
    rows.push({
      text: name,
      href: moduleRecordPath(orgSlug, "Contacts", String(contactRef.id)),
    });
  } else if (typeof contactRef === "string" && contactRef.trim()) {
    rows.push({
      text: contactRef.trim(),
      href: moduleRecordPath(orgSlug, "Contacts", contactRef.trim()),
    });
  }

  // 6. Amount (currency formatted text)
  if (typeof deal.fields.Amount === "number") {
    rows.push({
      text: formatCurrency(deal.fields.Amount, DEALS_LIST_CURRENCY_CODE, DEFAULT_FORMAT),
    });
  }

  // 7. Closing Date (dd.MM.yyyy text)
  const closingDate =
    typeof deal.fields.Closing_Date === "string" ? deal.fields.Closing_Date.trim() : "";
  if (closingDate) {
    const formatted = formatClosingDate(closingDate);
    if (formatted) {
      rows.push({ text: formatted });
    }
  }

  return rows;
}

export function buildDealsBoardProps(input: {
  records: readonly RecordData[];
  metadata: ModuleMetadata;
  orgSlug: string;
  ownerNames: Readonly<Record<string, string>>;
}): RecordBoardProps {
  const { records, metadata, orgSlug, ownerNames } = input;
  const stageField = metadata.fields.find((f) => f.apiName === "Stage");
  const stageOptions = stageField?.picklist ?? [];
  const stageDisplayMap: Record<string, string> = {};
  for (const opt of stageOptions) {
    stageDisplayMap[opt.storedValue] = opt.displayValue;
  }

  const columns: BoardColumn[] = stageOptions.map((opt) => {
    const stageRecords = records.filter((r) => r.fields.Stage === opt.storedValue);
    const sum = stageRecords.reduce(
      (total, r) => total + (typeof r.fields.Amount === "number" ? r.fields.Amount : 0),
      0,
    );
    const cards: BoardCard[] = stageRecords.map((r) => ({
      id: r.id,
      rows: buildDealCardRows(r, stageDisplayMap, ownerNames, orgSlug),
    }));
    return {
      key: opt.storedValue,
      label: opt.displayValue,
      count: stageRecords.length,
      percentage: `${opt.stage?.probability ?? 0}%`,
      totalText: formatCurrency(sum, DEALS_LIST_CURRENCY_CODE, DEFAULT_FORMAT),
      cards,
    };
  });

  return {
    columns,
    toolbar: dealsBoardToolbar,
    createLabel: "Create Deal",
    onCreate: () => {},
    onMove: async () => {},
  };
}

interface PendingMoveState {
  cardId: string;
  fromKey: string;
  toKey: string;
  initialValues: StageChangeFormValues;
  showReasonForLoss: boolean;
  resolve: (result: BoardMoveResult) => void;
}

export function DealsBoard({
  metadata,
  orgSlug,
  ownerNames,
  viewId,
  filters,
  search,
  sort,
  perPage,
}: ModuleListBoardProps) {
  const router = useRouter();
  const service = useClientRecordService();
  const queryClient = useQueryClient();
  const [pendingMove, setPendingMove] = useState<PendingMoveState | null>(null);

  const stageField = metadata.fields.find((f) => f.apiName === "Stage");
  const stageOptions = useMemo(() => stageField?.picklist ?? [], [stageField]);

  const stageDisplayMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const opt of stageOptions) {
      map[opt.storedValue] = opt.displayValue;
    }
    return map;
  }, [stageOptions]);

  const dialogStages: readonly StageBarStage[] = useMemo(
    () =>
      stageOptions.map((s) => ({
        label: s.displayValue,
        value: s.storedValue,
        kind:
          s.stage?.category === "Closed Won"
            ? "won"
            : s.stage?.category === "Closed Lost"
              ? "lost"
              : "open",
        stage: s.stage,
      })),
    [stageOptions],
  );

  const reasonForLossOptions = useMemo(() => {
    const reasonField = metadata.fields.find((f) => f.apiName === "Reason_For_Loss__s");
    return (reasonField?.picklist ?? [])
      .filter((opt) => opt.storedValue !== "-None-")
      .map((opt) => ({ storedValue: opt.storedValue, displayValue: opt.displayValue }));
  }, [metadata.fields]);

  // Summarize query for stage header counts and sums
  const summaryQuery = useMemo(
    () => ({
      viewId,
      ...(filters ? { filters } : {}),
      ...(search ? { search } : {}),
      groupBy: "Stage",
      sum: "Amount",
    }),
    [filters, search, viewId],
  );
  const summary = useRecordSummary("Deals", summaryQuery, { enabled: Boolean(viewId) });

  const summaryMap = useMemo(() => {
    const map = new Map<string, { count: number; sum: number | null }>();
    for (const item of summary.data ?? []) {
      if (item.value !== null) {
        map.set(item.value, { count: item.count, sum: item.sum });
      }
    }
    return map;
  }, [summary.data]);

  // Stage queries: per-column card loading
  const stageQueries = useQueries({
    queries: stageOptions.map((stage) => {
      const stageCriteria = combineCriteriaAnd([
        filters,
        { field: "Stage", comparator: "equal", value: stage.storedValue },
      ]);
      const query: ListQuery = {
        viewId,
        page: 1,
        perPage,
        ...(stageCriteria ? { filters: stageCriteria } : {}),
        ...(sort ? { sort } : {}),
        ...(search ? { search } : {}),
      };
      return {
        queryKey: apiKeys.list(orgSlug, "Deals", query),
        queryFn: () => service.list("Deals", query),
        enabled: Boolean(viewId),
      };
    }),
  });

  const columns = useMemo((): readonly BoardColumn[] => {
    return stageOptions.map((stage, index) => {
      const queryData = stageQueries[index]?.data;
      const records = queryData?.records ?? [];
      const summaryItem = summaryMap.get(stage.storedValue);
      const count = summaryItem?.count ?? records.length;
      const sum = summaryItem?.sum ?? 0;

      const cards: BoardCard[] = records.map((deal) => ({
        id: deal.id,
        rows: buildDealCardRows(deal, stageDisplayMap, ownerNames, orgSlug),
      }));

      return {
        key: stage.storedValue,
        label: stage.displayValue,
        count,
        percentage: `${stage.stage?.probability ?? 0}%`,
        totalText: formatCurrency(sum ?? 0, DEALS_LIST_CURRENCY_CODE, DEFAULT_FORMAT),
        cards,
      };
    });
  }, [stageOptions, stageQueries, summaryMap, stageDisplayMap, ownerNames, orgSlug]);

  const handleCreate = useCallback(
    (stageKey: string) => {
      writeRecordCreatePrefill(orgSlug, {
        module: "Deals",
        fields: { Stage: stageKey },
      });
      router.push(`${moduleCreatePath(orgSlug, "Deals")}?Stage=${encodeURIComponent(stageKey)}`);
    },
    [orgSlug, router],
  );

  const handleMove = useCallback(
    async (cardId: string, fromKey: string, toKey: string): Promise<BoardMoveResult> => {
      const targetStage = stageOptions.find((s) => s.storedValue === toKey);
      if (!targetStage) return "cancelled";

      // Look up card's deal data across stage queries
      let deal: RecordData | undefined;
      for (const query of stageQueries) {
        deal = query.data?.records.find((r) => r.id === cardId);
        if (deal) break;
      }

      if (targetStage.stage?.category === "Open") {
        try {
          await service.update("Deals", cardId, { Stage: toKey });
          invalidateModuleLists(queryClient, orgSlug, "Deals", cardId);
          void queryClient.invalidateQueries({
            queryKey: summarizeQueriesPrefix(orgSlug, "Deals"),
          });
          return "moved";
        } catch (error) {
          toast({
            variant: "danger",
            title: "Update failed",
            message: error instanceof Error ? error.message : "Failed to update deal stage.",
          });
          return "cancelled";
        }
      }

      // Target stage is Closed Won or Closed Lost -> open Verify Details modal
      const isLost = targetStage.stage?.category === "Closed Lost";
      return new Promise<BoardMoveResult>((resolve) => {
        setPendingMove({
          cardId,
          fromKey,
          toKey,
          initialValues: {
            amount: typeof deal?.fields.Amount === "number" ? deal.fields.Amount : null,
            closingDate:
              typeof deal?.fields.Closing_Date === "string" ? deal.fields.Closing_Date : "",
            stage: toKey,
            reasonForLoss:
              isLost && typeof deal?.fields.Reason_For_Loss__s === "string"
                ? deal.fields.Reason_For_Loss__s
                : null,
          },
          showReasonForLoss: isLost,
          resolve,
        });
      });
    },
    [orgSlug, queryClient, service, stageOptions, stageQueries],
  );

  const handleDialogSubmit = useCallback(
    async (values: StageChangeFormValues) => {
      if (!pendingMove) return;
      const targetStage = stageOptions.find((s) => s.storedValue === values.stage);
      const isLost = targetStage?.stage?.category === "Closed Lost";
      try {
        await service.update("Deals", pendingMove.cardId, {
          Stage: values.stage,
          Amount: values.amount,
          Closing_Date: values.closingDate,
          ...(isLost ? { Reason_For_Loss__s: values.reasonForLoss } : { Reason_For_Loss__s: null }),
        });
        invalidateModuleLists(queryClient, orgSlug, "Deals", pendingMove.cardId);
        void queryClient.invalidateQueries({
          queryKey: summarizeQueriesPrefix(orgSlug, "Deals"),
        });
        pendingMove.resolve(values.stage === pendingMove.toKey ? "moved" : { to: values.stage });
        setPendingMove(null);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new StageChangeSubmitError({
            amount: error.fieldErrors.Amount?.[0],
            closingDate: error.fieldErrors.Closing_Date?.[0],
            stage: error.fieldErrors.Stage?.[0],
            reasonForLoss: error.fieldErrors.Reason_For_Loss__s?.[0],
          });
        }
        pendingMove.resolve("cancelled");
        setPendingMove(null);
        toast({
          variant: "danger",
          title: "Update failed",
          message: error instanceof Error ? error.message : "Failed to update deal.",
        });
      }
    },
    [orgSlug, pendingMove, queryClient, service, stageOptions],
  );

  const handleDialogCancel = useCallback(() => {
    if (pendingMove) {
      pendingMove.resolve("cancelled");
      setPendingMove(null);
    }
  }, [pendingMove]);

  const isLoading = summary.isLoading || stageQueries.some((q) => q.isLoading && !q.data);

  return (
    <>
      <RecordBoard
        columns={columns}
        createLabel="Create Deal"
        onCreate={handleCreate}
        onMove={handleMove}
        loading={isLoading}
      />
      {pendingMove ? (
        <StageChangeDialog
          isOpen
          onOpenChange={(open) => {
            if (!open) handleDialogCancel();
          }}
          stages={dialogStages}
          initialValues={pendingMove.initialValues}
          reasonForLossOptions={reasonForLossOptions}
          showReasonForLoss={pendingMove.showReasonForLoss}
          onSubmit={handleDialogSubmit}
        />
      ) : null}
    </>
  );
}
