"use client";

import type { FieldDefinition, ModuleApiName, RecordData, RecordId } from "@crm/core/records";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  MergeComparison,
  MergeComparisonHeaderActions,
  MergeComparisonInfoButton,
} from "@/components/records/merge/merge-comparison";
import {
  MERGE_CONFIRM_MESSAGE,
  MERGE_CONFIRM_TITLE,
  MERGE_SUCCESS_MESSAGE,
  MERGE_SUCCESS_TITLE,
  resolveMatchingTableColumns,
} from "@/components/records/merge/merge-config";
import {
  buildMergeValues,
  defaultFieldChoices,
  fieldValueKey,
} from "@/components/records/merge/merge-field-selection";
import { MergeMatchingTable } from "@/components/records/merge/merge-matching-table";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icons } from "@/components/ui/icon";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { useDuplicateGroups, useMergeRecords, useUsers } from "@/lib/api/client/hooks";
import { useFormat } from "@/lib/format-context";
import type { ModuleMergeDefinition } from "@/modules/types";
import { DEDUP_MAX_MERGE_RECORDS, dedupConflictIntro, isDedupConflictGroup } from "./dedup-config";

const GROUP_PAGE_SIZE = 10;

type Step = "groups" | "choose" | "compare";

export interface DedupConflictGroupsProps {
  module: ModuleApiName;
  pluralLabel: string;
  linkField: string;
  fields: readonly FieldDefinition[];
  /** The match fields the cleanup ran on, in panel order. */
  apiNames: readonly string[];
  listHref: string;
  merge?: ModuleMergeDefinition;
}

/**
 * Conflict groups left by a module-wide cleanup. The groups are not stored, so they are found
 * again from the same fields; View hands a group over to the shared merge comparison.
 */
