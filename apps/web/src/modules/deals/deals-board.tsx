"use client";

import { ValidationError } from "@crm/core/errors";
import { type FormatOptions, formatCurrency, formatNumber } from "@crm/core/format";
import type { FieldDefinition, ListQuery, ModuleMetadata, RecordData } from "@crm/core/records";
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
import { formatFieldValue } from "@/components/records/field-format";
import type { ModuleListBoardProps } from "@/components/records/list/module-list-screen";
import { toast } from "@/components/ui/toast";
import { invalidateModuleLists, useHomeCurrency, useRecordSummary } from "@/lib/api/client/hooks";
import { useClientRecordService } from "@/lib/api/client/provider";
import { apiKeys, summarizeQueriesPrefix } from "@/lib/api/client/query-keys";
import { moduleCreatePath, moduleRecordPath } from "@/lib/crm-paths";
import { useFormat } from "@/lib/format-context";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { combineCriteriaAnd } from "@/lib/records/filter-criteria";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import { useSelectedDealsKanbanView } from "./deals-kanban-selection";
import { dealsBoardToolbar } from "./deals-kanban-toolbar";
import { DEALS_LIST_CURRENCY_CODE } from "./list-config";

export function buildOptimisticDealCard(card: BoardCard, targetColumn: BoardColumn): BoardCard {
  return {
    ...card,
    rows: card.rows.map((row, index) =>
      (row.fieldKey ?? (index === 1 ? "Stage" : "")) === "Stage"
        ? { ...row, text: targetColumn.label }
        : row,
    ),
  };
}

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

/** Stored values of the terminal stages (Closed Won, Closed Lost, Closed Lost to Competition). */
function closedStageKeys(
  options: readonly { storedValue: string; stage?: { category?: string } }[],
): ReadonlySet<string> {
  return new Set(options.filter((o) => o.stage?.category !== "Open").map((o) => o.storedValue));
}

function localIsoDate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Open stage = not a terminal stage; a Closing Date before `now` (local day) is overdue. */
export function isOverdueClosingDate(
  closingDate: string,
  closedStage: boolean,
  now: Date,
): boolean {
  if (closedStage) return false;
  const match = closingDate.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? (match[1] as string) < localIsoDate(now) : false;
}

/** Card fields of the seeded stage view; used until a saved view is available. */
export const DEFAULT_DEAL_CARD_FIELDS: readonly string[] = [
  "Deal_Name",
  "Stage",
  "Account_Name",
  "Owner",
  "Contact_Name",
  "Amount",
  "Closing_Date",
];

type DealCardRow = NonNullable<BoardCard["rows"]>[number];

const LOOKUP_MODULES: Readonly<Record<string, string>> = {
  Account_Name: "Accounts",
  Contact_Name: "Contacts",
};

function lookupRow(
  value: RecordData["fields"][string] | undefined,
  moduleName: string,
  orgSlug: string,
): DealCardRow | null {
  if (value && typeof value === "object" && "id" in value && value.id) {
    const name =
      "name" in value && typeof value.name === "string" && value.name.trim()
        ? value.name.trim()
        : String(value.id);
    return { text: name, href: moduleRecordPath(orgSlug, moduleName, String(value.id)) };
  }
  if (typeof value === "string" && value.trim()) {
    return { text: value.trim(), href: moduleRecordPath(orgSlug, moduleName, value.trim()) };
  }
  return null;
}

export function buildDealCardRows(
  deal: RecordData,
  stageDisplayMap: Readonly<Record<string, string>>,
  ownerNames: Readonly<Record<string, string>>,
  orgSlug: string,
  options: {
    closedStages?: ReadonlySet<string>;
    now?: Date;
    /** Card field API names in display order; defaults to the seeded stage view. */
    fields?: readonly string[];
    fieldDefinitions?: readonly FieldDefinition[];
    format?: FormatOptions;
  } = {},
): readonly DealCardRow[] {
  const orgFormat = options.format ?? DEFAULT_FORMAT;
  const rows: DealCardRow[] = [];
  const push = (fieldKey: string, row: Omit<DealCardRow, "fieldKey"> | null) => {
    if (row) rows.push({ ...row, fieldKey });
  };

  for (const key of options.fields ?? DEFAULT_DEAL_CARD_FIELDS) {
    const value = deal.fields[key];
    if (key === "Deal_Name") {
      const name = typeof value === "string" ? value.trim() : "";
      push(
        key,
        name
          ? { text: name, href: moduleRecordPath(orgSlug, "Deals", deal.id), strong: true }
          : null,
      );
    } else if (key === "Stage") {
      const stage = typeof value === "string" ? value.trim() : "";
      const text = stage ? (stageDisplayMap[stage] ?? stage) : "";
      push(key, text ? { text } : null);
    } else if (key in LOOKUP_MODULES) {
      push(key, lookupRow(value, LOOKUP_MODULES[key] as string, orgSlug));
    } else if (key === "Owner") {
      const ownerId = typeof value === "string" ? value.trim() : "";
      const text = ownerId ? (ownerNames[ownerId] ?? ownerId) : "";
      push(key, text ? { text } : null);
    } else if (key === "Amount") {
      push(
        key,
        typeof value === "number"
          ? { text: formatCurrency(value, DEALS_LIST_CURRENCY_CODE, orgFormat) }
          : null,
      );
    } else if (key === "Closing_Date") {
      const closingDate = typeof value === "string" ? value.trim() : "";
      const formatted = closingDate ? formatClosingDate(closingDate) : "";
      if (formatted) {
        const stageKey = typeof deal.fields.Stage === "string" ? deal.fields.Stage : "";
        const overdue = isOverdueClosingDate(
          closingDate,
          options.closedStages?.has(stageKey) ?? false,
          options.now ?? new Date(),
        );
        push(key, overdue ? { text: formatted, tone: "danger" } : { text: formatted });
      }
    } else {
      const definition = options.fieldDefinitions?.find((f) => f.apiName === key);
      if (!definition || value === undefined) continue;
      const formatted = formatFieldValue(definition, value, ownerNames, orgFormat, {
        currencyCode: DEALS_LIST_CURRENCY_CODE,
        orgSlug,
      });
      if (formatted.kind === "text" || formatted.kind === "multiline") {
        push(key, { text: formatted.text });
      } else if (formatted.kind === "link") {
        push(key, { text: formatted.link.text, href: formatted.link.href });
      } else if (formatted.kind === "audit") {
        push(key, { text: formatted.name });
      }
    }
  }
  return rows;
}

