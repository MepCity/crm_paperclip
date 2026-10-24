"use client";

import { ForbiddenError } from "@crm/core/errors";
import type { ModuleApiName, RecordData, RecordId } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Select, SelectItem } from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { toast } from "@/components/ui/toast";
import {
  useMergeRecords,
  useModule,
  useRecord,
  useRecordList,
  useUsers,
  useViews,
} from "@/lib/api/client/hooks";
import { useClientRecordService } from "@/lib/api/client/provider";
import { DEFAULT_FORMAT } from "@/lib/locale";
import type { ModuleScreenDefinition } from "@/modules/types";
import {
  MergeComparison,
  MergeComparisonHeaderActions,
  MergeComparisonInfoButton,
} from "./merge-comparison";
import {
  MERGE_CONFIRM_MESSAGE,
  MERGE_CONFIRM_TITLE,
  MERGE_SUCCESS_MESSAGE,
  MERGE_SUCCESS_TITLE,
  resolveMatchingTableColumns,
  resolveMergeCriterionFields,
} from "./merge-config";
import {
  buildMergeSearchCriteria,
  comparatorForField,
  fieldValueToCriterionString,
  initialCriterionRows,
  type MergeCriterionRow,
  type MergeGroupOperator,
} from "./merge-criteria";
import { buildMergeValues, defaultFieldChoices, fieldValueKey } from "./merge-field-selection";
import { MergeMatchingTable } from "./merge-matching-table";
import "./merge-duplicates.css";

const LIST_PAGE_SIZE = 30;
const MAX_SELECTED = 3;

type Step = "search" | "compare";

export type MergeDuplicatesScreenProps = {
  orgSlug: string;
  recordId: RecordId;
  definition: ModuleScreenDefinition;
  paths: {
    record: (orgSlug: string, module: ModuleApiName, recordId: RecordId) => string;
    defaultList: (orgSlug: string, module: ModuleApiName) => string;
  };
};