export function DedupConflictGroups({
  module,
  pluralLabel,
  linkField,
  fields,
  apiNames,
  listHref,
  merge,
}: DedupConflictGroupsProps) {
  const orgFormat = useFormat();
  const router = useRouter();
  const groupsQuery = useDuplicateGroups(module, apiNames);
  const usersQuery = useUsers();
  const mergeMutation = useMergeRecords(module);
  const [step, setStep] = useState<Step>("groups");
  const [activeField, setActiveField] = useState<string>(apiNames[0] ?? "");
  const [page, setPage] = useState(1);
  const [group, setGroup] = useState<readonly RecordData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<RecordId>>(() => new Set());
  const [masterId, setMasterId] = useState<RecordId>("");
  const [fieldChoices, setFieldChoices] = useState<Record<string, RecordId>>({});
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const conflictGroups = useMemo(
    () => (groupsQuery.data ?? []).filter(isDedupConflictGroup),
    [groupsQuery.data],
  );

  // Only an answered lookup may send the user back; a rejected one keeps the screen on the
  // error notice, so unresolved groups are never hidden behind a network failure.
  useEffect(() => {
    if (step !== "groups" || !groupsQuery.isSuccess) return;
    if (conflictGroups.length === 0) router.replace(listHref);
  }, [step, groupsQuery.isSuccess, conflictGroups.length, router, listHref]);

  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const user of usersQuery.data ?? []) map[user.userId] = user.name;
    return map;
  }, [usersQuery.data]);

  const panelFields = useMemo(
    () =>
      apiNames
        .map((apiName) => fields.find((field) => field.apiName === apiName))
        .filter((field): field is FieldDefinition => field !== undefined),
    [apiNames, fields],
  );
  const activePanelField =
    panelFields.find((field) => field.apiName === activeField) ?? panelFields[0];
  const rows = useMemo(
    () =>
      conflictGroups.map((item, index) => ({
        key: `${activeField}-${index}`,
        value: matchValue(item.records[0], activeField),
        count: item.records.length,
        records: item.records,
      })),
    [conflictGroups, activeField],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / GROUP_PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * GROUP_PAGE_SIZE, page * GROUP_PAGE_SIZE);
  const rangeStart = rows.length === 0 ? 0 : (page - 1) * GROUP_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * GROUP_PAGE_SIZE, rows.length);
  const duplicateIds = group.filter((record) => record.id !== masterId).map((record) => record.id);

  function openGroup(records: readonly RecordData[]) {
    setGroup(records);
    if (records.length > DEDUP_MAX_MERGE_RECORDS) {
      setSelectedIds(new Set(records.slice(0, DEDUP_MAX_MERGE_RECORDS).map((record) => record.id)));
      setStep("choose");
      return;
    }
    startComparison(records);
  }

  function startComparison(records: readonly RecordData[]) {
    const first = records[0];
    if (!first) return;
    setGroup(records);
    setMasterId(first.id);
    setFieldChoices(defaultFieldChoices(fields, records, first.id));
    setConflictsOnly(false);
    setStep("compare");
  }

  function selectAllFromRecord(sourceId: RecordId) {
    const next: Record<string, RecordId> = {};
    for (const field of fields) {
      if (field.readOnly) continue;
      const value = group.find((record) => record.id === sourceId)?.fields[field.apiName];
      if (fieldValueKey(value) !== "") next[field.apiName] = sourceId;
    }
    setFieldChoices(next);
    setMasterId(sourceId);
  }

  async function confirmMerge() {
    setMergeError(null);
    try {
      await mergeMutation.mutateAsync({
        masterId,
        duplicateIds,
        values: buildMergeValues(fields, group, fieldChoices),
      });
      setConfirmOpen(false);
      setGroup([]);
      setStep("groups");
      toast({ variant: "success", title: MERGE_SUCCESS_TITLE, message: MERGE_SUCCESS_MESSAGE });
    } catch (error) {
      setMergeError(error instanceof Error ? error.message : "Merge failed.");
      throw error;
    }
  }

  if (step === "compare" && group.length > 1) {
    return (
      <div className="dedup-conflict flex h-full min-h-0 flex-col" data-dedup-step="compare">
        <header className="flex items-center justify-between border-b border-panel-border px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-text">Merge Records</h1>
            <MergeComparisonInfoButton />
          </div>
          <MergeComparisonHeaderActions
            onCancel={() => setStep("groups")}
            onMerge={() => {
              setMergeError(null);
              setConfirmOpen(true);
            }}
            busy={mergeMutation.isPending}
          />
        </header>
        <div className="min-h-0 flex-1 overflow-hidden p-6">
          <MergeComparison
            records={group}
            fields={fields}
            masterId={masterId}
            fieldChoices={fieldChoices}
            conflictsOnly={conflictsOnly}
            ownerNames={ownerNames}
            format={orgFormat}
            displayNameField={linkField}
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

  if (step === "choose") {
    const columns = resolveMatchingTableColumns(merge, fields);
    const chosen = group.filter((record) => selectedIds.has(record.id));
    return (
      <div className="dedup-conflict flex h-full min-h-0 flex-col" data-dedup-step="choose">
        <header className="flex items-center justify-between border-b border-panel-border px-6 py-4">
          <h1 className="text-lg font-semibold text-text">Deduplicate {pluralLabel}</h1>
          <Button variant="secondary" onPress={() => setStep("groups")}>
            Cancel
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <p className="mb-3 text-sm text-text">
            This group has more than {DEDUP_MAX_MERGE_RECORDS} duplicates. Choose{" "}
            {DEDUP_MAX_MERGE_RECORDS} records to merge.
          </p>
          <MergeMatchingTable
            records={group}
            columns={columns}
            linkField={linkField}
            selectedIds={selectedIds}
            anchorId=""
            maxSelected={DEDUP_MAX_MERGE_RECORDS}
            ownerNames={ownerNames}
            format={orgFormat}
            emptyMessage="No records found."
            onToggle={(id, checked) =>
              setSelectedIds((current) => {
                const next = new Set(current);
                if (checked) {
                  if (next.size >= DEDUP_MAX_MERGE_RECORDS) return next;
                  next.add(id);
                } else {
                  next.delete(id);
                }
                return next;
              })
            }
          />
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              isDisabled={chosen.length < 2}
              onPress={() => startComparison(chosen)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dedup-conflict flex h-full min-h-0 flex-col" data-dedup-step="groups">
      <header className="flex items-center justify-between border-b border-panel-border px-6 py-4">
        <h1 className="text-lg font-semibold text-text">Deduplicate {pluralLabel}</h1>
        <Button variant="secondary" onPress={() => router.push(listHref)}>
          Cancel
        </Button>
      </header>
      <div className="dedup-conflict-body min-h-0 flex-1 overflow-auto bg-surface-muted p-6">
        {groupsQuery.isError ? (
          <div className="dedup-conflict-error flex flex-col gap-4">
            <Alert variant="danger">The page could not be loaded. Please try again.</Alert>
            <Button
              variant="secondary"
              className="self-start"
              onPress={() => void groupsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="rounded-(--radius-create-menu) border border-panel-border bg-surface p-6">
            <p className="mb-4 text-sm text-text">
              {dedupConflictIntro(panelFields.map((field) => field.label))}
            </p>
            <Tabs
              selectedKey={activePanelField?.apiName}
              onSelectionChange={(key) => {
                if (typeof key === "string") setActiveField(key);
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <TabList appearance="record" className="w-auto" aria-label="Duplicate match fields">
                  {panelFields.map((field) => (
                    <Tab key={field.apiName} id={field.apiName} appearance="record">
                      {field.label}
                    </Tab>
                  ))}
                </TabList>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text">
                    {rangeStart} - {rangeEnd}
                  </span>
                  <Button
                    variant="icon"
                    size="compact"
                    aria-label="Previous page"
                    isDisabled={page <= 1}
                    onPress={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <Icons.chevronLeft aria-hidden className="size-4" />
                  </Button>
                  <Button
                    variant="icon"
                    size="compact"
                    aria-label="Next page"
                    isDisabled={page >= pageCount}
                    onPress={() => setPage((current) => Math.min(pageCount, current + 1))}
                  >
                    <Icons.chevronRight aria-hidden className="size-4" />
                  </Button>
                </div>
              </div>
              <TabPanel id={activePanelField?.apiName}>
                <div className="overflow-hidden border border-panel-border">
                  <table
                    className="w-full border-collapse text-sm"
                    aria-label="Duplicate groups with conflicts"
                  >
                    <thead>
                      <tr className="border-b border-panel-border bg-surface-muted text-left">
                        <th scope="col" className="px-4 py-3 font-semibold text-text">
                          {activePanelField?.label ?? ""}
                        </th>
                        <th scope="col" className="px-4 py-3 font-semibold text-text">
                          Duplicates
                        </th>
                        <th scope="col" className="w-24 px-4 py-3">
                          {" "}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row) => (
                        <tr key={row.key} className="border-b border-row-separator">
                          <td className="px-4 py-3 text-text">{row.value}</td>
                          <td className="px-4 py-3 text-text">{row.count}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="secondary"
                              size="record"
                              onPress={() => openGroup(row.records)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

function matchValue(record: RecordData | undefined, apiName: string): string {
  const value = record?.fields[apiName];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}