/** Column total text for the summed field; `undefined` when the view has no Aggregate By. */
export function formatColumnTotal(
  sum: number,
  aggregateBy: string | null | undefined,
  fieldDefinitions: readonly FieldDefinition[],
  orgFormat: FormatOptions = DEFAULT_FORMAT,
): string | undefined {
  if (!aggregateBy) return undefined;
  const definition = fieldDefinitions.find((f) => f.apiName === aggregateBy);
  if (!definition || definition.dataType === "currency") {
    return formatCurrency(sum, DEALS_LIST_CURRENCY_CODE, orgFormat);
  }
  return formatNumber(sum, orgFormat);
}

export function buildDealsBoardProps(input: {
  records: readonly RecordData[];
  metadata: ModuleMetadata;
  orgSlug: string;
  ownerNames: Readonly<Record<string, string>>;
  format?: FormatOptions;
}): RecordBoardProps {
  const orgFormat = input.format ?? DEFAULT_FORMAT;
  const { records, metadata, orgSlug, ownerNames } = input;
  const stageField = metadata.fields.find((f) => f.apiName === "Stage");
  const stageOptions = stageField?.picklist ?? [];
  const closedStages = closedStageKeys(stageOptions);
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
      rows: buildDealCardRows(r, stageDisplayMap, ownerNames, orgSlug, {
        closedStages,
        format: orgFormat,
      }),
    }));
    return {
      key: opt.storedValue,
      label: opt.displayValue,
      count: stageRecords.length,
      percentage: `${opt.stage?.probability ?? 0}%`,
      totalText: formatCurrency(sum, DEALS_LIST_CURRENCY_CODE, orgFormat),
      cards,
    };
  });

  return {
    columns,
    toolbar: dealsBoardToolbar,
    buildOptimisticCard: buildOptimisticDealCard,
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
  const orgFormat = useFormat();
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

  const closedStages = useMemo(() => closedStageKeys(stageOptions), [stageOptions]);
  const homeCurrency = useHomeCurrency();

  const reasonForLossOptions = useMemo(() => {
    const reasonField = metadata.fields.find((f) => f.apiName === "Reason_For_Loss__s");
    return (reasonField?.picklist ?? [])
      .filter((opt) => opt.storedValue !== "-None-")
      .map((opt) => ({ storedValue: opt.storedValue, displayValue: opt.displayValue }));
  }, [metadata.fields]);

  // Summarize query for stage header counts and sums
  const { view: kanbanView } = useSelectedDealsKanbanView();
  const aggregateBy = kanbanView ? kanbanView.aggregateBy : "Amount";
  const cardFields = kanbanView?.fields ?? DEFAULT_DEAL_CARD_FIELDS;
  const summaryQuery = useMemo(
    () => ({
      viewId,
      ...(filters ? { filters } : {}),
      ...(search ? { search } : {}),
      groupBy: "Stage",
      ...(aggregateBy ? { sum: aggregateBy } : {}),
    }),
    [aggregateBy, filters, search, viewId],
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
        rows: buildDealCardRows(deal, stageDisplayMap, ownerNames, orgSlug, {
          closedStages,
          fields: cardFields,
          fieldDefinitions: metadata.fields,
          format: orgFormat,
        }),
      }));

      return {
        key: stage.storedValue,
        label: stage.displayValue,
        count,
        percentage: `${stage.stage?.probability ?? 0}%`,
        totalText: formatColumnTotal(sum ?? 0, aggregateBy, metadata.fields, orgFormat),
        cards,
      };
    });
  }, [
    stageOptions,
    stageQueries,
    summaryMap,
    stageDisplayMap,
    ownerNames,
    orgSlug,
    closedStages,
    cardFields,
    aggregateBy,
    metadata.fields,
    orgFormat,
  ]);

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
        buildOptimisticCard={buildOptimisticDealCard}
        loading={isLoading}
        headerStyle={kanbanView?.headerStyle}
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
          currencyPrefix={homeCurrency.data?.symbol ?? "TL"}
        />
      ) : null}
    </>
  );
}