export function MergeDuplicatesScreen({
  orgSlug,
  recordId,
  definition,
  paths,
}: MergeDuplicatesScreenProps) {
  const module = definition.apiName;
  const mergeDefinition = definition.merge;
  const router = useRouter();
  const recordService = useClientRecordService();
  const moduleQuery = useModule(module);
  const sourceQuery = useRecord(module, recordId);
  const viewsQuery = useViews(module);
  const usersQuery = useUsers();
  const mergeMutation = useMergeRecords(module);

  const [step, setStep] = useState<Step>("search");
  const [groupOperator, setGroupOperator] = useState<MergeGroupOperator>("and");
  const [criteriaRows, setCriteriaRows] = useState<MergeCriterionRow[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [appliedCriteria, setAppliedCriteria] = useState<ReturnType<
    typeof buildMergeSearchCriteria
  > | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<RecordId>>(() => new Set([recordId]));
  const [compareRecords, setCompareRecords] = useState<readonly RecordData[]>([]);
  const [masterId, setMasterId] = useState<RecordId>(recordId);
  const [fieldChoices, setFieldChoices] = useState<Record<string, RecordId>>({});
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [compareLoadError, setCompareLoadError] = useState<string | null>(null);
  const [selectedRecordCache, setSelectedRecordCache] = useState<Map<RecordId, RecordData>>(
    () => new Map(),
  );

  const defaultViewId = viewsQuery.data?.find((view) => view.isDefault)?.id ?? "";
  const criterionFields = useMemo(
    () =>
      moduleQuery.data && mergeDefinition
        ? resolveMergeCriterionFields(mergeDefinition, moduleQuery.data.fields)
        : [],
    [mergeDefinition, moduleQuery.data],
  );

  useEffect(() => {
    if (!sourceQuery.data) return;
    setSelectedRecordCache((current) => {
      const next = new Map(current);
      next.set(recordId, sourceQuery.data);
      return next;
    });
  }, [sourceQuery.data, recordId]);

  useEffect(() => {
    if (!sourceQuery.data || criterionFields.length === 0) return;
    setCriteriaRows(initialCriterionRows(criterionFields, sourceQuery.data));
  }, [sourceQuery.data, criterionFields]);

  const listQuery = useMemo(
    () => ({
      viewId: defaultViewId,
      page: searchPage,
      perPage: LIST_PAGE_SIZE,
      filters: appliedCriteria ?? undefined,
    }),
    [defaultViewId, searchPage, appliedCriteria],
  );

  const listQueryEnabled =
    Boolean(defaultViewId) && hasSearched && Boolean(mergeDefinition) && criterionFields.length > 0;
  const listResult = useRecordList(module, listQuery, { enabled: listQueryEnabled });

  const matchingColumns = useMemo(
    () =>
      moduleQuery.data && mergeDefinition
        ? resolveMatchingTableColumns(mergeDefinition, moduleQuery.data.fields)
        : [],
    [mergeDefinition, moduleQuery.data],
  );

  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const user of usersQuery.data ?? []) map[user.userId] = user.name;
    return map;
  }, [usersQuery.data]);

  const displayRecords = useMemo(() => {
    const source = sourceQuery.data;
    if (!hasSearched) return source ? [source] : [];
    const rows = listResult.data?.records ?? [];
    if (!source) return rows;
    const merged = new Map(rows.map((row) => [row.id, row]));
    merged.set(source.id, source);
    return [...merged.values()];
  }, [listResult.data?.records, sourceQuery.data, hasSearched]);

  const selectedCount = selectedIds.size;
  const canProceed = selectedCount === 2 || selectedCount === 3;

  const runSearch = useCallback(() => {
    if (!mergeDefinition || criterionFields.length === 0) return;
    const criteria = buildMergeSearchCriteria(criteriaRows, groupOperator);
    setAppliedCriteria(criteria);
    setHasSearched(true);
    setSearchPage(1);
    setSelectedIds(new Set([recordId]));
    setSelectedRecordCache(sourceQuery.data ? new Map([[recordId, sourceQuery.data]]) : new Map());
    setCompareLoadError(null);
  }, [
    criteriaRows,
    groupOperator,
    recordId,
    mergeDefinition,
    criterionFields.length,
    sourceQuery.data,
  ]);

  const toggleRow = useCallback(
    (id: RecordId, checked: boolean) => {
      setCompareLoadError(null);
      setSelectedIds((current) => {
        const next = new Set(current);
        if (checked) {
          if (next.size >= MAX_SELECTED) return next;
          next.add(id);
        } else if (id !== recordId) {
          next.delete(id);
        }
        return next;
      });
      if (checked) {
        const row = displayRecords.find((item) => item.id === id);
        if (row) {
          setSelectedRecordCache((current) => {
            const next = new Map(current);
            next.set(id, row);
            return next;
          });
        }
      } else if (id !== recordId) {
        setSelectedRecordCache((current) => {
          const next = new Map(current);
          next.delete(id);
          return next;
        });
      }
    },
    [recordId, displayRecords],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set([recordId]));
    setSelectedRecordCache(sourceQuery.data ? new Map([[recordId, sourceQuery.data]]) : new Map());
    setCompareLoadError(null);
  }, [recordId, sourceQuery.data]);

  const goToCompare = useCallback(async () => {
    setCompareLoadError(null);
    const ids = [...selectedIds];
    const byId = new Map<RecordId, RecordData>();
    const missingIds: RecordId[] = [];
    for (const id of ids) {
      const cached = selectedRecordCache.get(id);
      if (cached) byId.set(id, cached);
      else missingIds.push(id);
    }
    try {
      for (const id of missingIds) {
        const row = await recordService.get(module, id);
        byId.set(id, row);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load the selected records.";
      setCompareLoadError(message);
      return;
    }
    const records = ids
      .map((id) => byId.get(id))
      .filter((row): row is RecordData => row !== undefined);
    if (records.length < 2) {
      setCompareLoadError("Could not load the selected records.");
      return;
    }
    setCompareRecords(records);
    setMasterId(recordId);
    const fields = moduleQuery.data?.fields ?? [];
    setFieldChoices(defaultFieldChoices(fields, records, recordId));
    setConflictsOnly(false);
    setStep("compare");
  }, [selectedIds, selectedRecordCache, recordService, module, recordId, moduleQuery.data?.fields]);

  const duplicateIds = useMemo(
    () => [...selectedIds].filter((id) => id !== masterId),
    [selectedIds, masterId],
  );

  const confirmMerge = useCallback(async () => {
    setMergeError(null);
    const fields = moduleQuery.data?.fields ?? [];
    const values = buildMergeValues(fields, compareRecords, fieldChoices);
    try {
      const merged = await mergeMutation.mutateAsync({
        masterId,
        duplicateIds,
        values,
      });
      setConfirmOpen(false);
      toast({ variant: "success", title: MERGE_SUCCESS_TITLE, message: MERGE_SUCCESS_MESSAGE });
      router.push(paths.record(orgSlug, module, merged.id));
    } catch (error) {
      const message =
        error instanceof ForbiddenError
          ? "You do not have permission to merge records."
          : error instanceof Error
            ? error.message
            : "Merge failed.";
      setMergeError(message);
      toast({ variant: "danger", title: "Merge failed", message });
      throw error;
    }
  }, [
    moduleQuery.data?.fields,
    compareRecords,
    fieldChoices,
    mergeMutation,
    masterId,
    duplicateIds,
    router,
    paths,
    orgSlug,
    module,
  ]);

  const selectAllFromRecord = useCallback(
    (sourceId: RecordId) => {
      const fields = moduleQuery.data?.fields ?? [];
      const next: Record<string, RecordId> = { ...fieldChoices };
      for (const field of fields) {
        if (field.readOnly) continue;
        const value = compareRecords.find((record) => record.id === sourceId)?.fields[
          field.apiName
        ];
        if (fieldValueKey(value) !== "") next[field.apiName] = sourceId;
      }
      setFieldChoices(next);
      setMasterId(sourceId);
    },
    [moduleQuery.data?.fields, fieldChoices, compareRecords],
  );

  if (moduleQuery.isLoading || sourceQuery.isLoading || viewsQuery.isLoading) {
    return <div className="merge-duplicates-loading p-6" aria-busy="true" />;
  }
  if (!moduleQuery.data || !sourceQuery.data) {
    return <div className="p-6 text-md text-text">Record not found.</div>;
  }

  if (!mergeDefinition) {
    return (
      <div className="p-6 text-md text-text">Find and merge is not available for this module.</div>
    );
  }

  const displayNameField = definition.list.linkField;
  const detailHref = paths.record(orgSlug, module, recordId);

  if (step === "compare") {
    return (
      <div className="merge-duplicates flex h-full min-h-0 flex-col" data-merge-step="compare">
        <header className="flex items-center justify-between border-b border-panel-border px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-text">Merge Records</h1>
            <MergeComparisonInfoButton />
          </div>
          <MergeComparisonHeaderActions
            onCancel={() => router.push(detailHref)}
            onMerge={() => {
              setMergeError(null);
              setConfirmOpen(true);
            }}
            busy={mergeMutation.isPending}
          />
        </header>
        <div className="min-h-0 flex-1 overflow-hidden p-6">
          <MergeComparison
            records={compareRecords}
            fields={moduleQuery.data.fields}
            masterId={masterId}
            fieldChoices={fieldChoices}
            conflictsOnly={conflictsOnly}
            ownerNames={ownerNames}
            format={DEFAULT_FORMAT}
            displayNameField={displayNameField}
            onMasterChange={setMasterId}
            onFieldChoiceChange={(fieldApiName, id) =>
              setFieldChoices((current) => ({ ...current, [fieldApiName]: id }))
            }
            onSelectAllFromRecord={selectAllFromRecord}
            onConflictsOnlyChange={setConflictsOnly}
          />
        </div>
        {confirmOpen ? (
          <ConfirmDialog
            isOpen
            onOpenChange={(open) => {
              if (!open && !mergeMutation.isPending) setConfirmOpen(false);
            }}
            title={MERGE_CONFIRM_TITLE}
            message={MERGE_CONFIRM_MESSAGE}
            confirmLabel="Merge"
            cancelLabel="Cancel"
            tone="danger"
            busy={mergeMutation.isPending}
            errorMessage={mergeError}
            onConfirm={confirmMerge}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="merge-duplicates flex h-full min-h-0 flex-col" data-merge-step="search">
      <header className="border-b border-panel-border px-6 py-4">
        <h1 className="text-lg font-semibold text-text">Find and Merge Duplicates</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <section className="merge-criteria mb-8" aria-label="Search criteria">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-md font-semibold text-text">Search Criteria</h2>
            <Select
              label="Match any of the criteria below"
              hideLabel
              selectedKey={groupOperator}
              onSelectionChange={(key) => {
                if (key === "and" || key === "or") setGroupOperator(key);
              }}
              items={[
                { id: "and", label: "Match all of the criteria below" },
                { id: "or", label: "Match any of the criteria below" },
              ]}
            >
              {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
            </Select>
          </div>
          <ul className="flex flex-col gap-3">
            {criteriaRows.map((row, index) => {
              const field =
                criterionFields.find((item) => item.apiName === row.fieldApiName) ??
                criterionFields[index];
              if (!field) return null;
              return (
                <li key={row.id} className="flex flex-wrap items-end gap-2">
                  <Select
                    label={field.label}
                    selectedKey={row.fieldApiName}
                    onSelectionChange={(key) => {
                      if (typeof key !== "string") return;
                      const nextField = criterionFields.find((item) => item.apiName === key);
                      if (!nextField) return;
                      setCriteriaRows((rows) =>
                        rows.map((item) =>
                          item.id === row.id
                            ? {
                                ...item,
                                fieldApiName: key,
                                comparator: comparatorForField(nextField),
                              }
                            : item,
                        ),
                      );
                    }}
                    items={criterionFields.map((item) => ({
                      id: item.apiName,
                      label: item.label,
                    }))}
                    className="min-w-[10rem]"
                  >
                    {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                  </Select>
                  <Select
                    label="Operator"
                    hideLabel
                    selectedKey={row.comparator}
                    onSelectionChange={(key) => {
                      if (key !== "contains" && key !== "equal") return;
                      setCriteriaRows((rows) =>
                        rows.map((item) =>
                          item.id === row.id ? { ...item, comparator: key } : item,
                        ),
                      );
                    }}
                    items={[
                      { id: "contains", label: "contains" },
                      { id: "equal", label: "equals" },
                    ]}
                    className="min-w-[8rem]"
                  >
                    {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                  </Select>
                  <TextField
                    label="Value field"
                    hideLabel
                    value={row.value}
                    onChange={(value) =>
                      setCriteriaRows((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, value } : item)),
                      )
                    }
                    className="min-w-[12rem] flex-1"
                  />
                  <Button
                    variant="icon"
                    size="compact"
                    aria-label="Remove criterion"
                    onPress={() =>
                      setCriteriaRows((rows) => rows.filter((item) => item.id !== row.id))
                    }
                  >
                    <Icons.close aria-hidden className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="icon"
              size="compact"
              aria-label="Add criterion"
              onPress={() => {
                const unused = criterionFields.find(
                  (field) => !criteriaRows.some((row) => row.fieldApiName === field.apiName),
                );
                if (!unused) return;
                setCriteriaRows((rows) => [
                  ...rows,
                  {
                    id: `criterion-${rows.length}`,
                    fieldApiName: unused.apiName,
                    comparator: comparatorForField(unused),
                    value: fieldValueToCriterionString(sourceQuery.data.fields[unused.apiName]),
                  },
                ]);
              }}
            >
              <Icons.plus aria-hidden className="size-4" />
            </Button>
            <Button
              variant="primary"
              onPress={runSearch}
              aria-label="Search"
              isDisabled={criterionFields.length === 0}
            >
              Search
            </Button>
          </div>
        </section>

        <section className="merge-matching" aria-label="Matching records">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm text-text">
              {selectedCount} record{selectedCount === 1 ? "" : "s"} selected
            </p>
            <div className="flex items-center gap-2">
              <Link href="#clear" variant="body" onPress={clearSelection}>
                Clear
              </Link>
              <Button variant="primary" isDisabled={!canProceed} onPress={() => void goToCompare()}>
                Next
              </Button>
              {compareLoadError ? (
                <p className="text-sm text-danger" role="alert">
                  {compareLoadError}
                </p>
              ) : null}
              <Button
                variant="icon"
                size="compact"
                aria-label="Previous page"
                isDisabled={searchPage <= 1}
                onPress={() => setSearchPage((page) => Math.max(1, page - 1))}
              >
                <Icons.chevronLeft aria-hidden className="size-4" />
              </Button>
              <Button
                variant="icon"
                size="compact"
                aria-label="Next page"
                isDisabled={!listResult.data?.moreRecords}
                onPress={() => setSearchPage((page) => page + 1)}
              >
                <Icons.chevronRight aria-hidden className="size-4" />
              </Button>
            </div>
          </div>
          <MergeMatchingTable
            records={displayRecords}
            columns={matchingColumns}
            linkField={displayNameField}
            selectedIds={selectedIds}
            anchorId={recordId}
            maxSelected={MAX_SELECTED}
            ownerNames={ownerNames}
            format={DEFAULT_FORMAT}
            emptyMessage="No records found."
            onToggle={toggleRow}
          />
        </section>
      </div>
      <footer className="border-t border-panel-border px-6 py-3">
        <Button variant="secondary" onPress={() => router.push(detailHref)}>
          Cancel
        </Button>
      </footer>
    </div>
  );
}
